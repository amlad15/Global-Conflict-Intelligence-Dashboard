import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db/connection";

const router = Router();

/**
 * GET /anomalies
 * Returns recent unresolved anomaly alerts.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hours = Math.min(Number(req.query.hours) || 6, 48);
    const result = await pool.query(
      `SELECT id, alert_type, title, description, severity,
              latitude, longitude, metadata, timestamp
       FROM anomaly_alerts
       WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
         AND resolved = FALSE
       ORDER BY severity DESC, timestamp DESC
       LIMIT 50`
    );
    res.json({ data: result.rows, count: result.rowCount });
  } catch (err) {
    next(err);
  }
});

export default router;
