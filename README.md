# GCID — Global Conflict Intelligence Dashboard

A production-ready, real-time **OSINT (Open-Source Intelligence)** monitoring platform that visualises global military activity, maritime vessel movement, conflict events, and news on a full-screen interactive map — with a built-in AI analysis assistant powered by a local LLM.

 Designed to demonstrate full-stack engineering capabilities including real-time data pipelines, spatial databases, WebSocket communication, and AI integration.

---



---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                           │
│  Next.js 14 · TypeScript · TailwindCSS · Leaflet · Socket.IO   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ Map View │ │ AI Chat  │ │ Filters  │ │   Event Feed       │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ WebSocket + REST
┌────────────────────────────▼────────────────────────────────────┐
│                       BACKEND API                               │
│              Node.js · Express · Socket.IO                      │
│  GET /api/aircraft   GET /api/ships    GET /api/conflicts       │
│  GET /api/news       GET /api/anomalies   POST /ai/analyze      │
└──────────┬──────────────────────────────────────┬───────────────┘
           │                                      │ HTTP
┌──────────▼────────────────┐         ┌───────────▼───────────────┐
│     PostgreSQL/PostGIS    │         │     Ollama (Local LLM)    │
│  aircraft · vessels       │         │  llama3 / mistral / phi3  │
│  conflict_events          │         └───────────────────────────┘
│  news_events              │
│  anomaly_alerts           │
└──────────▲────────────────┘
           │ INSERT/UPSERT
┌──────────┴────────────────────────────────────────────────────┐
│                    DATA WORKERS                               │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────┐  │
│  │  OpenSky    │ │ AISStream   │ │  ACLED   │ │  GDELT   │  │
│  │  Aircraft   │ │  Vessels    │ │ Conflicts│ │  News    │  │
│  │  30s poll   │ │  60s poll   │ │  5m poll │ │  2m poll │  │
│  └─────────────┘ └─────────────┘ └──────────┘ └──────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---|---|
| **Live Aircraft Tracking** | Real-time positions from OpenSky Network API, updated every 30 seconds |
| **Maritime AIS Tracking** | Vessel positions, type, speed and destination from AISStream.io |
| **Conflict Events** | ACLED dataset — global armed conflict events with severity and fatality data |
| **News Intelligence** | GDELT Doc 2.0 API — real-time conflict-related news with geo-tagging |
| **Interactive Map** | Leaflet map with dark theme, clustering, popups, and multiple tile layers |
| **Layer Controls** | Toggle aircraft, vessels, conflicts, news, and satellite imagery independently |
| **Timeline Slider** | Scroll back through the last 72 hours of events |
| **Real-time Feed** | Bottom event feed with live conflict alerts and news items |
| **AI Analyst Chat** | Local Ollama LLM with full OSINT context injection |
| **Filter System** | Region, severity, vessel type, altitude range, and time window filters |
| **Anomaly Detection** | Automatic detection of conflict spikes, aircraft clusters, vessel concentrations |
| **Stats Dashboard** | Live statistics panel with conflict counts, fatalities, and country coverage |
| **WebSocket Push** | All map data pushed live to connected clients via Socket.IO |
| **PostGIS Spatial** | All geographic data stored with PostGIS spatial indexes and bounding-box queries |

---

## Data Sources

