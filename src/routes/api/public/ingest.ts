import { createFileRoute } from "@tanstack/react-router";

// ESP32 devices POST { meter_id, device_key, batch_id, queued_remaining, events: [...] }.
export const Route = createFileRoute("/api/public/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { meter_id?: string; device_key?: string; batch_id?: string; queued_remaining?: number; events?: Array<Record<string, unknown>> };
        try { body = await request.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
        const { meter_id, device_key, batch_id, events } = body;
        if (!meter_id || !device_key || !batch_id || !Array.isArray(events) || events.length > 500)
          return Response.json({ error: "missing fields" }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: sec } = await supabaseAdmin.from("meter_secrets").select("device_key").eq("meter_id", meter_id).maybeSingle();
        if (!sec || sec.device_key !== device_key) return Response.json({ error: "unauthorized" }, { status: 401 });
        // Devices may only report for themselves, and never resolve tampers.
        const clean = events
          .filter((e) => e["kind"] !== "resolve_tamper")
          .map((e) => ({ ...e, meter_id }));
        const { data, error } = await supabaseAdmin.rpc("_process_events", {
          _batch_id: batch_id, _events: clean as never, _source: "device", _actor_mode: "self", _agent_id: null as never, _queued_remaining: body.queued_remaining ?? 0,
        });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(data);
      },
    },
  },
});
