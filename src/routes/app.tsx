import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Zap, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/pg/AuthGate";
import { Shell, money } from "@/components/pg/Shell";
import { useProfile } from "@/hooks/use-auth";
import { useLive } from "@/hooks/use-live";
import { enqueue } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "My meter — PayGrid-Offline" },
      { name: "description", content: "Check your power balance, live usage and recharge your meter, even offline." },
      { property: "og:title", content: "My meter — PayGrid-Offline" },
      { property: "og:description", content: "Resident app: balance, live watts, recharge and history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthGate demo="resident" title="Resident app">{(s) => <Resident userId={s.user.id} />}</AuthGate>,
});

function Resident({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const prof = useProfile(userId);
  const meterId = prof.data?.profile?.meter_id ?? null;
  useLive(meterId);
  const [link, setLink] = useState("");
  const [amt, setAmt] = useState("");

  const meter = useQuery({
    queryKey: ["pg", "meter", meterId],
    enabled: !!meterId,
    queryFn: async () => (await supabase.from("meters").select("*").eq("meter_id", meterId!).single()).data,
  });
  const txs = useQuery({
    queryKey: ["pg", "tx", meterId],
    enabled: !!meterId,
    queryFn: async () => (await supabase.from("transactions").select("*").eq("meter_id", meterId!).order("occurred_at", { ascending: false }).limit(20)).data ?? [],
  });
  const tamper = useQuery({
    queryKey: ["pg", "tamper", meterId],
    enabled: !!meterId,
    queryFn: async () => (await supabase.from("tamper_events").select("*").eq("meter_id", meterId!).eq("resolved", false).order("detected_at", { ascending: false })).data ?? [],
  });

  if (prof.isLoading) return <Shell label="Resident">Loading…</Shell>;

  if (!meterId)
    return (
      <Shell label="Resident">
        <div className="receipt max-w-md p-6">
          <h1 className="text-xl font-bold">Link your meter</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the meter ID printed on your device. Demo: PG-ESP32-001, -002 or -003.</p>
          <form className="mt-4 flex gap-2" onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.rpc("link_meter", { _meter: link.trim() });
            if (error) { toast.error(error.message); return; }
            toast.success("Meter linked");
            qc.invalidateQueries({ queryKey: ["profile"] });
          }}>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="PG-ESP32-001" />
            <Button>Link</Button>
          </form>
        </div>
      </Shell>
    );

  const m = meter.data;
  const prepaid = m?.billing_type === "prepaid";

  return (
    <Shell label="Resident">
      {m && (
        <section className="receipt p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{m.meter_id} · {m.billing_type} · {m.context_mode}</p>
            <span className={`font-mono text-xs ${m.relay_state ? "text-primary" : "text-destructive"}`}>POWER {m.relay_state ? "ON" : "OFF"}</span>
          </div>
          <h1 className="mt-2 text-lg">{m.consumer_name}</h1>
          <p className="mt-4 font-mono text-5xl font-bold">{prepaid ? money(m.prepaid_balance) : money(m.postpaid_due)}</p>
          <p className="text-sm text-muted-foreground">{prepaid ? "Prepaid balance" : `Amount due · ${Number(m.postpaid_units).toFixed(2)} units`}</p>
          <p className="mt-4 flex items-center gap-2 font-mono"><Zap className="h-4 w-4 text-primary" />{Number(m.last_power_w).toFixed(0)} W now</p>
          <form className="mt-6 flex gap-2" onSubmit={async (e) => {
            e.preventDefault();
            const amount = Number(amt);
            if (!(amount > 0)) { toast.error("Enter an amount"); return; }
            await enqueue({ kind: "payment", meter_id: m.meter_id, amount });
            setAmt("");
            toast.success(navigator.onLine ? "Payment sent" : "Saved — will sync when online");
          }}>
            <Input type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Amount ₹" />
            <Button>{prepaid ? "Recharge" : "Pay bill"}</Button>
          </form>
        </section>
      )}
      {(tamper.data?.length ?? 0) > 0 && (
        <section className="mt-4 rounded-md border border-destructive p-4 text-destructive">
          <p className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" />Tamper alert</p>
          {tamper.data!.map((t) => <p key={t.id} className="font-mono text-xs">{t.tamper_type} · {new Date(t.detected_at).toLocaleString()}</p>)}
        </section>
      )}
      <section className="mt-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">History</h2>
        <ul className="mt-2 divide-y divide-dashed">
          {txs.data?.map((t) => (
            <li key={t.id} className="flex justify-between py-2 text-sm">
              <span>{t.tx_type.replace(/_/g, " ")} <span className="text-muted-foreground">· {t.collection_mode === "self" ? "self" : `agent ${t.agent_id ?? ""}`}</span></span>
              <span className="font-mono">{money(t.amount)}</span>
            </li>
          ))}
          {txs.data?.length === 0 && <li className="py-2 text-sm text-muted-foreground">No payments yet.</li>}
        </ul>
      </section>
    </Shell>
  );
}