| Source | Data | Free Tier |
|---|---|---|
| [OpenSky Network](https://opensky-network.org/) | Real-time aircraft ADS-B data | Yes — anonymous access (100 credits/day) |
| [ACLED](https://acleddata.com/) | Armed conflict events globally | Yes — free with registration |
| [GDELT Doc 2.0](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) | Global news with geo-tags | Yes — completely free, no key required |
| [AISStream.io](https://aisstream.io/) | Maritime AIS vessel tracking | Yes — free tier available |
| [CartoDB Dark Matter](https://carto.com/basemaps/) | Dark base map tiles | Yes — free |
| [NASA GIBS Night Lights](https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs) | Night lights tile layer | Yes — free |
| [Esri World Imagery](https://www.arcgis.com/) | Satellite imagery tiles | Yes — free |

> **Note:** The dashboard ships with demo/seed data for all sources. It works fully offline without any API keys, using representative data seeded into the database.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Docker | ≥ 24 | Run all services |
| Docker Compose | ≥ 2.0 | Orchestrate services |
| Ollama | Latest | Local LLM server |
| Node.js | ≥ 20 | Local development |
| Git | Any | Clone repo |

---

## Quick Start (Docker)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/gcid.git
cd gcid
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if you have API keys (optional — demo data works without them)
```

### 3. Install and start Ollama

```bash
# Install Ollama from https://ollama.ai
# Then pull a model:
ollama pull llama3

# Verify it's running:
curl http://localhost:11434/api/tags
```

### 4. Start everything

```bash
docker-compose up --build
```

Services start in order: PostgreSQL → Backend → Workers → Frontend.

Access the dashboard at: **http://localhost:3000**

---

## Local Development (No Docker)

### Backend

```bash
cd backend
npm install
cp ../.env.example .env   # configure DATABASE_URL etc.
npm run dev               # starts on :4000
```

### Workers

```bash
cd workers
npm install
cp ../.env.example .env
npm run dev               # starts all ingestion workers
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev               # starts on :3000
```

> You still need PostgreSQL running with PostGIS. Run:
> ```bash
> docker-compose up postgres
> ```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | Database name | `gcid` |
| `POSTGRES_USER` | Database user | `gcid_user` |
| `POSTGRES_PASSWORD` | Database password | `gcid_password` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | LLM model to use | `llama3` |
| `OPENSKY_USERNAME` | OpenSky credentials (optional) | — |
| `OPENSKY_PASSWORD` | OpenSky credentials (optional) | — |
| `ACLED_API_KEY` | ACLED API key (optional) | — |
| `ACLED_EMAIL` | ACLED registered email (optional) | — |
| `AISSTREAM_API_KEY` | AISStream.io API key (optional) | — |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL for browser | `http://localhost:4000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for browser | `ws://localhost:4000` |

---

## AI Analysis Examples

With Ollama running, type into the chat panel:

```
"Summarize global conflict activity in the last 24 hours"

"What military activity is happening near Ukraine?"

"Are there unusual aircraft patterns today?"

"Which regions show rising tensions?"

"Summarize maritime activity in the Middle East"

"How many fatalities have been reported this week?"
```

The AI receives a live OSINT context summary (aircraft count, vessel count, conflict statistics, recent headlines) before responding.

### Supported Models

```bash
# High quality (recommended)
ollama pull llama3

# Faster, lighter
ollama pull mistral
ollama pull phi3

# Change model in .env:
OLLAMA_MODEL=mistral
```

---

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/aircraft` | Aircraft positions (params: `minutes`, `bbox`, `on_ground`) |
| GET | `/api/aircraft/:icao24/trail` | Position trail for specific aircraft |
| GET | `/api/ships` | Vessel positions (params: `minutes`, `type`, `bbox`) |
| GET | `/api/conflicts` | Conflict events (params: `days`, `severity`, `country`, `region`) |
| GET | `/api/conflicts/stats` | Aggregated conflict statistics |
| GET | `/api/news` | News events (params: `hours`, `country`, `source`) |
| GET | `/api/anomalies` | Detected anomaly alerts |
| POST | `/ai/analyze` | AI analysis (body: `{ query, context? }`) |
| GET | `/ai/status` | Ollama availability check |
| GET | `/health` | Service health check |

### WebSocket Events

| Event | Direction | Data |
|---|---|---|
| `aircraft:update` | Server → Client | Full aircraft array (on connect, then every 30s) |
| `vessels:update` | Server → Client | Full vessel array |
| `conflicts:update` | Server → Client | Full conflict array |
| `news:update` | Server → Client | Recent news array |
| `conflicts:new` | Server → Client | New conflict events (incremental) |
| `news:new` | Server → Client | New news events (incremental) |

---

## Database Schema

```sql
-- Aircraft positions (TTL: 2 hours)
aircraft (id, icao24, callsign, country, latitude, longitude,
          altitude, velocity, heading, vertical_rate, on_ground,
          geom GEOMETRY(Point,4326), timestamp)

-- AIS vessel positions (TTL: 4 hours)
vessels (id, mmsi, name, vessel_type, flag, latitude, longitude,
         speed, course, heading, destination, status, length,
         geom GEOMETRY(Point,4326), timestamp)

-- Conflict events (persistent, 365 days retention)
conflict_events (id, external_id, event_type, sub_event_type,
                 country, region, location, latitude, longitude,
                 description, source, severity, fatalities,
                 geom, event_date, timestamp)

-- News items (TTL: 48 hours)
news_events (id, external_id, headline, summary, url, source,
             category, latitude, longitude, country,
             geom, published_at, timestamp)

-- Anomaly alerts
anomaly_alerts (id, alert_type, title, description, severity,
                latitude, longitude, geom, metadata, resolved, timestamp)
```

---

## Project Structure

```
gcid/
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment template
├── README.md
│
├── database/
│   └── init.sql                # Schema + seed data
│
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── app.ts              # Express app + server bootstrap
│   │   ├── logger.ts           # Winston logger
│   │   ├── db/connection.ts    # PostgreSQL pool
│   │   ├── routes/             # REST route handlers
│   │   │   ├── aircraft.ts
│   │   │   ├── ships.ts
│   │   │   ├── conflicts.ts
│   │   │   ├── news.ts
│   │   │   ├── ai.ts           # Ollama integration
│   │   │   └── anomalies.ts
│   │   ├── websocket/server.ts # Socket.IO push server
│   │   └── middleware/
│   │       └── errorHandler.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── workers/                    # Data ingestion workers
│   ├── src/
│   │   ├── index.ts            # Worker scheduler
│   │   ├── db.ts               # DB pool
│   │   ├── logger.ts
│   │   ├── aircraft/opensky.ts # OpenSky Network poller
│   │   ├── ships/aisstream.ts  # AISStream.io client
│   │   ├── conflicts/acled.ts  # ACLED API client
│   │   ├── news/gdelt.ts       # GDELT Doc 2.0 client
│   │   └── anomalies/detector.ts # Anomaly detection
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
└── frontend/                   # Next.js 14 app
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx        # Main dashboard page
    │   │   └── globals.css     # Global styles + Leaflet overrides
    │   ├── types/index.ts      # Shared TypeScript types
    │   ├── lib/
    │   │   ├── api.ts          # Axios API client
    │   │   ├── constants.ts    # Map configs, colors
    │   │   └── utils.ts        # Helpers
    │   ├── store/
    │   │   └── useAppStore.ts  # Zustand global state
    │   ├── hooks/
    │   │   ├── useWebSocket.ts # Socket.IO connection
    │   │   └── useInitialData.ts
    │   └── components/
    │       ├── Map/
    │       │   ├── MapContainer.tsx
    │       │   ├── AircraftLayer.tsx
    │       │   ├── VesselLayer.tsx
    │       │   ├── ConflictLayer.tsx
    │       │   ├── NewsLayer.tsx
    │       │   ├── LayerControls.tsx
    │       │   └── TimelineControl.tsx
    │       ├── panels/
    │       │   ├── RightPanel.tsx
    │       │   ├── AIChat.tsx
    │       │   ├── FilterPanel.tsx
    │       │   ├── StatsPanel.tsx
    │       │   └── EventFeedPanel.tsx
    │       └── ui/
    │           ├── Header.tsx
    │           └── StatusBar.tsx
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.ts
    └── Dockerfile
```

---

## Anomaly Detection

The system automatically runs these checks every 5 minutes:

| Check | Trigger | Severity |
|---|---|---|
| **Conflict Spike** | Event rate > 2× 7-day average | High |
| **Aircraft Cluster** | > 50 airborne aircraft in 2° grid cell | Medium |
| **Vessel Concentration** | > 20 vessels in 1° grid cell | Low |

Alerts appear in the Stats panel and the live event feed.

---

## Registering for Free API Keys

### OpenSky Network (Aircraft)
1. Register at https://opensky-network.org/
2. Add credentials to `.env`:
   ```
   OPENSKY_USERNAME=your_username
   OPENSKY_PASSWORD=your_password
   ```
   Authenticated users get 400 credits/day (vs 100 anonymous)

### ACLED (Conflict Events)
1. Register at https://acleddata.com/register/
2. Add to `.env`:
   ```
   ACLED_API_KEY=your_key
   ACLED_EMAIL=your@email.com
   ```

### AISStream.io (Vessel Tracking)
1. Register at https://aisstream.io/
2. Add to `.env`:
   ```
   AISSTREAM_API_KEY=your_key
   ```

> **Without any API keys**, the system uses demo seed data and still renders a fully functional dashboard.

---

## Contributing

Pull requests welcome. For major changes, open an issue first.

Please follow the existing code style (TypeScript strict mode, functional components, Zustand for state).

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

## Disclaimer

This project uses only publicly available, open-source data. It is intended for educational, research, and portfolio purposes only. No classified or restricted data sources are used.

---

*Built with Node.js · Next.js 14 · TypeScript · PostgreSQL/PostGIS · Leaflet · Socket.IO · Ollama*
