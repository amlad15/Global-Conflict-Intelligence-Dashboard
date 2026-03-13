import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db/connection";

const router = Router();

/**
 * GET /news
 * Returns recent conflict-related news events.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hours = Math.min(Number(req.query.hours) || 24, 72);
    const country = req.query.country as string | undefined;
    const source = req.query.source as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const bbox = req.query.bbox as string | undefined;

    let query = `
      SELECT
        id, external_id, headline, summary, url, source,
        category, latitude, longitude, country, published_at, timestamp
      FROM news_events
      WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
    `;

    const params: unknown[] = [];

    if (country) {
      params.push(`%${country}%`);
      query += ` AND country ILIKE $${params.length}`;
    }

    if (source) {
      params.push(`%${source}%`);
      query += ` AND source ILIKE $${params.length}`;
    }

    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
      if ([minLon, minLat, maxLon, maxLat].every((n) => !isNaN(n))) {
        query += ` AND latitude IS NOT NULL AND ST_Within(
          geom,
          ST_MakeEnvelope($${params.length + 1}, $${params.length + 2}, $${params.length + 3}, $${params.length + 4}, 4326)
        )`;
        params.push(minLon, minLat, maxLon, maxLat);
      }
    }

    params.push(limit);
    query += ` ORDER BY published_at DESC NULLS LAST, timestamp DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount, updated_at: new Date() });
  } catch (err) {
    next(err);
  }
});

export default router;
