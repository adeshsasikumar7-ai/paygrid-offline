import { createFileRoute, Link } from "@tanstack/react-router";
import { WifiOff, Zap, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PayGrid-Offline — power access that works without signal" },
      { name: "description", content: "Prepaid and postpaid electricity for rural homes, with a resident app, a field-worker app and live sync." },
      { property: "og:title", content: "PayGrid-Offline" },
      { property: "og:description", content: "Prepaid and postpaid electricity for rural homes, with resident and field-worker apps that sync live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Receipt no. 0001 · Community power</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight">Pay for power at the doorstep — even with no signal.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        PayGrid-Offline links a smart meter, a resident app and a field-worker app. Payments queue on the phone and settle the moment the network returns — never charged twice.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg"><Link to="/app">Open resident app</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/worker">Field worker</Link></Button>
        <Button asChild size="lg" variant="ghost"><Link to="/simulator">Simulator</Link></Button>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {[
          [Zap, "Live meter", "Balance, units due, relay and live watts — updated within a second."],
          [WifiOff, "Offline queue", "Every action gets a unique ID, waits on the phone, syncs in order."],
          [Users, "Doorstep collection", "Workers record cash or smart-card payments, tagged with their agent ID."],
          [ShieldAlert, "Tamper alerts", "Cover-open and current-spike events trip the relay and land in the worker queue."],
        ].map(([Icon, t, d]) => {
          const I = Icon as typeof Zap;
          return (
            <div key={t as string} className="receipt p-5">
              <I className="h-5 w-5 text-primary" />
              <h2 className="mt-2 font-semibold">{t as string}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
