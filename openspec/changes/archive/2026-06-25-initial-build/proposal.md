# Proposal: initial-build — Job Application Tracker

## 1. Problem

A Backend/Fullstack Engineer applying to remote jobs has no single place to track applications. Status lives across emails, job boards, and memory. There is no way to see response rate, which applications need a follow-up after a week of silence, or how many interviews are active. The result is missed follow-ups and zero visibility into the pipeline.

## 2. Solution

A local-only desktop web app under `tracker-app/`: a FastAPI + aiosqlite backend (single SQLite file, 5 endpoints) and a React 19 + Vite + TanStack Query v5 + Tailwind v4 + shadcn/ui frontend. One CRUD entity (`application`) plus a computed stats endpoint. No auth, no deploy — runs on `localhost`.

**Why raw aiosqlite (no SQLAlchemy):** single table, personal tool. An ORM adds migration and mapping overhead with zero benefit at this scale.

## 3. Scope

### In Scope
- `tracker-app/backend/`: `main.py`, `models.py`, `database.py`, `pyproject.toml` (uv), auto-created `tracker.db`
- `tracker-app/frontend/`: React SPA — `api/` hooks, 6 components, `App.tsx`, Vite config + proxy
- 5 REST endpoints, 1 SQLite table, computed stats
- 8-status color system with click-to-cycle
- `tracker-app/README.md`

### Out of Scope (Non-goals)
- Authentication / multi-user
- Deployment / containerization
- Automated test infrastructure (`strict_tdd: false`)
- Pagination (spec says "list all")
- Data export/import
- External notifications/reminders beyond the in-app follow-up banner

## 4. Architecture

```
tracker-app/
├── backend/   main.py (FastAPI app, lifespan, CORS, routes)
│              models.py (Pydantic schemas)
│              database.py (aiosqlite conn, init_db, CRUD + stats)
│              pyproject.toml · tracker.db (generated)
└── frontend/  src/api/ (TanStack Query hooks)
               src/components/ (6) · App.tsx · vite.config.ts · index.html
```

**Layers:** DB access (database.py) → validation (models.py) → routing (main.py). Frontend: hooks (data) → components (presentation) → `App.tsx` (composition + UI state).

**Data flow:** React Query hook → Vite proxy (`/api` → `:8000`) → FastAPI route → aiosqlite → SQLite file. Mutations invalidate `['applications']` and `['stats']`.

## 5. Data Model

SQLite table `applications`:

| Column | Type | Constraints | Rationale |
|---|---|---|---|
| id | TEXT | PK | UUID v4 generated in Python |
| empresa | TEXT | NOT NULL | |
| rol | TEXT | NOT NULL | |
| plataforma | TEXT | nullable | enum: Torre, GetOnBoard, Manfred, LinkedIn, Otro |
| fecha | DATE | NOT NULL | ISO `YYYY-MM-DD` string |
| contacto | TEXT | nullable | |
| estado | TEXT | NOT NULL | enum of 8 statuses |
| proximo_paso | TEXT | nullable | |
| notas | TEXT | nullable | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | **manually set on PUT** |

**Invariants:** UUID + timestamps generated in Python; enums enforced at Pydantic layer (not SQL); `updated_at` set explicitly in PUT (SQLite has no `ON UPDATE`); day-count math is client-side.

## 6. API Contract

Base `/api`, CORS for `http://localhost:5173`.

**ApplicationIn:** `{ empresa, rol, plataforma?, fecha, contacto?, estado, proximo_paso?, notas? }`
**ApplicationOut:** `ApplicationIn + { id, created_at, updated_at }`
**StatsOut:** `{ total, response_rate, active_interviews, offers, need_followup: string[] }`

| Method | Path | Request | Response |
|---|---|---|---|
| GET | /api/applications | — | `200 ApplicationOut[]` ordered by `fecha DESC` |
| POST | /api/applications | `ApplicationIn` | `201 ApplicationOut` (gen UUID + timestamps) |
| PUT | /api/applications/{id} | `ApplicationIn` | `200 ApplicationOut` (set `updated_at`), `404` if missing |
| DELETE | /api/applications/{id} | — | `204`, `404` if missing |
| GET | /api/stats | — | `200 StatsOut` (computed) |

**Stats:** `total`=COUNT(*); `response_rate`=COUNT(estado NOT IN aplicado,dm_enviado,sin_respuesta)/total×100; `active_interviews`=COUNT(estado IN entrevista,prueba_tecnica); `offers`=COUNT(estado=oferta); `need_followup`=ids WHERE estado IN (aplicado,dm_enviado) AND `fecha <= date('now','-7 days')`.

## 7. Frontend Architecture

