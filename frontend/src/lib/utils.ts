import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SEVERITY_COLORS } from "./constants";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getSeverityColor(severity: string): string {
  return SEVERITY_COLORS[severity.toLowerCase()] ?? SEVERITY_COLORS.medium;
}

export function formatTimestamp(ts: string | Date | null | undefined): string {
  if (ts == null) return "N/A";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "N/A";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function formatAltitude(alt: number | null | undefined): string {
  if (alt == null) return "N/A";
  return `${Math.round(alt).toLocaleString()} m`;
}

export function formatSpeed(speed: number | null | undefined, unit: "ms" | "kts" = "ms"): string {
  if (speed == null) return "N/A";
  if (unit === "kts") return `${speed.toFixed(1)} kts`;
  return `${(speed * 1.944).toFixed(1)} kts`; // convert m/s to knots
}

export function formatHeading(heading: number | null | undefined): string {
  if (heading == null) return "N/A";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(heading / 45) % 8;
  return `${Math.round(heading)}° ${dirs[idx]}`;
}

/** Generate a unique ID for events/chat messages */
export function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
