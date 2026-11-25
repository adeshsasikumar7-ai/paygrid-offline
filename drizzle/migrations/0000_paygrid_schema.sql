create type public.app_role as enum ('worker','resident');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  meter_id varchar(64),
  agent_id varchar(64),
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
create table public.meters (
  meter_id varchar(64) primary key,
  consumer_name varchar(120),
  context_mode varchar(16) not null default 'urban',
  billing_type varchar(16) not null default 'prepaid',
  scale_factor numeric(10,4) not null default 1.0,
  nominal_grid_v numeric(8,2) not null default 230.0,
  per_unit_rate numeric(10,4) not null default 6.50,
  prepaid_balance numeric(12,4) not null default 0,
  postpaid_units numeric(12,6) not null default 0,
  postpaid_due numeric(12,4) not null default 0,
  relay_state smallint not null default 0,
  reed_tamper_state smallint not null default 0,
  tamper_status varchar(32) not null default 'NORMAL',
  sync_status varchar(24) not null default 'SYNCED',
  pending_queue_count integer not null default 0,
  last_power_w numeric(12,4) not null default 0,
  last_current_a numeric(12,6) not null default 0,
  last_seen_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.meter_secrets (
  meter_id varchar(64) primary key references public.meters(meter_id) on delete cascade,
  device_key text not null
);
create table public.app_settings (key text primary key, value text not null);
create table public.users_cards (
  card_uid varchar(64) primary key,
  consumer_id varchar(64) not null unique,
  consumer_name varchar(120),
  meter_id varchar(64) references public.meters(meter_id),
  context_mode varchar(16) not null default 'rural',
  ration_profile_ref varchar(64),
  card_balance numeric(12,4) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.telemetry_logs (
  id bigserial primary key,
  event_id varchar(64) not null unique,
  meter_id varchar(64) not null references public.meters(meter_id),
  recorded_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  raw_bus_v numeric(10,4), raw_current_ma numeric(12,4), raw_power_mw numeric(12,4),
  scaled_current_a numeric(12,6) not null,
  scaled_power_w numeric(12,4) not null,
  rolling_mean_a numeric(12,6), rolling_delta_a numeric(12,6),
  hour_sin real, hour_cos real,
  relay_state smallint not null default 0,
  reed_tamper_state smallint not null default 0,
  predicted_next_power_w numeric(12,4),
  anomaly_score real,
  is_synthetic boolean not null default false
);
create table public.transactions (
  id bigserial primary key,
  event_id varchar(64) not null unique,
  meter_id varchar(64) not null references public.meters(meter_id),
  card_uid varchar(64) references public.users_cards(card_uid),
  billing_type varchar(16) not null,
  tx_type varchar(24) not null,
  collection_mode varchar(24) not null default 'self',
  agent_id varchar(64),
  amount numeric(12,4) not null,
  units_delta numeric(12,6) not null default 0,
  balance_after numeric(12,4),
  occurred_at timestamptz not null,
  synced_at timestamptz not null default now()
);
create table public.tamper_events (
  id bigserial primary key,
  event_id varchar(64) not null unique,
  meter_id varchar(64) not null references public.meters(meter_id),
  tamper_type varchar(32) not null,
  reed_state smallint not null default 0,
  scaled_current_a numeric(12,6),
  anomaly_score real,
  relay_action varchar(24) not null default 'NONE',
  resolved boolean not null default false,
  detected_at timestamptz not null,
  synced_at timestamptz not null default now()
);
create table public.sync_batches (
  batch_id varchar(64) primary key,
  meter_id varchar(64),
  source varchar(24) not null default 'app',
  events_received integer not null,
  events_inserted integer not null,
  events_deduplicated integer not null,
  queued_remaining_on_device integer not null default 0,
  synced_at timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.meters, public.users_cards, public.telemetry_logs, public.transactions, public.tamper_events, public.sync_batches to authenticated;
grant all on public.profiles, public.user_roles, public.meters, public.meter_secrets, public.app_settings, public.users_cards, public.telemetry_logs, public.transactions, public.tamper_events, public.sync_batches to service_role;
grant usage, select on all sequences in schema public to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.meters enable row level security;
alter table public.meter_secrets enable row level security;
alter table public.app_settings enable row level security;
alter table public.users_cards enable row level security;
alter table public.telemetry_logs enable row level security;
alter table public.transactions enable row level security;
alter table public.tamper_events enable row level security;
alter table public.sync_batches enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.my_meter_id()
returns varchar language sql stable security definer set search_path = public as $$
  select meter_id from public.profiles where id = auth.uid()
$$;
create or replace function public.can_see_meter(_meter varchar)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'worker') or _meter = public.my_meter_id()
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'worker'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "see meters" on public.meters for select to authenticated using (public.can_see_meter(meter_id));
create policy "see cards" on public.users_cards for select to authenticated using (public.can_see_meter(meter_id));
create policy "see telemetry" on public.telemetry_logs for select to authenticated using (public.can_see_meter(meter_id));
create policy "see tx" on public.transactions for select to authenticated using (public.can_see_meter(meter_id));
create policy "see tamper" on public.tamper_events for select to authenticated using (public.can_see_meter(meter_id));
create policy "see batches" on public.sync_batches for select to authenticated using (public.has_role(auth.uid(),'worker') or meter_id = public.my_meter_id());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'resident');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.protect_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('app.trusted', true) is distinct from 'on' and auth.role() = 'authenticated' then
    new.meter_id := old.meter_id; new.agent_id := old.agent_id;
  end if;
  return new;
end $$;
create trigger protect_profile before update on public.profiles for each row execute function public.protect_profile();

create or replace function public.link_meter(_meter varchar)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.meters where meter_id = _meter) then raise exception 'Meter not found'; end if;
  perform set_config('app.trusted','on',true);
  update public.profiles set meter_id = _meter where id = auth.uid();
