/**
 * Anomaly Detector
 * Runs simple statistical checks on recent data to surface alerts.
 */

import { pool } from "../db";
import { logger } from "../logger";

export async function detectAnomalies(): Promise<void> {
  await Promise.allSettled([
    detectConflictSpike(),
    detectAircraftCluster(),
    detectVesselConcentration(),
  ]);
}

/** Alert if conflict events in the last 3 hours exceed 2× the 7-day hourly average */
async function detectConflictSpike(): Promise<void> {
  try {
    const result = await pool.query(`
      WITH hourly_avg AS (
        SELECT COUNT(*) / 168.0 AS avg_per_hour
        FROM conflict_events
        WHERE timestamp >= NOW() - INTERVAL '7 days'
      ),
      recent AS (
        SELECT COUNT(*) AS recent_count
        FROM conflict_events
        WHERE timestamp >= NOW() - INTERVAL '3 hours'
      )
      SELECT recent_count, avg_per_hour,
             (recent_count / 3.0) AS recent_per_hour
      FROM hourly_avg, recent
    `);

    const row = result.rows[0];
    if (!row) return;

    const recentPerHour = parseFloat(row.recent_per_hour);
    const avgPerHour = parseFloat(row.avg_per_hour);

    if (avgPerHour > 0 && recentPerHour > avgPerHour * 2 && recentPerHour > 3) {
      await pool.query(
        `INSERT INTO anomaly_alerts
           (alert_type, title, description, severity, metadata, timestamp)
         VALUES ('conflict_spike', $1, $2, 'high', $3, NOW())
         ON CONFLICT DO NOTHING`,
        [
          "Conflict Event Spike Detected",
          `Conflict reporting rate (${recentPerHour.toFixed(1)}/hr) is ${(recentPerHour / avgPerHour).toFixed(1)}× the 7-day average (${avgPerHour.toFixed(1)}/hr).`,
          JSON.stringify({ recentPerHour, avgPerHour, window: "3h" }),
        ]
      );
      logger.warn(`Anomaly: conflict spike detected — ${recentPerHour.toFixed(1)} events/hr`);
    }
  } catch (err) {
    logger.error("Conflict spike detection error:", err);
  }
}

/** Alert if >50 aircraft are clustered within a 200km radius */
async function detectAircraftCluster(): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        ROUND(latitude::numeric / 2) * 2 AS lat_bucket,
        ROUND(longitude::numeric / 2) * 2 AS lon_bucket,
        COUNT(DISTINCT icao24) AS count,
        AVG(latitude) AS center_lat,
        AVG(longitude) AS center_lon
      FROM (
        SELECT DISTINCT ON (icao24)
          icao24, latitude, longitude
        FROM aircraft
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
          AND on_ground = FALSE
          AND latitude IS NOT NULL
        ORDER BY icao24, timestamp DESC
      ) sub
      GROUP BY lat_bucket, lon_bucket
      HAVING COUNT(DISTINCT icao24) > 50
      ORDER BY count DESC
      LIMIT 5
    `);

    for (const row of result.rows) {
      await pool.query(
        `INSERT INTO anomaly_alerts
           (alert_type, title, description, severity, latitude, longitude, geom, metadata, timestamp)
         VALUES ('aircraft_cluster', $1, $2, 'medium', $3, $4,
                 ST_SetSRID(ST_MakePoint($4, $3), 4326), $5, NOW())`,
        [
          `Aircraft Cluster: ${row.count} airborne aircraft`,
          `${row.count} airborne aircraft detected within a 2° grid cell centred at ${parseFloat(row.center_lat).toFixed(2)}°N, ${parseFloat(row.center_lon).toFixed(2)}°E.`,
          parseFloat(row.center_lat),
          parseFloat(row.center_lon),
          JSON.stringify({ count: row.count, lat_bucket: row.lat_bucket, lon_bucket: row.lon_bucket }),
        ]
      );
    }

    if (result.rowCount && result.rowCount > 0) {
      logger.info(`Anomaly: ${result.rowCount} aircraft cluster(s) detected`);
    }
  } catch (err) {
    logger.error("Aircraft cluster detection error:", err);
  }
}

/** Alert if >20 vessels are within a 1° grid cell */
async function detectVesselConcentration(): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        ROUND(latitude::numeric) AS lat_bucket,
        ROUND(longitude::numeric) AS lon_bucket,
        COUNT(DISTINCT mmsi) AS count,
        AVG(latitude) AS center_lat,
        AVG(longitude) AS center_lon
      FROM (
        SELECT DISTINCT ON (mmsi)
          mmsi, latitude, longitude
        FROM vessels
        WHERE timestamp >= NOW() - INTERVAL '30 minutes'
          AND latitude IS NOT NULL
        ORDER BY mmsi, timestamp DESC
      ) sub
      GROUP BY lat_bucket, lon_bucket
      HAVING COUNT(DISTINCT mmsi) > 20
      ORDER BY count DESC
      LIMIT 3
    `);

    for (const row of result.rows) {
      await pool.query(
        `INSERT INTO anomaly_alerts
           (alert_type, title, description, severity, latitude, longitude, geom, metadata, timestamp)
         VALUES ('vessel_concentration', $1, $2, 'low', $3, $4,
                 ST_SetSRID(ST_MakePoint($4, $3), 4326), $5, NOW())`,
        [
          `Vessel Concentration: ${row.count} vessels`,
          `${row.count} vessels detected within a 1° grid cell centred at ${parseFloat(row.center_lat).toFixed(2)}°N, ${parseFloat(row.center_lon).toFixed(2)}°E.`,
          parseFloat(row.center_lat),
          parseFloat(row.center_lon),
          JSON.stringify({ count: row.count }),
        ]
      );
    }
  } catch (err) {
    logger.error("Vessel concentration detection error:", err);
  }
}
