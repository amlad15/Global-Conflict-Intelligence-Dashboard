import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { pool } from "../db/connection";
import { logger } from "../logger";

const router = Router();

interface AnalyzeBody {
  query: string;
  context?: {
    region?: string;
    timeframe?: string;
  };
}

/**
 * Gathers a snapshot of current data from the DB to provide as context to the LLM.
 */
async function buildOSINTContext(region?: string): Promise<string> {
  const regionFilter = region ? `AND country ILIKE '%${region.replace(/'/g, "''")}%'` : "";

  const [aircraftResult, vesselResult, conflictResult, newsResult] = await Promise.all([
    pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE on_ground = FALSE) AS airborne,
             COUNT(DISTINCT country) AS countries
      FROM (
        SELECT DISTINCT ON (icao24) icao24, on_ground, country
        FROM aircraft
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
        ORDER BY icao24, timestamp DESC
      ) sub
    `),
    pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(DISTINCT vessel_type) AS types,
             COUNT(DISTINCT flag) AS flags
      FROM (
        SELECT DISTINCT ON (mmsi) mmsi, vessel_type, flag
        FROM vessels
        WHERE timestamp >= NOW() - INTERVAL '30 minutes'
        ORDER BY mmsi, timestamp DESC
      ) sub
    `),
    pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE severity = 'critical') AS critical,
        COUNT(*) FILTER (WHERE severity = 'high') AS high,
        COUNT(DISTINCT country) AS countries,
        SUM(fatalities) AS fatalities
      FROM conflict_events
      WHERE event_date >= CURRENT_DATE - INTERVAL '7 days'
      ${regionFilter}
    `),
    pool.query(`
      SELECT headline, source, country, published_at
      FROM news_events
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      ${regionFilter}
      ORDER BY published_at DESC NULLS LAST
      LIMIT 10
    `),
  ]);

  const ac = aircraftResult.rows[0];
  const vs = vesselResult.rows[0];
  const cf = conflictResult.rows[0];
  const news = newsResult.rows;

  const newsText = news.length
    ? news.map((n) => `- [${n.source}] ${n.headline} (${n.country ?? "Global"}, ${n.published_at ? new Date(n.published_at).toISOString().slice(0, 10) : "recent"})`).join("\n")
    : "No recent news items.";

  return `
=== OSINT SITUATIONAL AWARENESS SUMMARY ===
Generated: ${new Date().toUTCString()}
${region ? `Region filter: ${region}` : "Scope: Global"}

--- AIRCRAFT ---
Tracked aircraft (last 5 min): ${ac.total}
Airborne: ${ac.airborne}
Countries: ${ac.countries}

--- MARITIME ---
Tracked vessels (last 30 min): ${vs.total}
Vessel types: ${vs.types}
Flags: ${vs.flags}

--- CONFLICT EVENTS (last 7 days) ---
Total events: ${cf.total}
Critical severity: ${cf.critical}
High severity: ${cf.high}
Countries affected: ${cf.countries}
Total fatalities reported: ${cf.fatalities ?? 0}

--- RECENT NEWS HEADLINES ---
${newsText}

===========================================
`.trim();
}

/**
 * POST /ai/analyze
 * Sends a user query + live OSINT context to the local Ollama LLM.
 */
router.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, context } = req.body as AnalyzeBody;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    if (query.trim().length > 2000) {
      res.status(400).json({ error: "query too long (max 2000 characters)" });
      return;
    }

    const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL ?? "llama3";

    // Build OSINT context from DB
    const osintContext = await buildOSINTContext(context?.region);

    const systemPrompt = `You are an expert OSINT analyst for a Global Conflict Intelligence Dashboard.
You have access to real-time data from aircraft tracking, maritime AIS, conflict event databases, and news feeds.
Provide clear, factual, analytical responses based on the data provided.
Be concise but thorough. Use bullet points for clarity.
Do not speculate beyond the data. Flag data limitations when relevant.
Current date: ${new Date().toUTCString()}`;

    const userPrompt = `${osintContext}

USER QUERY: ${query}

Provide an analytical response based on the situational awareness data above.`;

    logger.info(`AI analyze request: model=${model}, query="${query.slice(0, 80)}..."`);

    // Stream response from Ollama
    const ollamaResponse = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 1024,
        },
      },
      { timeout: 120_000 }
    );

    const response = ollamaResponse.data.response as string;

    res.json({
      response,
      model,
      context_summary: {
        query,
        region: context?.region ?? "Global",
        generated_at: new Date(),
      },
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
        res.status(503).json({
          error: "Ollama service unavailable. Please ensure Ollama is running.",
          details: "Install from https://ollama.ai and run: ollama pull llama3",
        });
        return;
      }
    }
    next(err);
  }
});

/**
 * GET /ai/status
 * Check if Ollama is available.
 */
router.get("/status", async (_req: Request, res: Response) => {
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3";
  try {
    const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 5000 });
    const models = (response.data?.models ?? []) as Array<{ name: string }>;
    res.json({
      available: true,
      model,
      installed_models: models.map((m) => m.name),
    });
  } catch {
    res.json({ available: false, model });
  }
});

export default router;
