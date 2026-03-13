"use client";

import { useAppStore } from "@/store/useAppStore";

export default function StatusBar() {
  const { connected, aircraft, vessels, conflicts, news } = useAppStore();

  return (
    <div className="flex-shrink-0 h-6 bg-background-secondary border-t border-border flex items-center px-4 gap-6 z-50">
      <span className="font-mono text-[9px] text-text-muted tracking-widest">
        SYS:{" "}
        <span className={connected ? "text-accent-green" : "text-accent-red"}>
          {connected ? "OPERATIONAL" : "DEGRADED"}
        </span>
      </span>
      <span className="font-mono text-[9px] text-text-muted">
        AC:{" "}
        <span className="text-accent-cyan">{aircraft.length}</span>
      </span>
      <span className="font-mono text-[9px] text-text-muted">
        VS:{" "}
        <span className="text-accent-blue">{vessels.length}</span>
      </span>
      <span className="font-mono text-[9px] text-text-muted">
        CF:{" "}
        <span className="text-accent-red">{conflicts.length}</span>
      </span>
      <span className="font-mono text-[9px] text-text-muted">
        NW:{" "}
        <span className="text-accent-yellow">{news.length}</span>
      </span>
      <div className="flex-1" />
      <span className="font-mono text-[9px] text-text-muted">
        DATA: OPENSKY · ACLED · GDELT · AIS
      </span>
      <span className="font-mono text-[9px] text-text-muted">
        v1.0.0 © GCID
      </span>
    </div>
  );
}
