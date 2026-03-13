"use client";

import { RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const SEVERITY_OPTIONS = ["", "critical", "high", "medium", "low"];
const VESSEL_TYPES = ["", "Military", "Tanker", "Cargo", "Passenger", "Fishing", "Research", "Tug"];
const REGIONS = [
  "", "Ukraine", "Russia", "Gaza", "Israel", "Syria", "Yemen", "Sudan",
  "Myanmar", "Ethiopia", "Somalia", "Mali", "Nigeria", "Philippines",
  "Taiwan", "China", "North Korea", "Iran",
];

export default function FilterPanel() {
  const { filters, setFilter, resetFilters } = useAppStore();

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-text-secondary tracking-widest">
          DATA FILTERS
        </span>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-text-muted hover:text-accent-orange transition-colors font-mono text-[8px]"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          RESET
        </button>
      </div>

      {/* Region */}
      <FilterGroup label="REGION">
        <select
          value={filters.region}
          onChange={(e) => setFilter("region", e.target.value)}
          className="w-full bg-background-tertiary border border-border rounded px-2 py-1.5 font-mono text-[10px] text-text-primary focus:outline-none focus:border-accent-blue/50"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r} className="bg-background-secondary">
              {r || "ALL REGIONS"}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Severity */}
      <FilterGroup label="EVENT SEVERITY">
        <div className="grid grid-cols-2 gap-1">
          {SEVERITY_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter("severity", s)}
              className={`px-2 py-1 rounded font-mono text-[9px] border transition-colors ${
                filters.severity === s
                  ? "bg-accent-blue/20 border-accent-blue/50 text-accent-cyan"
                  : "border-border text-text-muted hover:border-border-bright hover:text-text-secondary"
              }`}
            >
              {s ? s.toUpperCase() : "ALL"}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Vessel type */}
      <FilterGroup label="VESSEL TYPE">
        <select
          value={filters.vesselType}
          onChange={(e) => setFilter("vesselType", e.target.value)}
          className="w-full bg-background-tertiary border border-border rounded px-2 py-1.5 font-mono text-[10px] text-text-primary focus:outline-none focus:border-accent-blue/50"
        >
          {VESSEL_TYPES.map((t) => (
            <option key={t} value={t} className="bg-background-secondary">
              {t || "ALL TYPES"}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Altitude */}
      <FilterGroup label={`ALTITUDE: ${(filters.altitudeMin ?? 0).toLocaleString()}m – ${(filters.altitudeMax ?? 15000).toLocaleString()}m`}>
        <div className="space-y-2">
          <div>
            <label className="font-mono text-[8px] text-text-muted">MIN</label>
            <input
              type="range"
              min={0}
              max={15000}
              step={500}
              value={filters.altitudeMin}
              onChange={(e) => setFilter("altitudeMin", Number(e.target.value))}
              className="w-full accent-accent-cyan"
            />
          </div>
          <div>
            <label className="font-mono text-[8px] text-text-muted">MAX</label>
            <input
              type="range"
              min={0}
              max={15000}
              step={500}
              value={filters.altitudeMax}
              onChange={(e) => setFilter("altitudeMax", Number(e.target.value))}
              className="w-full accent-accent-cyan"
            />
          </div>
        </div>
      </FilterGroup>

      {/* Time window */}
      <FilterGroup label={`TIME WINDOW: ${filters.timeWindowHours}H`}>
        <input
          type="range"
          min={1}
          max={72}
          step={1}
          value={filters.timeWindowHours}
          onChange={(e) => setFilter("timeWindowHours", Number(e.target.value))}
          className="w-full accent-accent-cyan"
        />
        <div className="flex justify-between font-mono text-[8px] text-text-muted">
          <span>1H</span>
          <span>24H</span>
          <span>72H</span>
        </div>
      </FilterGroup>

      {/* On-ground aircraft */}
      <FilterGroup label="AIRCRAFT OPTIONS">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setFilter("onGroundAircraft", !filters.onGroundAircraft)}
            className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
              filters.onGroundAircraft ? "bg-accent-cyan" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                filters.onGroundAircraft ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="font-mono text-[9px] text-text-secondary">
            Show on-ground aircraft
          </span>
        </label>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[8px] text-text-muted tracking-widest block">
        {label}
      </label>
      {children}
    </div>
  );
}
