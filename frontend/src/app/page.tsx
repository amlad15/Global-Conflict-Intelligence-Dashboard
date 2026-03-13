"use client";

import dynamic from "next/dynamic";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useInitialData } from "@/hooks/useInitialData";
import Header from "@/components/ui/Header";
import StatusBar from "@/components/ui/StatusBar";
import RightPanel from "@/components/panels/RightPanel";
import EventFeedPanel from "@/components/panels/EventFeedPanel";

// Leaflet must be loaded client-side only (no SSR)
const MapContainer = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-text-secondary font-mono text-sm tracking-widest">
          INITIALIZING MAP SYSTEMS...
        </p>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  useWebSocket();
  useInitialData();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top header bar */}
      <Header />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Full-screen map */}
        <div className="flex-1 relative">
          <MapContainer />
        </div>

        {/* Right slide-in panel (AI chat + filters) */}
        <RightPanel />
      </div>

      {/* Bottom event feed */}
      <EventFeedPanel />

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
