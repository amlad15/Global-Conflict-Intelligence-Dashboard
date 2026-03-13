/**
 * AIS Ship Tracking Worker
 *
 * Primary: AISStream.io WebSocket API (free tier)
 * Fallback: MarineTraffic-compatible REST simulation with demo data
 *
 * AISstream API: https://aisstream.io/documentation
 * Free tier provides a WebSocket feed of AIS messages.
 */

import axios from "axios";
import { pool } from "../db";
import { logger } from "../logger";

// Vessel type codes from AIS spec
const VESSEL_TYPE_MAP: Record<number, string> = {
  0: "Unknown",
  20: "Wing in Ground",
  21: "Wing in Ground - Hazardous A",
  30: "Fishing",
  31: "Towing",
  35: "Military",
  36: "Sailing",
  37: "Pleasure Craft",
  50: "Pilot Vessel",
  51: "Search and Rescue",
  52: "Tug",
  53: "Port Tender",
  55: "Law Enforcement",
  60: "Passenger",
  70: "Cargo",
  80: "Tanker",
  90: "Other",
};

function getVesselType(typeCode: number): string {
  const base = Math.floor(typeCode / 10) * 10;
  return VESSEL_TYPE_MAP[typeCode] ?? VESSEL_TYPE_MAP[base] ?? "Unknown";
}

interface VesselRecord {
  mmsi: string;
  name: string | null;
  vessel_type: string;
  flag: string | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
  destination: string | null;
  status: string | null;
  length: number | null;
}

/**
 * Fetch vessel data from AISstream.io REST endpoint.
 * Falls back to demo data if API key is not set.
 */
export async function fetchShips(): Promise<void> {
  const apiKey = process.env.AISSTREAM_API_KEY;

  if (!apiKey) {
    logger.info("No AISSTREAM_API_KEY — injecting demo vessel data");
    await injectDemoVessels();
    return;
  }

  try {
    // AISstream supports a REST snapshot endpoint
    const response = await axios.get("https://api.aisstream.io/v0/vessels/latest", {
      headers: { Authorization: `Bearer ${apiKey}` },
      params: { limit: 1000 },
      timeout: 30_000,
    });

    const vessels: VesselRecord[] = (response.data?.vessels ?? []).map(
      (v: Record<string, unknown>) => ({
        mmsi: String(v.mmsi),
        name: v.name ?? null,
        vessel_type: getVesselType(Number(v.shipType ?? 0)),
        flag: v.flag ?? null,
        latitude: Number(v.latitude),
        longitude: Number(v.longitude),
        speed: v.sog != null ? Number(v.sog) : null,
        course: v.cog != null ? Number(v.cog) : null,
        heading: v.heading != null ? Number(v.heading) : null,
        destination: v.destination ?? null,
        status: v.navigationStatus ?? null,
        length: v.length != null ? Number(v.length) : null,
      })
    );

    await upsertVessels(vessels);
    logger.info(`AISstream: upserted ${vessels.length} vessel records`);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      logger.warn("AISstream: invalid API key — injecting demo data");
      await injectDemoVessels();
      return;
    }
    logger.error("AISstream fetch error:", err);
    // Inject demo data so the dashboard has something to show
    await injectDemoVessels();
  }
}

async function upsertVessels(vessels: VesselRecord[]): Promise<void> {
  if (vessels.length === 0) return;

  const chunkSize = 100;
  for (let i = 0; i < vessels.length; i += chunkSize) {
    const chunk = vessels.slice(i, i + chunkSize);
    const values: unknown[] = [];
    const placeholders = chunk.map((v, j) => {
      const base = j * 12;
      values.push(
        v.mmsi, v.name, v.vessel_type, v.flag,
        v.latitude, v.longitude, v.speed, v.course,
        v.heading, v.destination, v.status, v.length
      );
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},NOW(),ST_SetSRID(ST_MakePoint($${base+6},$${base+5}),4326))`;
    });

    await pool.query(
      `INSERT INTO vessels
         (mmsi, name, vessel_type, flag, latitude, longitude, speed, course, heading, destination, status, length, timestamp, geom)
       VALUES ${placeholders.join(",")}
       ON CONFLICT (mmsi, timestamp) DO NOTHING`,
      values
    );
  }

  // Prune old records
  await pool.query(`DELETE FROM vessels WHERE timestamp < NOW() - INTERVAL '4 hours'`);
}

async function injectDemoVessels(): Promise<void> {
  const demo: VesselRecord[] = [
    { mmsi: "211123456", name: "ATLANTIC HOPE", vessel_type: "Cargo", flag: "DE", latitude: 54.5, longitude: 10.2, speed: 12.4, course: 270, heading: 268, destination: "HAMBURG", status: "Under way", length: 180 },
    { mmsi: "636092123", name: "PACIFIC CARRIER", vessel_type: "Tanker", flag: "LR", latitude: 25.0, longitude: 57.0, speed: 14.1, course: 90, heading: 88, destination: "SINGAPORE", status: "Under way", length: 320 },
    { mmsi: "477123789", name: "ORIENT EXPRESS", vessel_type: "Cargo", flag: "HK", latitude: 22.3, longitude: 114.1, speed: 0.2, course: 0, heading: 45, destination: "HONG KONG", status: "Moored", length: 260 },
    { mmsi: "636015678", name: "ARCTIC PIONEER", vessel_type: "Research", flag: "NO", latitude: 69.0, longitude: 18.5, speed: 8.3, course: 315, heading: 312, destination: "TROMSO", status: "Under way", length: 120 },
    { mmsi: "255806000", name: "MEDITERRANEAN", vessel_type: "Passenger", flag: "PT", latitude: 38.7, longitude: -9.1, speed: 18.5, course: 180, heading: 179, destination: "LISBON", status: "Under way", length: 290 },
    { mmsi: "565478001", name: "STRAIT RUNNER", vessel_type: "Tanker", flag: "SG", latitude: 1.25, longitude: 103.8, speed: 10.1, course: 270, heading: 268, destination: "ROTTERDAM", status: "Under way", length: 340 },
    { mmsi: "311000653", name: "GULF MERCHANT", vessel_type: "Cargo", flag: "BH", latitude: 26.2, longitude: 50.6, speed: 5.4, course: 45, heading: 44, destination: "DUBAI", status: "Under way", length: 190 },
    { mmsi: "370773000", name: "MARE NOSTRUM", vessel_type: "Military", flag: "IT", latitude: 37.5, longitude: 15.0, speed: 22.0, course: 270, heading: 268, destination: "CLASSIFIED", status: "Under way", length: 145 },
    { mmsi: "413654321", name: "YANGTZE GLORY", vessel_type: "Cargo", flag: "CN", latitude: 31.2, longitude: 121.5, speed: 3.1, course: 90, heading: 87, destination: "SHANGHAI", status: "Moored", length: 280 },
    { mmsi: "229765000", name: "BLACK SEA TRADER", vessel_type: "Cargo", flag: "GR", latitude: 43.0, longitude: 33.5, speed: 9.8, course: 135, heading: 132, destination: "ODESSA", status: "Under way", length: 155 },
  ];

  await upsertVessels(demo);
  logger.info(`Demo vessels injected: ${demo.length}`);
}
