"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useAppStore } from "@/store/useAppStore";
import { formatTimestamp } from "@/lib/utils";
import type { Vessel } from "@/types";

function getVesselColor(type: string | null): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("military")) return "#ff3344";
  if (t.includes("tanker")) return "#ff6b00";
  if (t.includes("cargo")) return "#1a6bff";
  if (t.includes("passenger")) return "#8b5cf6";
  if (t.includes("fishing")) return "#00cc66";
  return "#7a9bbf";
}

function createVesselIcon(type: string | null, heading: number | null): L.DivIcon {
  const color = getVesselColor(type);
  const h = heading ?? 0;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20"
         style="transform: rotate(${h}deg); transform-origin: center; display: block;">
      <polygon points="8,0 16,20 8,15 0,20" fill="${color}" stroke="#050a0f" stroke-width="1" opacity="0.9"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [16, 20],
    iconAnchor: [8, 10],
  });
}

export default function VesselLayer() {
  const map = useMap();
  const { vessels, filters, setSelectedVessel } = useAppStore();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const filtered = vessels.filter((v) => {
    if (filters.vesselType && !v.vessel_type?.toLowerCase().includes(filters.vesselType.toLowerCase())) {
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

    const existingKeys = new Set(markersRef.current.keys());

    for (const vessel of filtered) {
      if (!vessel.latitude || !vessel.longitude) continue;
      existingKeys.delete(vessel.mmsi);

      const icon = createVesselIcon(vessel.vessel_type, vessel.heading);
      const popup = buildVesselPopup(vessel);

      if (markersRef.current.has(vessel.mmsi)) {
        const marker = markersRef.current.get(vessel.mmsi)!;
        marker.setLatLng([vessel.latitude, vessel.longitude]);
        marker.setIcon(icon);
        marker.getPopup()?.setContent(popup);
      } else {
        const marker = L.marker([vessel.latitude, vessel.longitude], { icon })
          .bindPopup(popup, { maxWidth: 280 })
          .on("click", () => setSelectedVessel(vessel));
        group.addLayer(marker);
        markersRef.current.set(vessel.mmsi, marker);
      }
    }

    existingKeys.forEach((key) => {
      const m = markersRef.current.get(key);
      if (m) { group.removeLayer(m); markersRef.current.delete(key); }
    });
  }, [filtered, map, setSelectedVessel]);

  return null;
}

function buildVesselPopup(v: Vessel): string {
  const rows = [
    ["NAME", v.name ?? "UNKNOWN"],
    ["MMSI", v.mmsi],
    ["TYPE", v.vessel_type ?? "Unknown"],
    ["FLAG", v.flag ?? "N/A"],
    ["SPEED", v.speed != null ? `${v.speed.toFixed(1)} kts` : "N/A"],
    ["COURSE", v.course != null ? `${v.course.toFixed(0)}°` : "N/A"],
    ["DEST", v.destination ?? "N/A"],
    ["STATUS", v.status ?? "N/A"],
    ["LENGTH", v.length ? `${v.length} m` : "N/A"],
    ["LAST SEEN", formatTimestamp(v.timestamp)],
  ];

  const color = getVesselColor(v.vessel_type);

  return `
    <div style="font-family: 'JetBrains Mono', monospace; min-width: 220px;">
      <div style="color: ${color}; font-size: 11px; font-weight: 600; letter-spacing: 2px;
                  border-bottom: 1px solid #1a2a40; padding-bottom: 4px; margin-bottom: 8px;">
        ⚓ VESSEL TRACK
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        ${rows.map(([k, val]) => `
          <tr>
            <td style="color: #7a9bbf; padding: 1px 8px 1px 0;">${k}</td>
            <td style="color: #e0f0ff; font-weight: 500;">${val}</td>
          </tr>`).join("")}
      </table>
    </div>`;
}
