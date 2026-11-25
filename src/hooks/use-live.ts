import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Refreshes meter, payment and tamper data the moment anything changes. */
export function useLive(meterId?: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const bump = () => {
      clearTimeout(t);
      t = setTimeout(() => qc.invalidateQueries({ queryKey: ["pg"] }), 150);
    };
    const filter = meterId ? `meter_id=eq.${meterId}` : undefined;
    const ch = supabase.channel(`pg-${meterId ?? "all"}-${Math.random().toString(36).slice(2)}`);
    for (const table of ["meters", "transactions", "tamper_events"]) {
      ch.on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, bump);
    }
    ch.subscribe();
    return () => {
      clearTimeout(t);
      void supabase.removeChannel(ch);
    };
  }, [qc, meterId]);
}
