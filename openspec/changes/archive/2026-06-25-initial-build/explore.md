# Exploration: initial-build — Job Application Tracker

## Summary

A greenfield local desktop application that lets a Backend/Fullstack Engineer track remote job applications. The spec is fully defined: FastAPI + aiosqlite backend (5 endpoints, SQLite single-file DB) served on port 8000, React 19 + Vite + TanStack Query v5 + Tailwind v4 + shadcn/ui frontend on port 5173 with a Vite proxy. Everything lives inside `tracker-app/` in the repo. No authentication, no deployment — purely local.

---

## Current State

Repo root: `/home/ecam/Projects/work/tracker/`
Target: `/home/ecam/Projects/work/tracker/tracker-app/` — currently empty (only `.gitkeep`)
No existing code, no existing DB, no existing package manifests.
`openspec/config.yaml` is present and correctly describes the stack, testing state (strict_tdd: false, no runners configured), and SDD rules.

---

## Scope

**In scope:**
- `tracker-app/backend/` — FastAPI app (main.py, models.py, database.py) + tracker.db (auto-created)
- `tracker-app/frontend/` — React SPA (api/, components/, App.tsx, vite.config.ts)
- `tracker-app/README.md`
- Python project file (`pyproject.toml`) for `uv` package management
- 5 API endpoints, 1 SQLite table
- 6 frontend feature areas (metrics bar, follow-up alert, filter tabs, table, modal, empty state)
- Status color system (8 statuses with explicit bg/text colors)

**Out of scope:**
- Authentication or multi-user support
- Deployment or containerization
- Testing infrastructure (strict_tdd: false)
- Pagination (spec says "list all")
- Export/import of data
- Notifications or reminders outside the in-app follow-up banner

---

## Data Model

SQLite table `applications`:

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | TEXT | PRIMARY KEY | UUID v4 generated in Python |
| empresa | TEXT | NOT NULL | |
| rol | TEXT | NOT NULL | |
| plataforma | TEXT | nullable | enum: Torre, GetOnBoard, Manfred, LinkedIn, Otro |
| fecha | DATE | NOT NULL | ISO 8601 string in SQLite |
| contacto | TEXT | nullable | |
| estado | TEXT | NOT NULL | enum of 8 statuses |
| proximo_paso | TEXT | nullable | |
| notas | TEXT | nullable | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | must be manually updated on PUT |

**Edge cases:**
1. `updated_at` — SQLite has no `ON UPDATE` trigger. PUT handler must set it explicitly.
2. UUID generation — in Python (`str(uuid.uuid4())`), not in SQLite.
3. `fecha` stored as ISO string `YYYY-MM-DD`. Days calculation is client-side.
4. Enum constraints enforced only at Pydantic layer, not in SQL schema.

---

## API Surface

All endpoints under `/api`. CORS enabled for `http://localhost:5173`.

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | /api/applications | — | `list[ApplicationOut]` ordered by fecha DESC | |
| POST | /api/applications | `ApplicationIn` | `ApplicationOut` (201) | generates UUID, sets timestamps |
| PUT | /api/applications/{id} | `ApplicationIn` | `ApplicationOut` | must update updated_at manually |
| DELETE | /api/applications/{id} | — | 204 No Content | 404 if not found |
| GET | /api/stats | — | `StatsOut` | computed on the fly |

**Stats computation:**
- `total` = COUNT(*)
- `response_rate` = COUNT(*) WHERE estado NOT IN ('aplicado','dm_enviado','sin_respuesta') / total × 100
- `active_interviews` = COUNT(*) WHERE estado IN ('entrevista','prueba_tecnica')
- `offers` = COUNT(*) WHERE estado = 'oferta'
- `need_followup` = SELECT id WHERE estado IN ('aplicado','dm_enviado') AND fecha <= date('now', '-7 days')

---

## Frontend Components

