"use client";

import { useState } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const PRESETS = [1, 3, 6, 12, 24, 48, 72];

export default function TimelineControl() {
  const { timelineHours, setTimelineHours } = useAppStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="panel-glass rounded shadow-panel">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 px-4 py-2 text-text-secondary hover:text-text-primary"
      >
        <Clock className="w-3.5 h-3.5 text-accent-cyan" />
        <span className="font-mono text-[10px] tracking-widest">
          TIMELINE: {timelineHours === 1 ? "1 HOUR" : `${timelineHours} HOURS`}
        </span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2">
          {/* Slider */}
          <input
            type="range"
            min={1}
            max={72}
            step={1}
            value={timelineHours}
            onChange={(e) => setTimelineHours(Number(e.target.value))}
            className="w-full accent-accent-cyan"
          />
          <div className="flex justify-between font-mono text-[8px] text-text-muted mt-1">
            <span>1H</span>
            <span>24H</span>
            <span>72H</span>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {PRESETS.map((h) => (
              <button
                key={h}
                onClick={() => setTimelineHours(h)}
                className={`px-2 py-0.5 rounded font-mono text-[9px] border transition-colors ${
                  timelineHours === h
                    ? "bg-accent-blue/20 border-accent-blue/50 text-accent-cyan"
                    : "border-border text-text-muted hover:border-border-bright hover:text-text-secondary"
                }`}
              >
                {h}H
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
