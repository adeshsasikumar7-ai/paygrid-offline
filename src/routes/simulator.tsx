import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/pg/AuthGate";
import { Shell } from "@/components/pg/Shell";
import { enqueue } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Meter simulator — PayGrid-Offline" },
      { name: "description", content: "Replay normal usage, card payments and tamper spikes without the hardware." },
      { property: "og:title", content: "Meter simulator — PayGrid-Offline" },
      { property: "og:description", content: "Demo meter events without the breadboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthGate demo="worker" title="Simulator (workers)">{() => <Sim />}</AuthGate>,
});

const METERS = ["PG-ESP32-001", "PG-ESP32-002", "PG-ESP32-003"];

function Sim() {
  const [meter, setMeter] = useState(METERS[0]!);
  const run = async (label: string, fn: () => Promise<unknown>) => {
    try { await fn(); toast.success(label); } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <Shell label="Simulator">
      <p className="text-sm text-muted-foreground">Only field workers can send simulated device events.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {METERS.map((m) => <Button key={m} size="sm" variant={m === meter ? "default" : "outline"} onClick={() => setMeter(m)}>{m}</Button>)}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={() => run("Normal usage sent", async () => {
          for (let i = 0; i < 5; i++) await enqueue({ kind: "telemetry", meter_id: meter, scaled_current_a: 1 + Math.random() * 0.4, interval_s: 600, is_synthetic: true });
        })}>Normal usage ×5</Button>
        <Button variant="outline" onClick={() => run("Card payment sent", () => enqueue({ kind: "payment", meter_id: meter, amount: 50, card_uid: "" }))}>Card payment ₹50</Button>
        <Button variant="outline" onClick={() => run("Current spike sent", () => enqueue({ kind: "telemetry", meter_id: meter, scaled_current_a: 12, interval_s: 60, is_synthetic: true }))}>Current spike</Button>
        <Button variant="destructive" onClick={() => run("Cover tamper sent", () => enqueue({ kind: "tamper", meter_id: meter, tamper_type: "REED_COVER_TAMPER", reed_state: 1 }))}>Open cover (tamper)</Button>
      </div>
    </Shell>
  );
}
