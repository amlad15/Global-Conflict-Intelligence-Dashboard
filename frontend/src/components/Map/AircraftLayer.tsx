"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useAppStore } from "@/store/useAppStore";
import { formatAltitude, formatSpeed, formatHeading, formatTimestamp } from "@/lib/utils";
import type { Aircraft } from "@/types";

/** Create a rotated SVG aircraft icon */
function createAircraftIcon(heading: number, isSelected = false): L.DivIcon {
  const color = isSelected ? "#00ff88" : "#00d4ff";
  const size = isSelected ? 24 : 18;
  const h = heading ?? 0;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
         style="transform: rotate(${h}deg); transform-origin: center; display: block;">
      <path fill="${color}" stroke="#050a0f" stroke-width="0.5" opacity="0.95"
            d="M12 2L8 10H4l8 3 8-3h-4L12 2zm-4 9l-4 6h4l4-1 4 1h4l-4-6-4 2-4-2z"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function AircraftLayer() {
  const map = useMap();
  const { aircraft, filters, setSelectedAircraft } = useAppStore();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const trailsRef = useRef<Map<string, L.Polyline>>(new Map());
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Filter aircraft
  const filtered = aircraft.filter((a) => {
    if (filters.onGroundAircraft === false && a.on_ground) return false;
    if (a.altitude !== null) {
      if (a.altitude < filters.altitudeMin) return false;
      if (a.altitude > filters.altitudeMax) return false;
    }
    return true;
  });

  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;

    return () => {
      group.remove();
      markersRef.current.clear();
      trailsRef.current.clear();
    };
  }, [map]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;

    const existingKeys = new Set(markersRef.current.keys());

    for (const ac of filtered) {
      if (!ac.latitude || !ac.longitude) continue;
      existingKeys.delete(ac.icao24);

      const icon = createAircraftIcon(ac.heading ?? 0);
      const popup = buildAircraftPopup(ac);

      if (markersRef.current.has(ac.icao24)) {
        const marker = markersRef.current.get(ac.icao24)!;
        marker.setLatLng([ac.latitude, ac.longitude]);
        marker.setIcon(icon);
        marker.getPopup()?.setContent(popup);
      } else {
        const marker = L.marker([ac.latitude, ac.longitude], { icon })
          .bindPopup(popup, { maxWidth: 280, className: "gcid-popup" })
          .on("click", () => setSelectedAircraft(ac));
        group.addLayer(marker);
        markersRef.current.set(ac.icao24, marker);
      }
    }

    // Remove stale markers
    existingKeys.forEach((key) => {
      const marker = markersRef.current.get(key);
      if (marker) {
        group.removeLayer(marker);
        markersRef.current.delete(key);
      }
    });
  }, [filtered, map, setSelectedAircraft]);

  return null;
}

function buildAircraftPopup(ac: Aircraft): string {
  const rows = [
    ["CALLSIGN", ac.callsign ?? "N/A"],
    ["ICAO24", ac.icao24],
    ["COUNTRY", ac.country ?? "N/A"],
    ["ALTITUDE", formatAltitude(ac.altitude)],
    ["VELOCITY", formatSpeed(ac.velocity)],
    ["HEADING", formatHeading(ac.heading)],
    ["V-RATE", ac.vertical_rate != null ? `${ac.vertical_rate.toFixed(1)} m/s` : "N/A"],
    ["STATUS", ac.on_ground ? "🛬 On Ground" : "✈️ Airborne"],
    ["LAST SEEN", formatTimestamp(ac.timestamp)],
  ];

  return `
    <div style="font-family: 'JetBrains Mono', monospace; min-width: 220px;">
      <div style="color: #00d4ff; font-size: 11px; font-weight: 600; letter-spacing: 2px;
                  border-bottom: 1px solid #1a2a40; padding-bottom: 4px; margin-bottom: 8px;">
        ✈ AIRCRAFT TRACK
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="color: #7a9bbf; padding: 1px 8px 1px 0; white-space: nowrap;">${k}</td>
            <td style="color: #e0f0ff; font-weight: 500;">${v}</td>
          </tr>`).join("")}
      </table>
    </div>`;
}
