import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db/connection";

const router = Router();

/**
 * GET /ships
 * Returns recent vessel positions.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minutes = Math.min(Number(req.query.minutes) || 30, 120);
    const vesselType = req.query.type as string | undefined;
    const bbox = req.query.bbox as string | undefined;

    let query = `
      SELECT DISTINCT ON (mmsi)
        id, mmsi, name, vessel_type, flag,
        latitude, longitude, speed, course, heading,
        destination, status, length, timestamp
      FROM vessels
      WHERE timestamp >= NOW() - INTERVAL '${minutes} minutes'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;

    const params: unknown[] = [];

    if (vesselType) {
      params.push(`%${vesselType}%`);
      query += ` AND vessel_type ILIKE $${params.length}`;
    }

    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
      if ([minLon, minLat, maxLon, maxLat].every((n) => !isNaN(n))) {
        query += ` AND ST_Within(
          geom,
          ST_MakeEnvelope($${params.length + 1}, $${params.length + 2}, $${params.length + 3}, $${params.length + 4}, 4326)
        )`;
        params.push(minLon, minLat, maxLon, maxLat);
      }
    }

    query += " ORDER BY mmsi, timestamp DESC LIMIT 2000";

    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount, updated_at: new Date() });
  } catch (err) {
    next(err);
  }
});

export default router;
