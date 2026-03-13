"use client";

import { useState } from "react";
import {
  Plane,
  Ship,
  AlertTriangle,
  Newspaper,
  Satellite,
  Layers,
  Map,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { MAP_TILE_LAYERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LayerState } from "@/types";

const LAYER_CONFIG: Array<{
  key: keyof LayerState;
  label: string;
  icon: React.ElementType;
  color: string;
}> = [
  { key: "aircraft", label: "AIRCRAFT", icon: Plane, color: "text-accent-cyan" },
  { key: "vessels", label: "VESSELS", icon: Ship, color: "text-accent-blue" },
  { key: "conflicts", label: "CONFLICTS", icon: AlertTriangle, color: "text-accent-red" },
  { key: "news", label: "NEWS", icon: Newspaper, color: "text-accent-yellow" },
  { key: "satellite", label: "SATELLITE", icon: Satellite, color: "text-accent-purple" },
];

const TILE_LAYERS = Object.entries(MAP_TILE_LAYERS).map(([key, val]) => ({
  key,
  name: val.name,
}));

export default function LayerControls() {
  const { layers, toggleLayer, activeTileLayer, setActiveTileLayer } = useAppStore();
  const [open, setOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className="panel-glass rounded shadow-panel min-w-[160px]">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-text-secondary hover:text-text-primary"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-mono text-[10px] tracking-widest">LAYERS</span>
        </div>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {open && (
        <div className="border-t border-border px-2 py-2 space-y-1">
          {LAYER_CONFIG.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                layers[key]
                  ? "bg-background-tertiary"
                  : "hover:bg-background-tertiary opacity-50"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full border",
                  layers[key] ? "bg-current border-current" : "bg-transparent border-current"
                )}
                style={{ color: layers[key] ? undefined : "#3a5472" }}
              />
              <Icon className={cn("w-3 h-3", layers[key] ? color : "text-text-muted")} />
              <span
                className={cn(
                  "font-mono text-[9px] tracking-widest",
                  layers[key] ? "text-text-primary" : "text-text-muted"
                )}
              >
                {label}
              </span>
            </button>
          ))}

          {/* Map tile selector */}
          <div className="border-t border-border mt-2 pt-2">
            <button
              onClick={() => setMapOpen((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-1 text-text-muted hover:text-text-secondary"
            >
              <div className="flex items-center gap-2">
                <Map className="w-3 h-3" />
                <span className="font-mono text-[9px] tracking-widest">BASE MAP</span>
              </div>
              {mapOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            {mapOpen && (
              <div className="mt-1 space-y-0.5">
                {TILE_LAYERS.map(({ key, name }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTileLayer(key)}
                    className={cn(
                      "w-full text-left px-3 py-1 rounded font-mono text-[9px] transition-colors",
                      activeTileLayer === key
                        ? "bg-accent-blue/20 text-accent-cyan border border-accent-blue/30"
                        : "text-text-muted hover:text-text-secondary hover:bg-background-tertiary"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
