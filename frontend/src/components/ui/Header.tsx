"use client";

import { Activity, Globe, Menu, RefreshCw, Shield } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatTimestamp } from "@/lib/utils";

export default function Header() {
  const { connected, lastUpdate, aircraft, vessels, conflicts, stats } =
    useAppStore();

  return (
    <header className="flex-shrink-0 h-14 bg-background-secondary border-b border-border flex items-center px-4 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <Shield className="w-5 h-5 text-accent-cyan" />
        <div>
          <div className="text-accent-cyan font-mono text-sm font-semibold tracking-wider glow-text-cyan">
            GCID
          </div>
          <div className="text-text-muted font-mono text-[9px] tracking-widest">
            GLOBAL CONFLICT INTELLIGENCE
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-6 flex-1 justify-center">
        <Stat
          label="AIRCRAFT"
          value={aircraft.filter((a) => !a.on_ground).length}
          color="text-accent-cyan"
          suffix="AIRBORNE"
        />
        <Stat
          label="VESSELS"
          value={vessels.length}
          color="text-accent-blue"
          suffix="TRACKED"
        />
        <Stat
          label="CONFLICTS"
          value={stats?.total ?? conflicts.length}
          color="text-accent-red"
          suffix="30D"
        />
        <Stat
          label="FATALITIES"
          value={stats?.total_fatalities ?? 0}
          color="text-accent-orange"
          suffix="30D"
        />
        <Stat
          label="COUNTRIES"
          value={stats?.countries_affected ?? 0}
          color="text-accent-yellow"
          suffix="AFFECTED"
        />
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-3 min-w-[220px] justify-end">
        {lastUpdate && (
          <span className="text-text-muted font-mono text-[10px]">
            UPD: {formatTimestamp(lastUpdate)}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${
              connected ? "bg-accent-green" : "bg-accent-red"
            }`}
          />
          <span
            className={`font-mono text-[10px] ${
              connected ? "text-accent-green" : "text-accent-red"
            }`}
          >
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
        <Globe className="w-4 h-4 text-text-secondary" />
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number;
  color: string;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-2 border-l border-border pl-6 first:border-l-0 first:pl-0">
      <div>
        <div className="text-text-muted font-mono text-[9px] tracking-widest">
          {label}
        </div>
        <div className={`${color} font-mono text-lg font-bold leading-none`}>
          {(value ?? 0).toLocaleString()}
        </div>
        <div className="text-text-muted font-mono text-[8px] tracking-wider">
          {suffix}
        </div>
      </div>
    </div>
  );
}
