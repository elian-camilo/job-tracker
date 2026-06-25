# job-tracker
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
- 8 statuses: Applied → DM sent → In contact → Interview → 
  Technical test → Offer → Rejected → No response
- Automatic follow-up alerts for applications with no response 
  after 7 days
- Metrics dashboard: response rate, active interviews, offers
- Filter by status, click badges to cycle through states
- All data stored locally in a single `tracker.db` file

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Python · FastAPI · SQLite (aiosqlite)   |
| Frontend | React 19 · TypeScript · TanStack Query v5 · Tailwind v4 · shadcn/ui |
| Tooling  | uv · Vite                               |

## Getting Started

**Prerequisites:** Python 3.12+, Node 18+, uv

**Backend**
```bash
cd backend
uv sync
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

The `tracker.db` file is created automatically on first run 
inside `/backend`.

## Project Structure
```bash
job-tracker/
├── backend/
│   ├── main.py        # FastAPI app, routes, DB init
│   ├── models.py      # Pydantic schemas
│   ├── database.py    # aiosqlite queries
│   └── tracker.db     # auto-created, gitignored
├── frontend/
│   └── src/
│       ├── api/       # TanStack Query hooks
│       ├── components/
│       └── App.tsx
└── README.md
```

## Tooling

Developed using Claude Code as AI pair programmer.

## License

MIT