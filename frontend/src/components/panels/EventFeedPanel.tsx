"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ChevronDown, ChevronUp, AlertTriangle, Newspaper, Plane, Ship, Zap } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatTimestamp, getSeverityColor } from "@/lib/utils";
import type { EventFeedItem } from "@/types";

const TYPE_CONFIG = {
  conflict: { icon: AlertTriangle, color: "text-accent-red", label: "CONFLICT" },
  news: { icon: Newspaper, color: "text-accent-yellow", label: "NEWS" },
  aircraft: { icon: Plane, color: "text-accent-cyan", label: "AIRCRAFT" },
  vessel: { icon: Ship, color: "text-accent-blue", label: "VESSEL" },
  anomaly: { icon: Zap, color: "text-accent-purple", label: "ANOMALY" },
};

export default function EventFeedPanel() {
  const { feedItems } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayItems = feedItems.slice(0, 100);

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [feedItems, paused]);

  return (
    <div className="flex-shrink-0 bg-background-secondary border-t border-border">
      {/* Feed header */}
      <div className="flex items-center px-4 h-8 border-b border-border gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-accent-green animate-pulse-slow" />
          <span className="font-mono text-[9px] tracking-widest text-text-secondary">
            LIVE EVENT FEED
          </span>
          <span className="font-mono text-[9px] text-accent-cyan bg-accent-cyan/10 px-1.5 rounded">
            {feedItems.length}
          </span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setPaused((v) => !v)}
          className={`font-mono text-[9px] px-2 py-0.5 rounded border transition-colors ${
            paused
              ? "border-accent-orange/50 text-accent-orange bg-accent-orange/10"
              : "border-border text-text-muted hover:text-text-secondary"
          }`}
        >
          {paused ? "PAUSED" : "PAUSE"}
        </button>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-text-muted hover:text-text-secondary ml-2"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div
          ref={scrollRef}
          className="flex gap-2 px-3 py-2 overflow-x-auto"
          style={{ height: "52px" }}
        >
          {displayItems.length === 0 ? (
            <div className="flex items-center text-text-muted font-mono text-[10px]">
              Awaiting events...
            </div>
          ) : (
            displayItems.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FeedItem({ item }: { item: EventFeedItem }) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.conflict;
  const Icon = config.icon;
  const severityColor = item.severity ? getSeverityColor(item.severity) : undefined;

  return (
    <div
      className="flex-shrink-0 flex items-start gap-2 bg-background-panel border border-border rounded px-3 py-1.5 min-w-[280px] max-w-[360px] hover:border-border-bright transition-colors cursor-default"
      style={{ borderLeftColor: severityColor, borderLeftWidth: severityColor ? 2 : 1 }}
    >
      <Icon
        className={`w-3 h-3 mt-0.5 flex-shrink-0 ${config.color}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-mono text-[8px] tracking-widest ${config.color}`}>
            {config.label}
          </span>
          <span className="font-mono text-[8px] text-text-muted ml-auto flex-shrink-0">
            {formatTimestamp(item.timestamp)}
          </span>
        </div>
        <p className="font-mono text-[9px] text-text-primary leading-tight truncate">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="font-mono text-[8px] text-text-muted truncate">
            {item.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
