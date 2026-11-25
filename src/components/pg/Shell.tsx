import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SyncBadge } from "./SyncBadge";

export function Shell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-dashed pb-4">
        <Link to="/" className="font-bold">PayGrid<span className="text-primary">-Offline</span></Link>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex items-center gap-3">
          <SyncBadge />
          <button className="text-sm text-muted-foreground underline" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>
      {children}
    </div>
  );
}

export const money = (n: number | string | null | undefined) => `₹${Number(n ?? 0).toFixed(2)}`;
