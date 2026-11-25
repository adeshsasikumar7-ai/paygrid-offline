import { useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthGate({ title, demo, children }: { title: string; demo: "resident" | "worker"; children: (s: Session) => ReactNode }) {
  const { session, ready } = useSession();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return <p className="p-10 text-center font-mono text-sm text-muted-foreground">Loading…</p>;
  if (session) return <>{children(session)}</>;

  async function openDemo() {
    setBusy(true);
    const creds = { email: `demo-${demo}@paygrid-demo.app`, password: "PayGridDemo2026!" };
    let { data, error } = await supabase.auth.signInWithPassword(creds);
    if (error) ({ data, error } = await supabase.auth.signUp(creds) as never);
    if (!error && data.session) {
      if (demo === "worker") await supabase.rpc("become_worker", { _code: "AGENT2026" });
      else await supabase.rpc("link_meter", { _meter: "PG-ESP32-001" });
    }
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) toast.success("Check your email to confirm your account.");
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <div className="receipt p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
        <h1 className="mt-2 text-2xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <Button type="button" variant="secondary" className="mt-5 w-full" disabled={busy} onClick={openDemo}>Open demo (no sign-up)</Button>
        <p className="mt-3 text-center font-mono text-xs text-muted-foreground">— or use your own account —</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div><Label htmlFor="em">Email</Label><Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
        </form>
        <button className="mt-4 text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
