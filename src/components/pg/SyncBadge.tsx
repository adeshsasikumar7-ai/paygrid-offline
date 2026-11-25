import { useEffect, useState } from "react";
import { onQueueChange } from "@/lib/offline-queue";

export function SyncBadge() {
  const [n, setN] = useState(0);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    const off = onQueueChange(setN);
    return () => { off(); window.removeEventListener("online", on); window.removeEventListener("offline", on); };
  }, []);
  const queued = n > 0 || !online;
  return (
    <span className={`rounded-sm border px-2 py-0.5 font-mono text-xs ${queued ? "border-warning text-warning" : "border-primary text-primary"}`}>
      {queued ? `OFFLINE QUEUED (${n})` : "SYNCED"}
    </span>
  );
}
