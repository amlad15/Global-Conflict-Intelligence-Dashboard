"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  getConflictStats,
  getAnomalies,
} from "@/lib/api";

/**
 * Fetches non-WebSocket data (stats, anomalies) on mount.
 */
export function useInitialData(): void {
  const { setStats, setAnomalies, addFeedItem } = useAppStore();

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const [stats, anomalies] = await Promise.allSettled([
          getConflictStats(),
          getAnomalies(),
        ]);

        if (stats.status === "fulfilled") setStats(stats.value);

        if (anomalies.status === "fulfilled") {
          setAnomalies(anomalies.value);
          anomalies.value.slice(0, 5).forEach((a) =>
            addFeedItem({
              type: "anomaly",
              title: a.title,
              subtitle: a.description?.slice(0, 80) ?? null,
              severity: a.severity as "critical" | "high" | "medium" | "low",
              timestamp: a.timestamp,
              lat: a.latitude ?? undefined,
              lon: a.longitude ?? undefined,
            })
          );
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    }

    load();

    // Refresh stats every 5 minutes
    const interval = setInterval(() => {
      getConflictStats().then(setStats).catch(console.error);
    }, 300_000);

    return () => clearInterval(interval);
  }, [setStats, setAnomalies, addFeedItem]);
}
