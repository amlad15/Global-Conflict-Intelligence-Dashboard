import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db/connection";

const router = Router();

/**
 * GET /aircraft
 * Returns aircraft positions from the last N minutes (default 5).
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minutes = Math.min(Number(req.query.minutes) || 5, 60);
    const bbox = req.query.bbox as string | undefined;
    const onGround = req.query.on_ground;

    let query = `
      SELECT DISTINCT ON (icao24)
        id, icao24, callsign, country,
        latitude, longitude, altitude, velocity,
        heading, vertical_rate, on_ground, timestamp
      FROM aircraft
      WHERE timestamp >= NOW() - INTERVAL '${minutes} minutes'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;

    const params: unknown[] = [];

    if (onGround !== undefined) {
      params.push(onGround === "true");
      query += ` AND on_ground = $${params.length}`;
    }

    if (bbox) {
      // bbox=minLon,minLat,maxLon,maxLat
      const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
      if ([minLon, minLat, maxLon, maxLat].every((n) => !isNaN(n))) {
        query += ` AND ST_Within(
          geom,
          ST_MakeEnvelope($${params.length + 1}, $${params.length + 2}, $${params.length + 3}, $${params.length + 4}, 4326)
        )`;
        params.push(minLon, minLat, maxLon, maxLat);
      }
    }

    query += " ORDER BY icao24, timestamp DESC LIMIT 5000";

    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount, updated_at: new Date() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /aircraft/:icao24/trail
 * Returns the last 30 minutes of positions for a specific aircraft.
 */
router.get("/:icao24/trail", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { icao24 } = req.params;
    const result = await pool.query(
      `SELECT latitude, longitude, altitude, heading, timestamp
       FROM aircraft
       WHERE icao24 = $1
         AND timestamp >= NOW() - INTERVAL '30 minutes'
       ORDER BY timestamp ASC
       LIMIT 200`,
      [icao24.toUpperCase()]
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
