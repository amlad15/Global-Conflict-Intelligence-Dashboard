"use client";

import { useState, type ElementType } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, SlidersHorizontal, BarChart2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { PanelTab } from "@/types";
import { cn } from "@/lib/utils";
import AIChat from "./AIChat";
import FilterPanel from "./FilterPanel";
import StatsPanel from "./StatsPanel";

const TABS: { id: PanelTab; label: string; icon: ElementType }[] = [
  { id: "ai", label: "AI", icon: MessageSquare },
  { id: "filter", label: "FILTER", icon: SlidersHorizontal },
  { id: "stats", label: "STATS", icon: BarChart2 },
];

export default function RightPanel() {
  const { activePanel, setActivePanel } = useAppStore();
  const [open, setOpen] = useState(true);

  return (
    <div
      className={cn(
        "flex-shrink-0 flex transition-all duration-300 relative z-10",
        open ? "w-80" : "w-10"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-background-secondary border border-border rounded-l flex items-center justify-center hover:bg-background-tertiary transition-colors"
      >
        {open ? (
          <ChevronRight className="w-3 h-3 text-text-muted" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-text-muted" />
        )}
      </button>

      {open && (
        <div className="w-full bg-background-secondary border-l border-border flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border flex-shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest transition-colors",
                  activePanel === id
                    ? "text-accent-cyan border-b-2 border-accent-cyan bg-background-panel"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === "ai" && <AIChat />}
            {activePanel === "filter" && <FilterPanel />}
            {activePanel === "stats" && <StatsPanel />}
          </div>
        </div>
      )}
    </div>
  );
}
