# Job Tracker

A local desktop-friendly web app to track your remote job applications.
No authentication required: runs entirely on your machine.

## Prerequisites

- Python 3.12+
- Node 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

## Setup

### Backend (FastAPI + SQLite)

```bash
cd backend
uv sync
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`.  
The SQLite database (`tracker.db`) is created automatically on first run.

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

> Both servers must be running simultaneously. Start the backend first.

## Features

- **Application table**: 6 columns: Empresa/Rol, Plataforma, Días, Estado, Próximo paso, Acciones
- **Status cycle**: Click the status badge to cycle through 8 statuses with optimistic updates
- **Metrics bar**: Total aplicadas, Tasa de respuesta, Entrevistas activas, Ofertas
- **Follow-up alert**: Yellow banner when applications in `aplicado`/`dm_enviado` have been waiting 7+ days
- **Filter tabs**: Filter by status; only statuses with applications are shown
- **Add / Edit modal**: Form with all fields; empresa and rol are required
- **Delete confirmation**: Confirmation dialog before deleting

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.115+, aiosqlite, Pydantic v2, Python 3.12 |
| Database | SQLite (single `tracker.db` file, auto-created) |
| Frontend | React 19, Vite 6, TypeScript 5 |
| State | TanStack Query v5 |
| Styling | Tailwind CSS v4 |
