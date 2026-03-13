import axios from "axios";
import type { Aircraft, Vessel, ConflictEvent, NewsEvent, AnomalyAlert } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000",
  timeout: 30_000,
});

export async function getAircraft(params?: {
  minutes?: number;
  bbox?: string;
  on_ground?: boolean;
}): Promise<Aircraft[]> {
  const { data } = await api.get("/api/aircraft", { params });
  return data.data ?? [];
}

export async function getAircraftTrail(
  icao24: string
): Promise<Array<{ latitude: number; longitude: number; altitude: number | null; timestamp: string }>> {
  const { data } = await api.get(`/api/aircraft/${icao24}/trail`);
  return data.data ?? [];
}

export async function getShips(params?: {
  minutes?: number;
  type?: string;
  bbox?: string;
}): Promise<Vessel[]> {
  const { data } = await api.get("/api/ships", { params });
  return data.data ?? [];
}

export async function getConflicts(params?: {
  days?: number;
  severity?: string;
  country?: string;
  region?: string;
  limit?: number;
}): Promise<ConflictEvent[]> {
  const { data } = await api.get("/api/conflicts", { params });
  return data.data ?? [];
}

export async function getConflictStats(): Promise<{
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total_fatalities: number;
  countries_affected: number;
}> {
  const { data } = await api.get("/api/conflicts/stats");
  return data.data;
}

export async function getNews(params?: {
  hours?: number;
  country?: string;
  source?: string;
  limit?: number;
}): Promise<NewsEvent[]> {
  const { data } = await api.get("/api/news", { params });
  return data.data ?? [];
}

export async function getAnomalies(): Promise<AnomalyAlert[]> {
  const { data } = await api.get("/api/anomalies");
  return data.data ?? [];
}

export async function analyzeWithAI(
  query: string,
  context?: { region?: string }
): Promise<{ response: string; model: string }> {
  const { data } = await api.post("/ai/analyze", { query, context });
  return data;
}

export async function getAIStatus(): Promise<{
  available: boolean;
  model: string;
  installed_models?: string[];
}> {
  const { data } = await api.get("/ai/status");
  return data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await api.get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
