import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./db/connection";
import { initWebSocket } from "./websocket/server";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./logger";

import aircraftRouter from "./routes/aircraft";
import shipsRouter from "./routes/ships";
import conflictsRouter from "./routes/conflicts";
import newsRouter from "./routes/news";
import aiRouter from "./routes/ai";
import anomaliesRouter from "./routes/anomalies";

const app = express();
const server = http.createServer(app);

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please wait." },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/aircraft", apiLimiter, aircraftRouter);
app.use("/api/ships", apiLimiter, shipsRouter);
app.use("/api/conflicts", apiLimiter, conflictsRouter);
app.use("/api/news", apiLimiter, newsRouter);
app.use("/api/anomalies", apiLimiter, anomaliesRouter);
app.use("/ai", aiLimiter, aiRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date(), version: "1.0.0" });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  initWebSocket(server);

  const port = Number(process.env.PORT ?? 4000);
  server.listen(port, () => {
    logger.info(`GCID Backend listening on port ${port}`);
    logger.info(`WebSocket server ready on ws://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  logger.error("Fatal startup error:", err);
  process.exit(1);
});
