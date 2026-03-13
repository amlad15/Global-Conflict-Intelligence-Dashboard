"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/store/useAppStore";
import { MAP_TILE_LAYERS, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import AircraftLayer from "./AircraftLayer";
import VesselLayer from "./VesselLayer";
import ConflictLayer from "./ConflictLayer";
import NewsLayer from "./NewsLayer";
import LayerControls from "./LayerControls";
import TimelineControl from "./TimelineControl";

/** Syncs the tile layer when activeTileLayer changes */
function TileLayerSync() {
  const activeTileLayer = useAppStore((s) => s.activeTileLayer);
  const layers = useAppStore((s) => s.layers);
  const map = useMap();

  // Nothing to sync here for TileLayer — handled by conditional rendering
  return null;
}

export default function MapContainer() {
  const { layers, activeTileLayer } = useAppStore();

  const tileConfig =
    MAP_TILE_LAYERS[activeTileLayer as keyof typeof MAP_TILE_LAYERS] ??
    MAP_TILE_LAYERS.dark;

  // Satellite override
  const satelliteConfig = MAP_TILE_LAYERS.satellite;

  return (
    <div className="relative w-full h-full">
      <LeafletMap
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        zoomControl={false}
        className="w-full h-full"
        preferCanvas
        maxBoundsViscosity={0.8}
        worldCopyJump
      >
        {/* Base tile layer */}
        <TileLayer
          key={activeTileLayer}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={(tileConfig as { maxZoom?: number }).maxZoom ?? 19}
        />

        {/* Satellite overlay when toggled */}
        {layers.satellite && activeTileLayer !== "satellite" && (
          <TileLayer
            url={satelliteConfig.url}
            attribution={satelliteConfig.attribution}
            opacity={0.5}
          />
        )}

        <ZoomControl position="bottomright" />
        <TileLayerSync />

        {/* Data layers */}
        {layers.aircraft && <AircraftLayer />}
        {layers.vessels && <VesselLayer />}
        {layers.conflicts && <ConflictLayer />}
        {layers.news && <NewsLayer />}
      </LeafletMap>

      {/* Layer toggle controls overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <LayerControls />
      </div>

      {/* Timeline control */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000]">
        <TimelineControl />
      </div>
    </div>
  );
}
