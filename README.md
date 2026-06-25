# Job Tracker

A local desktop app to track job applications during an active 
remote job search. No cloud, no subscriptions — just a SQLite 
file on your machine.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-19-61DAFB)

---

## Features

- Add and manage job applications with status tracking
- 8 statuses: Aplicado → DM enviado → En contacto → Entrevista → 
  Prueba técnica → Oferta → Rechazado → Sin respuesta
- Automatic follow-up alerts for applications with no response 
  after 7 days
- Metrics dashboard: response rate, active interviews, offers
- Filter by status, click badges to cycle through states
- All data stored locally in a single `tracker.db` file

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Python 3.12+ · FastAPI · SQLite (aiosqlite)   |
| Frontend | React 19 · TypeScript · TanStack Query v5 · Tailwind v4 |
| Tooling  | uv · Vite · shadcn/ui                               |

## Getting Started

**Prerequisites:** Python 3.12+, Node 18+, uv

**Backend**
```bash
cd tracker-app/backend
uv sync
uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`

**Frontend** (in a separate terminal)
```bash
cd tracker-app/frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` — open it in your browser.

The `tracker.db` file is created automatically on first backend run.

## Project Structure
```bash
tracker-app/
├── backend/
│   ├── main.py        # FastAPI app, routes, DB init (lifespan)
│   ├── models.py      # Pydantic schemas (ApplicationIn, ApplicationOut, StatsOut)
│   ├── database.py    # aiosqlite CRUD + stats queries
│   └── tracker.db     # auto-created SQLite file
├── frontend/
│   ├── src/
│   │   ├── api/       # TanStack Query hooks + client
│   │   ├── components/# React components (MetricsBar, AppTable, AppModal, etc)
│   │   ├── constants/ # Status order, colors
│   │   └── App.tsx    # Main app composition
│   ├── vite.config.ts # Proxy /api to backend
│   └── package.json
└── README.md
```

## Database

SQLite table `applications`:
- `id` (UUID, primary key)
- `empresa`, `rol` (required)
- `plataforma` (Torre, GetOnBoard, Manfred, LinkedIn, Otro)
- `fecha` (ISO date)
- `estado` (one of 8 statuses)
- `contacto`, `proximo_paso`, `notas` (optional)
- `created_at`, `updated_at` (timestamps)

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/applications` | List all applications |
| POST | `/api/applications` | Create new application |
| PUT | `/api/applications/{id}` | Update application |
| DELETE | `/api/applications/{id}` | Delete application |
| GET | `/api/stats` | Get dashboard metrics |

CORS enabled for `http://localhost:5173` only.

## Development

Built with SDD (Spec-Driven Development) using Claude Code.
See `openspec/changes/archive/initial-build/` for design artifacts.

## License

MIT