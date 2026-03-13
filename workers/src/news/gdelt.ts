/**
 * GDELT (Global Database of Events, Language, and Tone) News Worker
 * Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 *
 * GDELT is completely free and open. No API key required.
 * We use their Doc 2.0 API to search for conflict-related articles.
 */

import axios from "axios";
import { pool } from "../db";
import { logger } from "../logger";

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";

const CONFLICT_KEYWORDS = [
  "war OR military OR attack OR missile OR airstrike OR troops OR invasion",
  "conflict OR battle OR combat OR offensive OR ceasefire",
  "nuclear OR sanctions OR hostilities OR skirmish",
].join(" ");

interface GDELTArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

/** Country name → approximate centre coordinates */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  ukraine: [49.0, 32.0],
  russia: [61.5, 105.3],
  israel: [31.5, 34.9],
  gaza: [31.4, 34.3],
  "united states": [37.1, -95.7],
  china: [35.9, 104.2],
  iran: [32.4, 53.7],
  taiwan: [23.7, 120.9],
  syria: [35.0, 38.0],
  yemen: [15.6, 48.5],
  myanmar: [19.2, 96.7],
  sudan: [12.9, 30.2],
  somalia: [5.2, 46.2],
  ethiopia: [9.1, 40.5],
  mali: [17.6, -3.9],
  nigeria: [9.1, 8.7],
  afghanistan: [33.9, 67.7],
  pakistan: [30.4, 69.3],
  iraq: [33.2, 43.7],
  libya: [26.3, 17.2],
  "north korea": [40.3, 127.5],
  philippines: [12.9, 121.8],
  armenia: [40.1, 45.0],
  azerbaijan: [40.1, 47.6],
  kosovo: [42.6, 20.9],
  serbia: [44.0, 20.9],
};

function inferCoordinates(
  title: string,
  sourcecountry: string
): [number, number] | [null, null] {
  const text = `${title} ${sourcecountry}`.toLowerCase();

  for (const [country, coords] of Object.entries(COUNTRY_COORDS)) {
    if (text.includes(country)) {
      // Add small jitter so markers don't stack exactly
      const jitter = (): number => (Math.random() - 0.5) * 2;
      return [coords[0] + jitter(), coords[1] + jitter()];
    }
  }
  return [null, null];
}

function parseSourCountry(code: string): string {
  return code.length === 2 ? code.toUpperCase() : code;
}

export async function fetchNews(): Promise<void> {
  try {
    const response = await axios.get(GDELT_DOC_API, {
      params: {
        query: CONFLICT_KEYWORDS,
        mode: "artlist",
        maxrecords: 75,
        timespan: "1h",
        format: "json",
        sort: "DateDesc",
      },
      timeout: 30_000,
    });

    const articles: GDELTArticle[] = response.data?.articles ?? [];
    logger.info(`GDELT: received ${articles.length} articles`);

    if (articles.length === 0) return;

    const values: unknown[] = [];
    const placeholders = articles.map((a, j) => {
      const base = j * 8;
      const [lat, lon] = inferCoordinates(a.title, a.sourcecountry);
      const externalId = `GDELT-${Buffer.from(a.url).toString("base64").slice(0, 100)}`;
      const publishedAt = a.seendate
        ? new Date(
            a.seendate.replace(
              /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
              "$1-$2-$3T$4:$5:$6Z"
            )
          )
        : new Date();

      values.push(
        externalId,
        a.title?.slice(0, 999) ?? "No title",
        null, // summary
        a.url?.slice(0, 1999) ?? null,
        a.domain ?? "gdelt",
        "conflict",
        parseSourCountry(a.sourcecountry ?? ""),
        publishedAt
      );

      const geomExpr =
        lat !== null && lon !== null
          ? `ST_SetSRID(ST_MakePoint(${lon},${lat}),4326)`
          : "NULL";

      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},${lat ?? "NULL"},${lon ?? "NULL"},$${base+7},$${base+8},NOW(),${geomExpr})`;
    });

    await pool.query(
      `INSERT INTO news_events
         (external_id, headline, summary, url, source, category, country,
          latitude, longitude, published_at, timestamp, geom)
       VALUES ${placeholders.join(",")}
       ON CONFLICT (external_id) DO NOTHING`,
      values
    );

    // Keep only last 48 hours of news
    await pool.query(`DELETE FROM news_events WHERE timestamp < NOW() - INTERVAL '48 hours'`);

    logger.info(`GDELT: inserted ${articles.length} news articles`);
  } catch (err) {
    logger.error("GDELT fetch error:", err);
  }
}
