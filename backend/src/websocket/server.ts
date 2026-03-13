import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { pool } from "../db/connection";
import { logger } from "../logger";

let io: SocketIOServer;

export function initWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Send initial data burst on connect
    sendInitialData(socket).catch((err) =>
      logger.error("Error sending initial data:", err)
    );

    socket.on("subscribe", (channels: string[]) => {
      channels.forEach((ch) => socket.join(ch));
      logger.debug(`Client ${socket.id} subscribed to: ${channels.join(", ")}`);
    });

    socket.on("disconnect", (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id} (${reason})`);
    });
  });

  // Push updates to all connected clients every N seconds
  startBroadcastLoop();

  return io;
}

async function sendInitialData(socket: Socket): Promise<void> {
  const [aircraft, vessels, conflicts, news] = await Promise.allSettled([
    pool.query(`
      SELECT DISTINCT ON (icao24)
        icao24, callsign, country, latitude, longitude,
        altitude, velocity, heading, on_ground, timestamp
      FROM aircraft
      WHERE timestamp >= NOW() - INTERVAL '5 minutes'
        AND latitude IS NOT NULL
      ORDER BY icao24, timestamp DESC
      LIMIT 3000
    `),
    pool.query(`
      SELECT DISTINCT ON (mmsi)
        mmsi, name, vessel_type, flag, latitude, longitude,
        speed, course, heading, destination, status, timestamp
      FROM vessels
      WHERE timestamp >= NOW() - INTERVAL '30 minutes'
        AND latitude IS NOT NULL
      ORDER BY mmsi, timestamp DESC
      LIMIT 1000
    `),
    pool.query(`
      SELECT id, event_type, country, location, latitude, longitude,
             description, severity, fatalities, event_date, timestamp
      FROM conflict_events
      WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
        AND latitude IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 500
    `),
    pool.query(`
      SELECT id, headline, summary, url, source, country,
             latitude, longitude, published_at, timestamp
      FROM news_events
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY published_at DESC NULLS LAST
      LIMIT 100
    `),
  ]);

  if (aircraft.status === "fulfilled") {
    socket.emit("aircraft:update", aircraft.value.rows);
  }
  if (vessels.status === "fulfilled") {
    socket.emit("vessels:update", vessels.value.rows);
  }
  if (conflicts.status === "fulfilled") {
    socket.emit("conflicts:update", conflicts.value.rows);
  }
  if (news.status === "fulfilled") {
    socket.emit("news:update", news.value.rows);
  }
}

function startBroadcastLoop(): void {
  // Aircraft: every 30 seconds
  setInterval(async () => {
    if (io.engine.clientsCount === 0) return;
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (icao24)
          icao24, callsign, country, latitude, longitude,
          altitude, velocity, heading, on_ground, timestamp
        FROM aircraft
        WHERE timestamp >= NOW() - INTERVAL '2 minutes'
          AND latitude IS NOT NULL
        ORDER BY icao24, timestamp DESC
        LIMIT 3000
      `);
      io.emit("aircraft:update", result.rows);
    } catch (err) {
      logger.error("WS aircraft broadcast error:", err);
    }
  }, 30_000);

  // Vessels: every 60 seconds
  setInterval(async () => {
    if (io.engine.clientsCount === 0) return;
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (mmsi)
          mmsi, name, vessel_type, flag, latitude, longitude,
          speed, course, heading, destination, status, timestamp
        FROM vessels
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
          AND latitude IS NOT NULL
        ORDER BY mmsi, timestamp DESC
        LIMIT 1000
      `);
      io.emit("vessels:update", result.rows);
    } catch (err) {
      logger.error("WS vessels broadcast error:", err);
    }
  }, 60_000);

  // Conflicts & news: every 2 minutes
  setInterval(async () => {
    if (io.engine.clientsCount === 0) return;
    try {
      const [cf, nw] = await Promise.all([
        pool.query(`
          SELECT id, event_type, country, location, latitude, longitude,
                 description, severity, fatalities, event_date, timestamp
          FROM conflict_events
          WHERE timestamp >= NOW() - INTERVAL '5 minutes'
            AND latitude IS NOT NULL
          ORDER BY timestamp DESC
          LIMIT 50
        `),
        pool.query(`
          SELECT id, headline, summary, url, source, country,
                 latitude, longitude, published_at, timestamp
          FROM news_events
          WHERE timestamp >= NOW() - INTERVAL '5 minutes'
          ORDER BY published_at DESC NULLS LAST
          LIMIT 20
        `),
      ]);
      if (cf.rowCount && cf.rowCount > 0) io.emit("conflicts:new", cf.rows);
      if (nw.rowCount && nw.rowCount > 0) io.emit("news:new", nw.rows);
    } catch (err) {
      logger.error("WS conflicts/news broadcast error:", err);
    }
  }, 120_000);
}

export function getIO(): SocketIOServer {
  return io;
}
