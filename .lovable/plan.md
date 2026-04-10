

## MOMENTUM & STUCKNESS COMPASS — Deployable Architecture

### Overview

**Frontend (React, this Lovable project):** Interactive dashboard deployed via Lovable publish (fallback) or Vercel (manual).

**Backend (Python/FastAPI, downloadable):** Agent engine with simulation, state machine, Exa AI, gamification. Generated to `/mnt/documents/` for Render deployment.

---

### Frontend (React) — Pages & Components

1. **Dashboard page (`/`)** — Main view with:
   - Student state indicator (normal/micro_stuck/momentum_dip/double_trouble) with color-coded badges
   - Live event log (scrolling timeline of agent decisions)
   - Active quests panel with progress and XP rewards
   - XP & streak stats bar
   - Exa resource links panel

2. **Controls panel** — Start/stop/reset simulation, adjust speed, force-trigger states

3. **API integration** — Configurable backend URL (env var `VITE_API_URL`), polling or SSE for live updates

### Backend (FastAPI) — Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/simulation/start` | POST | Start simulation loop |
| `/api/simulation/stop` | POST | Stop simulation |
| `/api/simulation/reset` | POST | Reset state |
| `/api/state` | GET | Current student state + metrics |
| `/api/quests` | GET | Active & completed quests |
| `/api/events` | GET | Event log (paginated) |
| `/api/stats` | GET | XP, streak, quest counts |
| `/api/trigger/{state}` | POST | Force-trigger a state for demo |

Backend runs the same agent logic (state machine, mock student, Exa client, quest engine) as previously specified, but wrapped in FastAPI with background task for the simulation loop.

### Backend Files (generated to `/mnt/documents/momentum_compass_backend/`)

```
momentum_compass_backend/
├── main.py              # FastAPI app + CORS + endpoints
├── config.py            # Thresholds, settings
├── requirements.txt     # fastapi, uvicorn, exa-py, python-dotenv
├── render.yaml          # Render deploy config
├── agent/
│   ├── state_machine.py
│   └── agent_core.py
├── simulation/
│   ├── mock_student.py
│   └── event_generator.py
├── exa/
│   └── exa_client.py
├── gamification/
│   ├── quest_engine.py
│   └── xp_system.py
└── utils/
    ├── logger.py
    └── helpers.py
```

### Deployment

- **Lovable publish**: Frontend works immediately with configurable API URL
- **Vercel**: Clone repo from GitHub, deploy as static site, set `VITE_API_URL` env var
- **Render**: Upload backend folder, Render auto-detects FastAPI via `render.yaml`, set `EXA_API_KEY` env var

### Technical Details

- Backend uses `asyncio` background task for simulation loop with configurable interval
- Frontend polls `/api/state` + `/api/events` every 2 seconds during active simulation
- All state stored in-memory (Python globals/singleton) — no database needed
- CORS configured to allow all origins for hackathon flexibility
- Exa calls wrapped with try/except fallback returning mock data if API key missing