| Component | File | Responsibility |
|---|---|---|
| `MetricsBar` | components/MetricsBar.tsx | 4-card row: Total, Tasa de respuesta, Entrevistas activas, Ofertas |
| `FollowUpAlert` | components/FollowUpAlert.tsx | Yellow banner when need_followup.length > 0. Resolves empresa names from applications list. |
| `FilterTabs` | components/FilterTabs.tsx | "Todas (N)" + per-status buttons (only statuses with >= 1 app). Navy highlight on active. |
| `AppTable` | components/AppTable.tsx | 6-column table. Amber highlight for stale rows. Cycle status on badge click. |
| `StatusBadge` | components/StatusBadge.tsx | Colored pill. Maps estado → bg/text. Clickable to cycle next status. |
| `AppModal` | components/AppModal.tsx | Add/Edit Dialog. All fields per spec. |

**TanStack Query hooks (src/api/):**

| Hook | Query Key | Action |
|---|---|---|
| `useApplications` | `['applications']` | GET /api/applications |
| `useStats` | `['stats']` | GET /api/stats |
| `useCreateApp` | mutation | POST, invalidate both keys |
| `useUpdateApp` | mutation | PUT, invalidate both keys |
| `useDeleteApp` | mutation | DELETE, invalidate both keys |
| `useCycleStatus` | mutation | PUT with next-status, optimistic update |

---

## Implementation Approach (recommended order)

1. Scaffold — directory tree, pyproject.toml, package.json, vite.config.ts, index.html
2. Backend: database.py — aiosqlite connection, init_db(), CRUD + stats queries
3. Backend: models.py — Pydantic schemas
4. Backend: main.py — FastAPI app, lifespan, CORS, routes
5. Smoke test — verify GET /api/applications returns []
6. Frontend: api/ — TanStack Query hooks
7. Frontend: components/ — StatusBadge → MetricsBar → FollowUpAlert → FilterTabs → AppTable → AppModal
8. Frontend: App.tsx — compose all components, manage filter + modal state
9. README.md

**Approach chosen: raw aiosqlite** (not SQLAlchemy). Single-table personal tool — ORM adds complexity with zero benefit.

---

## Risks and Ambiguities

| # | Risk | Severity | Resolution |
|---|---|---|---|
| 1 | Status cycle end behavior undefined (last status = sin_respuesta) | Medium | Recommend: wrap to `aplicado` |
| 2 | `updated_at` not auto-updated in SQLite | Low | Explicit set in PUT handler |
| 3 | shadcn/ui + Tailwind v4 compatibility (different init process) | Medium | Use `npx shadcn@latest init` with Tailwind v4 + Vite template |
| 4 | need_followup returns IDs — frontend must resolve empresa names from local list | Low | FollowUpAlert reads both useStats + useApplications |
| 5 | uv project setup requires proper pyproject.toml | Low | Standard scaffold with explicit deps |
| 6 | Date serialization: Pydantic date → ISO string in JSON | Low | FastAPI handles automatically with date type |
| 7 | Filter tab counts must reflect total per status, not filtered view | Low | Derive from unfiltered applications list |
| 8 | "Nd" in spec is literal N (days number) — e.g. "3d" | Low | `days === 0 ? "Hoy" : \`${days}d\`` |

---

## Dependencies

**Backend (pyproject.toml):**
```
fastapi >= 0.111
uvicorn[standard] >= 0.29
aiosqlite >= 0.20
pydantic >= 2.7
python-multipart >= 0.0.9
```

**Frontend (package.json):**
```
react@^19, react-dom@^19
@tanstack/react-query@^5
vite@^6, @vitejs/plugin-react@^4
tailwindcss@^4
shadcn/ui components: dialog, button, input, select, textarea, badge, table, alert
typescript@^5, @types/react, @types/react-dom
```

---

## Effort Estimate

| Layer | Files | Est. Lines |
|---|---|---|
| Backend (database.py, models.py, main.py, pyproject.toml) | 4 | ~325 |
| Frontend api/ hooks | ~2 | ~150 |
| Frontend components (6) | 6 | ~490 |
| Frontend App.tsx + config files | 4 | ~130 |
| README.md | 1 | ~50 |
| **Total** | **~17 files** | **~1,145 lines** |

**PR budget risk: High** — greenfield full build. Chained PRs recommended.
