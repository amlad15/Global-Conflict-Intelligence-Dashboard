import { Pool } from "pg";
import { logger } from "../logger";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error", err);
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    logger.info("PostgreSQL connected successfully");
  } finally {
    client.release();
  }
}
