/**
 * GCID Worker Process
 * Manages all data ingestion workers with configurable poll intervals.
 */

import "dotenv/config";
import { fetchAircraft } from "./aircraft/opensky";
import { fetchShips } from "./ships/aisstream";
import { fetchConflicts } from "./conflicts/acled";
import { fetchNews } from "./news/gdelt";
import { detectAnomalies } from "./anomalies/detector";
import { pool } from "./db";
import { logger } from "./logger";

const INTERVALS = {
  aircraft: Number(process.env.POLL_INTERVAL_AIRCRAFT) || 30_000,
  ships: Number(process.env.POLL_INTERVAL_SHIPS) || 60_000,
  conflicts: Number(process.env.POLL_INTERVAL_CONFLICTS) || 300_000,
  news: Number(process.env.POLL_INTERVAL_NEWS) || 120_000,
  anomalies: 300_000, // every 5 minutes
};

async function waitForDB(retries = 10): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      logger.info("Workers: PostgreSQL connection established");
      return;
    } catch {
      logger.warn(`Workers: DB not ready, retry ${i}/${retries}...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("Workers: Could not connect to PostgreSQL after retries");
}

function scheduleWorker(
  name: string,
  fn: () => Promise<void>,
  interval: number
): void {
  const run = async () => {
    try {
      logger.info(`Worker [${name}] starting`);
      await fn();
      logger.info(`Worker [${name}] completed`);
    } catch (err) {
      logger.error(`Worker [${name}] error:`, err);
    }
  };

  // Run immediately, then on interval
  run();
  setInterval(run, interval);
  logger.info(`Worker [${name}] scheduled every ${interval / 1000}s`);
}

async function main(): Promise<void> {
  logger.info("GCID Workers starting...");

  await waitForDB();

  scheduleWorker("aircraft", fetchAircraft, INTERVALS.aircraft);
  scheduleWorker("ships", fetchShips, INTERVALS.ships);
  scheduleWorker("conflicts", fetchConflicts, INTERVALS.conflicts);
  scheduleWorker("news", fetchNews, INTERVALS.news);
  scheduleWorker("anomalies", detectAnomalies, INTERVALS.anomalies);

  logger.info("All workers scheduled. Running...");
}

main().catch((err) => {
  logger.error("Fatal worker error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Workers: SIGTERM received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});
