"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useAppStore } from "@/store/useAppStore";
import { formatTimestamp } from "@/lib/utils";
import type { NewsEvent } from "@/types";

function createNewsIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="background:#ffd70020;border:1px solid #ffd70060;border-radius:3px;
                  padding:2px 4px;font-size:9px;color:#ffd700;font-family:monospace;
                  white-space:nowrap;box-shadow:0 0 8px rgba(255,215,0,0.2);">
        📡 NEWS
      </div>`,
    className: "",
    iconSize: [52, 20],
    iconAnchor: [26, 10],
  });
}

export default function NewsLayer() {
  const map = useMap();
  const { news, filters, setSelectedNews } = useAppStore();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const filtered = news.filter((n) => {
    if (n.latitude == null || n.longitude == null) return false;
    if (filters.region && !n.country?.toLowerCase().includes(filters.region.toLowerCase())) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;
    return () => {
      group.remove();
      markersRef.current.clear();
    };
  }, [map]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    markersRef.current.clear();

    const icon = createNewsIcon();

    for (const item of filtered.slice(0, 100)) {
      if (item.latitude == null || item.longitude == null) continue;

      const marker = L.marker([item.latitude, item.longitude], { icon })
        .bindPopup(buildNewsPopup(item), { maxWidth: 340 })
        .on("click", () => setSelectedNews(item));

      group.addLayer(marker);
      markersRef.current.set(item.id, marker);
    }
  }, [filtered, map, setSelectedNews]);

  return null;
}

function buildNewsPopup(n: NewsEvent): string {
  return `
    <div style="font-family:'JetBrains Mono',monospace;min-width:260px;max-width:340px;">
      <div style="color:#ffd700;font-size:11px;font-weight:600;letter-spacing:2px;
                  border-bottom:1px solid #1a2a40;padding-bottom:6px;margin-bottom:8px;">
        📡 NEWS INTEL
      </div>
      <div style="font-size:11px;color:#e0f0ff;line-height:1.5;margin-bottom:8px;font-weight:500;">
        ${n.headline}
      </div>
      ${n.summary ? `<div style="font-size:10px;color:#b0c8e0;line-height:1.5;margin-bottom:8px;
                                  padding:6px;background:#ffffff08;border-radius:3px;">
        ${n.summary.slice(0, 200)}${n.summary.length > 200 ? "…" : ""}
      </div>` : ""}
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:9px;color:#7a9bbf;">${n.source ?? "Unknown"} · ${n.country ?? ""}</span>
        <span style="font-size:9px;color:#3a5472;">${formatTimestamp(n.published_at ?? n.timestamp)}</span>
      </div>
      ${n.url ? `<a href="${n.url}" target="_blank" rel="noopener noreferrer"
                    style="display:block;margin-top:8px;font-size:9px;color:#1a6bff;text-decoration:underline;">
        View full article →
      </a>` : ""}
    </div>`;
}
