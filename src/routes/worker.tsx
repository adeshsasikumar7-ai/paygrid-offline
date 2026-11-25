import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/pg/AuthGate";
import { Shell, money } from "@/components/pg/Shell";
import { useProfile } from "@/hooks/use-auth";
import { useLive } from "@/hooks/use-live";
import { enqueue } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/worker")({
  head: () => ({
    meta: [
      { title: "Field worker — PayGrid-Offline" },
      { name: "description", content: "Collect doorstep payments, watch meters and resolve tamper alerts, even without signal." },
      { property: "og:title", content: "Field worker — PayGrid-Offline" },
      { property: "og:description", content: "Worker app: meter list, doorstep collection and tamper queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthGate demo="worker" title="Field worker app">{(s) => <Worker userId={s.user.id} />}</AuthGate>,
});

const FILTERS = ["all", "prepaid", "postpaid", "urban", "rural"] as const;

function Worker({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const prof = useProfile(userId);
  const isWorker = prof.data?.roles.includes("worker");
  useLive(null);
  const [code, setCode] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [target, setTarget] = useState("");
  const [amt, setAmt] = useState("");

  const meters = useQuery({
    queryKey: ["pg", "meters"],
    enabled: !!isWorker,
    queryFn: async () => (await supabase.from("meters").select("*").order("meter_id")).data ?? [],
  });
  const cards = useQuery({
    queryKey: ["pg", "cards"],
    enabled: !!isWorker,
    queryFn: async () => (await supabase.from("users_cards").select("card_uid,meter_id")).data ?? [],
  });
  const tamper = useQuery({
    queryKey: ["pg", "tamper-all"],
    enabled: !!isWorker,
    queryFn: async () => (await supabase.from("tamper_events").select("*").eq("resolved", false).order("detected_at", { ascending: false })).data ?? [],
  });

  if (prof.isLoading) return <Shell label="Worker">Loading…</Shell>;
  if (!isWorker)
    return (
      <Shell label="Worker">
        <div className="receipt max-w-md p-6">
          <h1 className="text-xl font-bold">Worker access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the worker code from your supervisor.</p>
          <form className="mt-4 flex gap-2" onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.rpc("become_worker", { _code: code.trim() });
            if (error) { toast.error(error.message); return; }
            toast.success("You're now a field worker");
            qc.invalidateQueries({ queryKey: ["profile"] });
          }}>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Worker code" />
            <Button>Join</Button>
          </form>
        </div>
      </Shell>
    );

  const list = (meters.data ?? []).filter((m) => filter === "all" || m.billing_type === filter || m.context_mode === filter);

  async function collect(e: React.FormEvent) {
    e.preventDefault();
    const t = target.trim();
    const card = cards.data?.find((c) => c.card_uid === t);
    const meterId = card?.meter_id ?? t;
    if (!meters.data?.some((m) => m.meter_id === meterId)) { toast.error("Unknown meter or card"); return; }
    const amount = Number(amt);
    if (!(amount > 0)) { toast.error("Enter an amount"); return; }
    await enqueue({ kind: "payment", meter_id: meterId, amount, card_uid: card?.card_uid ?? "" });
    setAmt("");
    toast.success(navigator.onLine ? "Payment recorded" : "Saved — will sync when online");
  }

  return (
    <Shell label={`Worker · ${prof.data?.profile?.agent_id ?? ""}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
        <Button size="sm" variant="ghost" asChild><Link to="/simulator">Simulator →</Link></Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((m) => (
          <button key={m.meter_id} onClick={() => setTarget(m.meter_id)} className={`receipt p-4 text-left ${target === m.meter_id ? "ring-2 ring-primary" : ""}`}>
            <div className="flex justify-between font-mono text-xs text-muted-foreground"><span>{m.meter_id}</span><span>{m.billing_type} · {m.context_mode}</span></div>
            <p className="mt-1 font-semibold">{m.consumer_name}</p>
            <p className="font-mono text-2xl">{m.billing_type === "prepaid" ? money(m.prepaid_balance) : `${money(m.postpaid_due)} due`}</p>
            <div className="mt-1 flex gap-3 font-mono text-xs">
              <span className={m.relay_state ? "text-primary" : "text-destructive"}>{m.relay_state ? "ON" : "OFF"}</span>
              <span>{Number(m.last_power_w).toFixed(0)} W</span>
              <span className={m.tamper_status === "NORMAL" ? "" : "text-destructive"}>{m.tamper_status}</span>
              <span>{m.sync_status}</span>
            </div>
          </button>
        ))}
      </div>

      <section className="receipt mt-6 p-5">
        <h2 className="font-semibold">Doorstep collection</h2>
        <form onSubmit={collect} className="mt-3 flex flex-wrap gap-2">
          <Input className="flex-1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Meter ID or card ID" />
          <Input className="w-32" type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="₹" />
          <Button>Record payment</Button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Tamper queue</h2>
        <ul className="mt-2 divide-y divide-dashed">
          {tamper.data?.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <span><span className="font-mono">{t.meter_id}</span> · <span className="text-destructive">{t.tamper_type}</span> · {new Date(t.detected_at).toLocaleString()}</span>
              <Button size="sm" variant="outline" onClick={async () => { await enqueue({ kind: "resolve_tamper", meter_id: t.meter_id }); toast.success("Marked resolved"); }}>Resolve</Button>
            </li>
          ))}
          {tamper.data?.length === 0 && <li className="py-2 text-sm text-muted-foreground">No open tamper alerts.</li>}
        </ul>
      </section>
    </Shell>
  );
}