end $$;

create or replace function public.become_worker(_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _code is distinct from (select value from public.app_settings where key = 'worker_code') then raise exception 'Invalid worker code'; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'worker') on conflict do nothing;
  perform set_config('app.trusted','on',true);
  update public.profiles set agent_id = coalesce(agent_id, 'AGT-' || upper(substr(replace(auth.uid()::text,'-',''),1,6))) where id = auth.uid();
end $$;

create or replace function public._process_events(_batch_id varchar, _events jsonb, _source varchar, _actor_mode varchar, _agent_id varchar, _queued_remaining int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e jsonb; m public.meters%rowtype; n_in int := 0; n_new int := 0;
  amt numeric; units numeric; bal numeric; kind text; mid varchar; ts timestamptz; pw numeric; cur numeric;
  rid bigint; mean numeric; anomaly real;
begin
  if exists (select 1 from public.sync_batches where batch_id = _batch_id) then
    return jsonb_build_object('duplicate_batch', true);
  end if;
  for e in select * from jsonb_array_elements(_events) loop
    n_in := n_in + 1;
    kind := e->>'kind'; mid := e->>'meter_id'; ts := coalesce((e->>'occurred_at')::timestamptz, now());
    select * into m from public.meters where meter_id = mid for update;
    if not found then continue; end if;
    rid := null;

    if kind = 'payment' then
      amt := (e->>'amount')::numeric;
      if amt is null or amt <= 0 or amt > 100000 then continue; end if;
      if m.billing_type = 'prepaid' then
        bal := m.prepaid_balance + amt;
        insert into public.transactions(event_id, meter_id, card_uid, billing_type, tx_type, collection_mode, agent_id, amount, balance_after, occurred_at)
        values (e->>'event_id', mid, nullif(e->>'card_uid',''), 'prepaid', case when nullif(e->>'card_uid','') is not null then 'smart_card_payment' else 'recharge' end, _actor_mode, _agent_id, amt, bal, ts)
        on conflict (event_id) do nothing returning id into rid;
        if rid is not null then
          update public.meters set prepaid_balance = bal, relay_state = case when tamper_status='NORMAL' then 1 else relay_state end, updated_at = now() where meter_id = mid;
        end if;
      else
        bal := greatest(m.postpaid_due - amt, 0);
        insert into public.transactions(event_id, meter_id, card_uid, billing_type, tx_type, collection_mode, agent_id, amount, balance_after, occurred_at)
        values (e->>'event_id', mid, nullif(e->>'card_uid',''), 'postpaid', 'postpaid_settlement', _actor_mode, _agent_id, amt, bal, ts)
        on conflict (event_id) do nothing returning id into rid;
        if rid is not null then
          update public.meters set postpaid_due = bal, postpaid_units = case when bal = 0 then 0 else postpaid_units end, updated_at = now() where meter_id = mid;
        end if;
      end if;

    elsif kind = 'telemetry' then
      cur := coalesce((e->>'scaled_current_a')::numeric, (e->>'raw_current_ma')::numeric / 1000.0 * m.scale_factor, 0);
      pw := cur * m.nominal_grid_v;
      units := pw * coalesce((e->>'interval_s')::numeric, 60) / 3600000.0;
      select avg(scaled_current_a) into mean from (select scaled_current_a from public.telemetry_logs where meter_id = mid order by recorded_at desc limit 10) t;
      anomaly := case when mean is null or mean = 0 then 0 else least(1, abs(cur - mean) / greatest(mean, 0.1) / 3)::real end;
      if m.relay_state = 0 and cur > 0.5 then anomaly := 1; end if;
      insert into public.telemetry_logs(event_id, meter_id, recorded_at, raw_current_ma, scaled_current_a, scaled_power_w, rolling_mean_a, rolling_delta_a, hour_sin, hour_cos, relay_state, reed_tamper_state, anomaly_score, is_synthetic)
      values (e->>'event_id', mid, ts, (e->>'raw_current_ma')::numeric, cur, pw, mean, cur - coalesce(mean, cur),
        sin(2*pi()*extract(hour from ts)/24), cos(2*pi()*extract(hour from ts)/24), m.relay_state, coalesce((e->>'reed_state')::smallint, 0), anomaly, coalesce((e->>'is_synthetic')::boolean, false))
      on conflict (event_id) do nothing returning id into rid;
      if rid is not null then
        if m.billing_type = 'prepaid' then
          if m.relay_state = 1 then
            bal := greatest(m.prepaid_balance - units * m.per_unit_rate, 0);
            update public.meters set prepaid_balance = bal, relay_state = case when bal <= 0 then 0 else relay_state end where meter_id = mid;
          end if;
        else
          update public.meters set postpaid_units = postpaid_units + units, postpaid_due = round((postpaid_units + units) * per_unit_rate, 4) where meter_id = mid;
        end if;
        update public.meters set last_power_w = pw, last_current_a = cur, last_seen_at = ts, updated_at = now() where meter_id = mid;
        if anomaly >= 0.8 then
          insert into public.tamper_events(event_id, meter_id, tamper_type, reed_state, scaled_current_a, anomaly_score, relay_action, detected_at)
          values ((e->>'event_id') || '-anom', mid, 'ELECTRICAL_ANOMALY', 0, cur, anomaly, 'ALERT_ONLY', ts) on conflict do nothing;
          update public.meters set tamper_status = 'ELECTRICAL_ANOMALY' where meter_id = mid and tamper_status = 'NORMAL';
        end if;
      end if;

    elsif kind = 'tamper' then
      insert into public.tamper_events(event_id, meter_id, tamper_type, reed_state, scaled_current_a, anomaly_score, relay_action, detected_at)
      values (e->>'event_id', mid, coalesce(e->>'tamper_type','REED_COVER_TAMPER'), coalesce((e->>'reed_state')::smallint,1), (e->>'scaled_current_a')::numeric, (e->>'anomaly_score')::real, 'TRIPPED_OFF', ts)
      on conflict (event_id) do nothing returning id into rid;
      if rid is not null then
        update public.meters set tamper_status = coalesce(e->>'tamper_type','REED_COVER_TAMPER'), reed_tamper_state = 1, relay_state = 0, updated_at = now() where meter_id = mid;
      end if;

    elsif kind = 'resolve_tamper' then
      update public.tamper_events set resolved = true where meter_id = mid and resolved = false;
      rid := 1;
      update public.meters set tamper_status = 'NORMAL', reed_tamper_state = 0,
        relay_state = case when billing_type='postpaid' or prepaid_balance > 0 then 1 else 0 end, updated_at = now() where meter_id = mid;
    end if;

    if rid is not null then n_new := n_new + 1; end if;
  end loop;

  insert into public.sync_batches(batch_id, meter_id, source, events_received, events_inserted, events_deduplicated, queued_remaining_on_device)
  values (_batch_id, (_events->0->>'meter_id'), _source, n_in, n_new, n_in - n_new, coalesce(_queued_remaining,0));
  if _source = 'device' then
    update public.meters set pending_queue_count = coalesce(_queued_remaining,0), sync_status = case when coalesce(_queued_remaining,0) > 0 then 'OFFLINE_QUEUED' else 'SYNCED' end
    where meter_id = (_events->0->>'meter_id');
  end if;
  return jsonb_build_object('received', n_in, 'inserted', n_new, 'deduplicated', n_in - n_new);
end $$;
revoke all on function public._process_events(varchar, jsonb, varchar, varchar, varchar, int) from public, anon, authenticated;
grant execute on function public._process_events(varchar, jsonb, varchar, varchar, varchar, int) to service_role;

create or replace function public.submit_events(_batch_id varchar, _events jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare is_worker boolean; mine varchar; e jsonb; agent varchar;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  is_worker := public.has_role(auth.uid(), 'worker');
  mine := public.my_meter_id();
  if not is_worker then
    for e in select * from jsonb_array_elements(_events) loop
      if e->>'meter_id' is distinct from mine or e->>'kind' <> 'payment' then raise exception 'Not allowed'; end if;
    end loop;
  end if;
  select agent_id into agent from public.profiles where id = auth.uid();
  return public._process_events(_batch_id, _events, 'app', case when is_worker then 'assisted_agent' else 'self' end, case when is_worker then agent else null end, 0);
end $$;
revoke all on function public.submit_events(varchar, jsonb), public.link_meter(varchar), public.become_worker(text) from public, anon;
grant execute on function public.submit_events(varchar, jsonb) to authenticated;
grant execute on function public.link_meter(varchar), public.become_worker(text) to authenticated;

alter publication supabase_realtime add table public.meters;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.tamper_events;

insert into public.app_settings values ('worker_code','AGENT2026');
insert into public.meters (meter_id, consumer_name, context_mode, billing_type, prepaid_balance, postpaid_units, postpaid_due, relay_state, last_power_w, last_current_a, last_seen_at) values
 ('PG-ESP32-001','Lakshmi Devi','rural','prepaid',120,0,0,1,184,0.8,now()),
 ('PG-ESP32-002','Murugan K','rural','postpaid',0,42.5,276.25,1,460,2.0,now()),
 ('PG-ESP32-003','Anita Sharma','urban','prepaid',15,0,0,1,920,4.0,now());
insert into public.meter_secrets values ('PG-ESP32-001','dev-key-001'),('PG-ESP32-002','dev-key-002'),('PG-ESP32-003','dev-key-003');
insert into public.users_cards (card_uid, consumer_id, consumer_name, meter_id, context_mode, ration_profile_ref, card_balance) values
 ('04A1B2C3','HH-1001','Lakshmi Devi','PG-ESP32-001','rural','RTN-TN-55021',200),
 ('04D4E5F6','HH-1002','Murugan K','PG-ESP32-002','rural','RTN-TN-55022',0),
 ('04778899','HH-2001','Anita Sharma','PG-ESP32-003','urban',null,0);
insert into public.transactions (event_id, meter_id, card_uid, billing_type, tx_type, collection_mode, agent_id, amount, balance_after, occurred_at) values
 ('seed-tx-1','PG-ESP32-001','04A1B2C3','prepaid','smart_card_payment','assisted_agent','AGT-DEMO01',100,120,now() - interval '2 days'),
 ('seed-tx-2','PG-ESP32-003',null,'prepaid','recharge','self',null,50,15,now() - interval '1 day');