Component tree: `App` → `MetricsBar`, `FollowUpAlert`, `FilterTabs`, `AppTable` (→ `StatusBadge`), `AppModal`.

| Component | Responsibility |
|---|---|
| MetricsBar | 4 cards: Total, Tasa de respuesta, Entrevistas activas, Ofertas |
| FollowUpAlert | Yellow banner when `need_followup` > 0; resolves empresa names from apps list |
| FilterTabs | "Todas (N)" + one button per status with ≥1 app; counts from unfiltered list |
| AppTable | 6-col table; amber highlight for stale rows; badge click cycles status |
| StatusBadge | Colored pill; maps estado → colors; click → next status |
| AppModal | Add/Edit Dialog, all fields |

**Query strategy:** `useApplications` `['applications']`, `useStats` `['stats']`; mutations `useCreateApp`/`useUpdateApp`/`useDeleteApp` invalidate both keys; `useCycleStatus` does optimistic update.
**State:** server state in React Query; only filter selection + modal open/edit-target as local `useState` in `App.tsx`.

## 8. Design Tokens

- **Colors:** navy primary (active tabs/headers), amber stale-row + follow-up accents, yellow follow-up banner, neutral grays for surfaces; per-status bg/text pairs (Section 9).
- **Typography:** system sans; bold metric values, regular table body, small muted labels.
- **Spacing:** card grid gap, table row padding, modal field stacking — Tailwind scale defaults.

## 9. Status System

8 statuses, cycle order (wraps):
`aplicado → dm_enviado → en_revision → entrevista → prueba_tecnica → oferta → rechazado → sin_respuesta → (back to) aplicado`

Each renders as a `StatusBadge` with a distinct bg/text pair (defined in spec phase). Clicking a badge advances to the next status; `sin_respuesta` **wraps to `aplicado`** (confirmed decision). `response_rate` excludes `aplicado`, `dm_enviado`, `sin_respuesta`; `need_followup` targets `aplicado`/`dm_enviado` older than 7 days.

## 10. Capabilities

### New Capabilities
- `application-tracking`: CRUD for job applications (table, model, GET/POST/PUT/DELETE endpoints, frontend table + modal).
- `pipeline-stats`: computed `/api/stats` (response rate, active interviews, offers, follow-up list) + MetricsBar/FollowUpAlert.
- `status-workflow`: 8-status enum, click-to-cycle (wrap), color system, StatusBadge.

### Modified Capabilities
- None (greenfield).

## 11. Delivery Plan (3 chained PRs)

Effort ~1,145 lines / ~17 files — exceeds the 400-line budget, so split:

1. **PR1 — Backend:** scaffold + `database.py`, `models.py`, `main.py`, `pyproject.toml`; smoke test GET returns `[]`.
2. **PR2 — Frontend foundation:** Vite/Tailwind/shadcn init, proxy, `api/` hooks, `StatusBadge`, `App.tsx` shell.
3. **PR3 — Full UI:** `MetricsBar`, `FollowUpAlert`, `FilterTabs`, `AppTable`, `AppModal`, wiring, README.

Each PR is autonomous, verifiable, and independently revertible.

## 12. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| shadcn/ui + Tailwind v4 init differs from v3 | Med | Use `npx shadcn@latest init` with the Tailwind v4 + Vite template |
| `updated_at` not auto-set by SQLite | Low | Explicit set in PUT handler |
| Total build exceeds 400-line PR budget | High | 3 chained PRs (Section 11) |
| `need_followup` returns IDs only | Low | FollowUpAlert joins `useStats` + `useApplications` |
| Filter counts reflect filtered view by mistake | Low | Derive counts from unfiltered list |

## Rollback Plan

Greenfield: rollback = revert the PR(s) and delete `tracker-app/` contents (or the generated `tracker.db`). No external systems, no migrations, no shared state — fully reversible per PR.

## Dependencies

- Backend: `fastapi`, `uvicorn[standard]`, `aiosqlite`, `pydantic`, `python-multipart` via `uv`.
- Frontend: `react@19`, `@tanstack/react-query@5`, `vite@6`, `tailwindcss@4`, shadcn/ui (dialog, button, input, select, textarea, badge, table, alert), `typescript@5`.

## Success Criteria

- [ ] `uv run` starts backend on `:8000`; `GET /api/applications` returns `[]` on fresh DB.
- [ ] All 5 endpoints behave per Section 6 (incl. 404s and `updated_at` on PUT).
- [ ] Frontend on `:5173` lists, creates, edits, deletes apps via proxy.
- [ ] MetricsBar + FollowUpAlert show correct computed stats.
- [ ] Status badge cycles through all 8 and wraps `sin_respuesta → aplicado`.
- [ ] Stale rows (>7d, aplicado/dm_enviado) highlight amber and appear in follow-up banner.
