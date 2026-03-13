import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db/connection";

const router = Router();

/**
 * GET /conflicts
 * Returns conflict events with optional filters.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const severity = req.query.severity as string | undefined;
    const country = req.query.country as string | undefined;
    const region = req.query.region as string | undefined;
    const bbox = req.query.bbox as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 500, 2000);

    let query = `
      SELECT
        id, external_id, event_type, sub_event_type, country, region,
        location, latitude, longitude, description, source, source_url,
        severity, fatalities, event_date, timestamp
      FROM conflict_events
      WHERE event_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;

    const params: unknown[] = [];

    if (severity) {
      params.push(severity);
      query += ` AND severity = $${params.length}`;
    }

    if (country) {
      params.push(`%${country}%`);
      query += ` AND country ILIKE $${params.length}`;
    }

    if (region) {
      params.push(`%${region}%`);
      query += ` AND region ILIKE $${params.length}`;
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

    params.push(limit);
    query += ` ORDER BY timestamp DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount, updated_at: new Date() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /conflicts/stats
 * Returns aggregated statistics for the dashboard.
 */
router.get("/stats", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                           AS total,
        COUNT(*) FILTER (WHERE severity = 'critical')    AS critical,
        COUNT(*) FILTER (WHERE severity = 'high')        AS high,
        COUNT(*) FILTER (WHERE severity = 'medium')      AS medium,
        COUNT(*) FILTER (WHERE severity = 'low')         AS low,
        SUM(fatalities)                                   AS total_fatalities,
        COUNT(DISTINCT country)                           AS countries_affected
      FROM conflict_events
      WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
    `);
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
