/**
 * Global application state using Zustand.
 * Single store for all map data, layers, filters and UI state.
 */

import { create } from "zustand";
import type {
  Aircraft,
  Vessel,
  ConflictEvent,
  NewsEvent,
  AnomalyAlert,
  LayerState,
  Filters,
  EventFeedItem,
  ChatMessage,
  PanelTab,
} from "@/types";
import { genId } from "@/lib/utils";

export const PANEL_TABS = ["ai", "filter", "stats"] as const;

interface AppState {
  // ── Connection ─────────────────────────────────────────────────────────────
  connected: boolean;
  lastUpdate: Date | null;
  setConnected: (v: boolean) => void;

  // ── Data ───────────────────────────────────────────────────────────────────
  aircraft: Aircraft[];
  vessels: Vessel[];
  conflicts: ConflictEvent[];
  news: NewsEvent[];
  anomalies: AnomalyAlert[];
  setAircraft: (data: Aircraft[]) => void;
  addAircraft: (data: Aircraft[]) => void;
  setVessels: (data: Vessel[]) => void;
  setConflicts: (data: ConflictEvent[]) => void;
  addConflicts: (data: ConflictEvent[]) => void;
  setNews: (data: NewsEvent[]) => void;
  addNews: (data: NewsEvent[]) => void;
  setAnomalies: (data: AnomalyAlert[]) => void;

  // ── Stats ──────────────────────────────────────────────────────────────────
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    total_fatalities: number;
    countries_affected: number;
  } | null;
  setStats: (stats: AppState["stats"]) => void;

  // ── Layers ─────────────────────────────────────────────────────────────────
  layers: LayerState;
  toggleLayer: (layer: keyof LayerState) => void;
  setLayer: (layer: keyof LayerState, value: boolean) => void;

  // ── Satellite tile ─────────────────────────────────────────────────────────
  activeTileLayer: string;
  setActiveTileLayer: (name: string) => void;

  // ── Filters ────────────────────────────────────────────────────────────────
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;

  // ── Event Feed ─────────────────────────────────────────────────────────────
  feedItems: EventFeedItem[];
  addFeedItem: (item: Omit<EventFeedItem, "id">) => void;

  // ── AI Chat ────────────────────────────────────────────────────────────────
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateChatMessage: (id: string, content: string, loading?: boolean) => void;
  clearChat: () => void;

  // ── UI ─────────────────────────────────────────────────────────────────────
  activePanel: PanelTab;
  setActivePanel: (tab: PanelTab) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (v: boolean) => void;
  selectedAircraft: Aircraft | null;
  selectedVessel: Vessel | null;
  selectedConflict: ConflictEvent | null;
  selectedNews: NewsEvent | null;
  setSelectedAircraft: (a: Aircraft | null) => void;
  setSelectedVessel: (v: Vessel | null) => void;
  setSelectedConflict: (c: ConflictEvent | null) => void;
  setSelectedNews: (n: NewsEvent | null) => void;

  // ── Timeline ───────────────────────────────────────────────────────────────
  timelineHours: number;
  setTimelineHours: (h: number) => void;
}

const DEFAULT_FILTERS: Filters = {
  region: "",
  severity: "",
  vesselType: "",
  altitudeMin: 0,
  altitudeMax: 15000,
  timeWindowHours: 24,
  onGroundAircraft: false,
};

export const useAppStore = create<AppState>((set) => ({
  // Connection
  connected: false,
  lastUpdate: null,
  setConnected: (connected) => set({ connected, lastUpdate: new Date() }),

  // Data
  aircraft: [],
  vessels: [],
  conflicts: [],
  news: [],
  anomalies: [],

  setAircraft: (aircraft) =>
    set({ aircraft, lastUpdate: new Date() }),

  addAircraft: (incoming) =>
    set((state) => {
      const map = new Map(state.aircraft.map((a) => [a.icao24, a]));
      incoming.forEach((a) => map.set(a.icao24, a));
      return { aircraft: Array.from(map.values()), lastUpdate: new Date() };
    }),

  setVessels: (vessels) => set({ vessels, lastUpdate: new Date() }),

  setConflicts: (conflicts) => set({ conflicts, lastUpdate: new Date() }),

  addConflicts: (incoming) =>
    set((state) => {
      const map = new Map(state.conflicts.map((c) => [c.id, c]));
      incoming.forEach((c) => map.set(c.id, c));
      return { conflicts: Array.from(map.values()) };
    }),

  setNews: (news) => set({ news, lastUpdate: new Date() }),

  addNews: (incoming) =>
    set((state) => {
      const map = new Map(state.news.map((n) => [n.id, n]));
      incoming.forEach((n) => map.set(n.id, n));
      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return { news: sorted.slice(0, 200) };
    }),

  setAnomalies: (anomalies) => set({ anomalies }),

  stats: null,
  setStats: (stats) => set({ stats }),

  // Layers
  layers: {
    aircraft: true,
    vessels: true,
    conflicts: true,
    news: true,
    satellite: false,
    heatmap: false,
  },
  toggleLayer: (layer) =>
    set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
  setLayer: (layer, value) =>
    set((state) => ({ layers: { ...state.layers, [layer]: value } })),

  activeTileLayer: "dark",
  setActiveTileLayer: (name) => set({ activeTileLayer: name }),

  // Filters
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  // Feed
  feedItems: [],
  addFeedItem: (item) =>
    set((state) => ({
      feedItems: [{ ...item, id: genId() }, ...state.feedItems].slice(0, 500),
    })),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { ...msg, id: genId(), timestamp: new Date() },
      ],
    })),
  updateChatMessage: (id, content, loading = false) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === id ? { ...m, content, loading } : m
      ),
    })),
  clearChat: () => set({ chatMessages: [] }),

  // UI
  activePanel: "ai",
  setActivePanel: (activePanel) => set({ activePanel }),
  rightPanelOpen: true,
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
  selectedAircraft: null,
  selectedVessel: null,
  selectedConflict: null,
  selectedNews: null,
  setSelectedAircraft: (selectedAircraft) => set({ selectedAircraft }),
  setSelectedVessel: (selectedVessel) => set({ selectedVessel }),
  setSelectedConflict: (selectedConflict) => set({ selectedConflict }),
  setSelectedNews: (selectedNews) => set({ selectedNews }),

  // Timeline
  timelineHours: 24,
  setTimelineHours: (timelineHours) => set({ timelineHours }),
}));
