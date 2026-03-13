"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useAppStore } from "@/store/useAppStore";
import { getSeverityColor, formatTimestamp } from "@/lib/utils";
import type { ConflictEvent } from "@/types";

const SEVERITY_SIZES: Record<string, number> = {
  critical: 14,
  high: 11,
  medium: 8,
  low: 6,
};

function createConflictIcon(severity: string): L.DivIcon {
  const color = getSeverityColor(severity);
  const size = SEVERITY_SIZES[severity] ?? 8;
  const pulse = severity === "critical" || severity === "high";

  return L.divIcon({
    html: `
      <div style="position:relative;width:${size * 2 + 8}px;height:${size * 2 + 8}px;display:flex;align-items:center;justify-content:center;">
        ${pulse ? `<div style="position:absolute;width:${size * 2 + 8}px;height:${size * 2 + 8}px;
                  border-radius:50%;background:${color}20;animation:pulse 2s ease-in-out infinite;"></div>` : ""}
        <div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;
                    border:2px solid ${color}80;box-shadow:0 0 8px ${color}60;"></div>
      </div>`,
    className: "",
    iconSize: [size * 2 + 8, size * 2 + 8],
    iconAnchor: [(size * 2 + 8) / 2, (size * 2 + 8) / 2],
  });
}

export default function ConflictLayer() {
  const map = useMap();
  const { conflicts, filters, setSelectedConflict } = useAppStore();
  const clusterGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const filtered = conflicts.filter((c) => {
    if (filters.severity && c.severity !== filters.severity) return false;
    if (filters.region && !c.country?.toLowerCase().includes(filters.region.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    clusterGroupRef.current = group;
    return () => {
      group.remove();
      markersRef.current.clear();
    };
  }, [map]);

  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;

    group.clearLayers();
    markersRef.current.clear();

    for (const event of filtered) {
      if (!event.latitude || !event.longitude) continue;

      const icon = createConflictIcon(event.severity);
      const marker = L.marker([event.latitude, event.longitude], { icon })
        .bindPopup(buildConflictPopup(event), { maxWidth: 320 })
        .on("click", () => setSelectedConflict(event));

      group.addLayer(marker);
      markersRef.current.set(event.id, marker);
    }
  }, [filtered, map, setSelectedConflict]);

  return null;
}

function buildConflictPopup(e: ConflictEvent): string {
  const color = getSeverityColor(e.severity);
  const severityBadge = `<span style="background:${color}20;color:${color};border:1px solid ${color}50;
    padding:1px 6px;border-radius:3px;font-size:9px;font-weight:600;letter-spacing:1px;">
    ${e.severity.toUpperCase()}
  </span>`;

  return `
    <div style="font-family:'JetBrains Mono',monospace;min-width:260px;max-width:320px;">
      <div style="display:flex;justify-content:space-between;align-items:center;
                  border-bottom:1px solid #1a2a40;padding-bottom:6px;margin-bottom:8px;">
        <span style="color:${color};font-size:11px;font-weight:600;letter-spacing:2px;">
          ⚠ CONFLICT EVENT
        </span>
        ${severityBadge}
      </div>
      <div style="font-size:11px;margin-bottom:6px;">
        <span style="color:#7a9bbf;">TYPE: </span>
        <span style="color:#e0f0ff;">${e.event_type ?? "Unknown"}</span>
        ${e.sub_event_type ? ` / <span style="color:#7a9bbf;">${e.sub_event_type}</span>` : ""}
      </div>
      <div style="font-size:11px;margin-bottom:6px;">
        <span style="color:#7a9bbf;">LOCATION: </span>
        <span style="color:#e0f0ff;">${e.location ?? "Unknown"}, ${e.country ?? ""}</span>
      </div>
      ${e.fatalities > 0 ? `<div style="font-size:11px;margin-bottom:6px;">
        <span style="color:#7a9bbf;">FATALITIES: </span>
        <span style="color:#ff3344;font-weight:600;">${e.fatalities}</span>
      </div>` : ""}
      ${e.description ? `
        <div style="font-size:10px;color:#b0c8e0;line-height:1.5;margin:8px 0;
                    padding:6px;background:#ffffff08;border-radius:3px;max-height:80px;overflow-y:auto;">
          ${e.description.slice(0, 300)}${e.description.length > 300 ? "…" : ""}
        </div>` : ""}
      <div style="font-size:9px;color:#3a5472;margin-top:6px;display:flex;justify-content:space-between;">
        <span>SRC: ${e.source ?? "Unknown"}</span>
        <span>${e.event_date ?? formatTimestamp(e.timestamp)}</span>
      </div>
    </div>`;
}
