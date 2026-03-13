"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppStore } from "@/store/useAppStore";
import { WS_URL } from "@/lib/constants";
import type { Aircraft, Vessel, ConflictEvent, NewsEvent } from "@/types";

export function useWebSocket(): void {
  const socketRef = useRef<Socket | null>(null);
  const {
    setConnected,
    setAircraft,
    addAircraft,
    setVessels,
    setConflicts,
    addConflicts,
    setNews,
    addNews,
    addFeedItem,
  } = useAppStore();

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.info("[WS] Connected to GCID backend");
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.warn("[WS] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
    });

    // Full dataset on first connect
    socket.on("aircraft:update", (data: Aircraft[]) => {
      setAircraft(data);
    });

    socket.on("vessels:update", (data: Vessel[]) => {
      setVessels(data);
    });

    socket.on("conflicts:update", (data: ConflictEvent[]) => {
      setConflicts(data);
    });

    socket.on("news:update", (data: NewsEvent[]) => {
      setNews(data);
    });

    // Incremental updates
    socket.on("conflicts:new", (data: ConflictEvent[]) => {
      addConflicts(data);
      data.forEach((e) =>
        addFeedItem({
          type: "conflict",
          title: `${e.event_type ?? "Conflict"} — ${e.location ?? e.country}`,
          subtitle: e.description?.slice(0, 80) ?? null,
          severity: e.severity,
          timestamp: e.timestamp,
          lat: e.latitude,
          lon: e.longitude,
        })
      );
    });

    socket.on("news:new", (data: NewsEvent[]) => {
      addNews(data);
      data.forEach((n) =>
        addFeedItem({
          type: "news",
          title: n.headline,
          subtitle: n.source ?? null,
          timestamp: n.timestamp,
          lat: n.latitude ?? undefined,
          lon: n.longitude ?? undefined,
        })
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    setConnected,
    setAircraft,
    addAircraft,
    setVessels,
    setConflicts,
    addConflicts,
    setNews,
    addNews,
    addFeedItem,
  ]);
}
