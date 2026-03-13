export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";

export const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff0033",
  high: "#ff6600",
  medium: "#ffcc00",
  low: "#00cc66",
};

export const VESSEL_TYPE_ICONS: Record<string, string> = {
  Military: "🛡️",
  Tanker: "🛢️",
  Cargo: "📦",
  Passenger: "🚢",
  Fishing: "🎣",
  Research: "🔬",
  Tug: "⚓",
  Unknown: "❓",
};

export const DEFAULT_MAP_CENTER: [number, number] = [20, 10];
export const DEFAULT_MAP_ZOOM = 3;

export const MAP_TILE_LAYERS = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: "Street Map",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '© <a href="https://carto.com">CARTO</a>',
    name: "Dark Map",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    name: "Satellite",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
    name: "Terrain",
  },
  nightLights: {
    url: "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg",
    attribution: "NASA Earth Observations",
    name: "Night Lights",
    maxZoom: 8,
  },
} as const;
