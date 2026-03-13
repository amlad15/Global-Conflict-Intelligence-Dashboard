/**
 * OpenSky Network Aircraft Worker
 * API docs: https://openskynetwork.github.io/opensky-api/rest.html
 *
 * Anonymous access: 100 API credits/day, 10s rate limit between requests.
 * Authenticated: 400 credits/day.
 *
 * State vector fields (by index):
 * 0  icao24, 1 callsign, 2 origin_country, 3 time_position, 4 last_contact,
 * 5  longitude, 6 latitude, 7 baro_altitude, 8 on_ground, 9 velocity,
 * 10 true_track (heading), 11 vertical_rate, 12 sensors, 13 geo_altitude,
 * 14 squawk, 15 spi, 16 position_source
 */

import axios from "axios";
import { pool } from "../db";
import { logger } from "../logger";

const BASE_URL = "https://opensky-network.org/api";
const USERNAME = process.env.OPENSKY_USERNAME;
const PASSWORD = process.env.OPENSKY_PASSWORD;

interface StateVector {
  icao24: string;
  callsign: string | null;
  origin_country: string | null;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
}

function parseStateVectors(raw: unknown[][]): StateVector[] {
  return raw
    .filter((s) => s[5] !== null && s[6] !== null) // must have coords
    .map((s) => ({
      icao24: String(s[0]).toUpperCase(),
      callsign: s[1] ? String(s[1]).trim() : null,
      origin_country: s[2] ? String(s[2]) : null,
      longitude: s[5] as number,
      latitude: s[6] as number,
      baro_altitude: s[7] as number | null,
      on_ground: Boolean(s[8]),
      velocity: s[9] as number | null,
      true_track: s[10] as number | null,
      vertical_rate: s[11] as number | null,
    }));
}

export async function fetchAircraft(): Promise<void> {
  try {
    const auth =
      USERNAME && PASSWORD
        ? { username: USERNAME, password: PASSWORD }
        : undefined;

    const response = await axios.get(`${BASE_URL}/states/all`, {
      auth,
      timeout: 30_000,
      params: { extended: 1 },
    });

    if (!response.data?.states) {
      logger.warn("OpenSky returned no states");
      return;
    }

    const vectors = parseStateVectors(response.data.states as unknown[][]);
    logger.info(`OpenSky: received ${vectors.length} aircraft`);

    if (vectors.length === 0) return;

    // Batch upsert in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < vectors.length; i += chunkSize) {
      const chunk = vectors.slice(i, i + chunkSize);
      const values: unknown[] = [];
      const placeholders = chunk.map((v, j) => {
        const base = j * 11;
        values.push(
          v.icao24,
          v.callsign,
          v.origin_country,
          v.latitude,
          v.longitude,
          v.baro_altitude,
          v.velocity,
          v.true_track,
          v.vertical_rate,
          v.on_ground,
          new Date()
        );
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},ST_SetSRID(ST_MakePoint($${base + 5},$${base + 4}),4326))`;
      });

      await pool.query(
        `INSERT INTO aircraft
           (icao24, callsign, country, latitude, longitude, altitude, velocity, heading, vertical_rate, on_ground, timestamp, geom)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (icao24, timestamp) DO NOTHING`,
        values
      );
    }

    // Prune old records (keep only last 2 hours per aircraft to avoid table bloat)
    await pool.query(`
      DELETE FROM aircraft
      WHERE timestamp < NOW() - INTERVAL '2 hours'
    `);

    logger.info(`OpenSky: upserted ${vectors.length} aircraft records`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 429) {
        logger.warn("OpenSky rate limited — backing off");
        return;
      }
    }
    logger.error("OpenSky fetch error:", err);
  }
}
