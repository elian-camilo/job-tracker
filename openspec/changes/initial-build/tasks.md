# Tasks: initial-build — Job Application Tracker

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,145 (17 files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (Backend) → PR2 (Frontend foundation) → PR3 (Full UI) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Working FastAPI backend with all 5 endpoints | PR1 | Base: main branch; smoke gate: GET /api/applications → [] |
| 2 | Frontend shell wired to backend, all query hooks in place | PR2 | Depends on PR1; base: PR1 branch (feature-chain) or main (stacked) |
| 3 | Complete UI — all components, full wiring, README | PR3 | Depends on PR2; base: PR2 branch (feature-chain) or main (stacked) |

---

## Phase 1: Backend Infrastructure (PR1)

- [ ] 1.1 Create `tracker-app/backend/pyproject.toml` with uv project config (fastapi>=0.115, uvicorn[standard]>=0.32, aiosqlite>=0.20, pydantic>=2.9, python-multipart>=0.0.12, requires-python>=3.12)
- [ ] 1.2 Create `tracker-app/backend/models.py` — `Estado` enum (8 values), `Plataforma` enum, `ApplicationIn`, `ApplicationOut` (with `ConfigDict(from_attributes=True)`), `StatsOut`
- [ ] 1.3 Create `tracker-app/backend/database.py` — `DB_PATH`, `init_db()` (CREATE TABLE IF NOT EXISTS with all 11 columns), `get_all_applications()`, `get_application(id)`, `create_application(data, id)`, `update_application(id, data)` (explicit `updated_at=datetime('now')`), `delete_application(id)`, `get_stats()` (single CASE WHEN aggregate + separate need_followup query)
- [ ] 1.4 Create `tracker-app/backend/main.py` — FastAPI app, lifespan calling `init_db()`, CORSMiddleware for `http://localhost:5173`, 5 routes: GET/POST `/api/applications`, PUT/DELETE `/api/applications/{id}`, GET `/api/stats`; UUID generated in POST handler
- [ ] 1.5 Smoke test PR1: run `uv sync && uvicorn main:app --reload`, verify `GET /api/applications` returns `200 []`; verify `POST` returns `201` with UUID; verify `DELETE` unknown id returns `404` (satisfies AC-01, AC-02, AC-05)

---

## Phase 2: Frontend Foundation (PR2)

- [ ] 2.1 Create `tracker-app/frontend/` scaffold: `package.json` (react@19, @tanstack/react-query@5, vite@6, tailwindcss@4, typescript@5), `index.html`, `tsconfig.json`
- [ ] 2.2 Create `tracker-app/frontend/vite.config.ts` — react plugin + proxy `/api` → `http://localhost:8000` (satisfies NFR-005, AC-18)
- [ ] 2.3 Run `npx shadcn@latest init` with Tailwind v4 + Vite template; set `@import "tailwindcss";` in `tracker-app/frontend/src/index.css`; declare navy/amber CSS custom properties via `@theme`
- [ ] 2.4 Create `tracker-app/frontend/src/api/client.ts` — `apiFetch(path, init?)` wrapping `fetch('/api' + path)` with JSON response handling
- [ ] 2.5 Create `tracker-app/frontend/src/constants/status.ts` — `STATUS_ORDER` array (8 values in cycle order), `nextStatus(estado)` helper (wraps sin_respuesta → aplicado), `STATUS_COLORS` map with bg/text pairs per FR-014
- [ ] 2.6 Create `tracker-app/frontend/src/api/hooks.ts` — `useApplications` (query, key `['applications']`, staleTime 0), `useStats` (query, key `['stats']`, staleTime 0), `useCreateApp` (POST mutation, invalidates both keys), `useUpdateApp` (PUT mutation, invalidates both keys), `useDeleteApp` (DELETE mutation, invalidates both keys), `useCycleStatus` (optimistic mutation with snapshot/rollback on error + onSettled invalidate)
- [ ] 2.7 Create `tracker-app/frontend/src/components/StatusBadge.tsx` — clickable `<span>` pill; applies `STATUS_COLORS[estado]` as inline bg/text style; click calls `onCycle(nextStatus(estado))`
- [ ] 2.8 Create `tracker-app/frontend/src/App.tsx` shell — `QueryClient` + `QueryClientProvider`, calls `useApplications`, renders raw application list and loading/error states
- [ ] 2.9 Verify PR2: `npm run dev` on :5173 shows application rows fetched from backend; network tab confirms `/api/applications` proxied to `:8000` (satisfies AC-18, NFR-005)

---

## Phase 3: Full UI + Wiring (PR3)

- [ ] 3.1 Create `tracker-app/frontend/src/components/MetricsBar.tsx` — 4 stat cards (Total aplicadas, Tasa de respuesta with `.toFixed(1)%`, Entrevistas activas, Ofertas); props: `{ stats: StatsOut }`; surface card styling per DC-003 (satisfies FR-011, AC-12)
- [ ] 3.2 Create `tracker-app/frontend/src/components/FollowUpAlert.tsx` — receives `{ needFollowup: string[], applications: ApplicationOut[] }`; resolves IDs to empresa names locally; renders yellow banner with amber border only when `needFollowup.length > 0` (satisfies FR-012, AC-11)
- [ ] 3.3 Create `tracker-app/frontend/src/components/FilterTabs.tsx` — "Todas (N)" tab + one tab per status with count > 0; counts from full unfiltered list; active tab styled with navy (#1E3A5F); props: `{ applications, activeFilter, setActiveFilter }` (satisfies FR-009, AC-13)
- [ ] 3.4 Create `tracker-app/frontend/src/components/AppTable.tsx` — 6 columns (Empresa/Rol, Plataforma, Días, Estado, Próximo paso, Actions); days = `Math.floor((Date.now()-Date.parse(fecha))/86400000)`; render "Hoy" if 0, else `${days}d`; amber+bold Días cell when estado ∈ {aplicado, dm_enviado} && days >= 7; embeds `StatusBadge` with `useCycleStatus`; edit button → `onEdit(app)`; delete button → `window.confirm` then `useDeleteApp.mutate(id)` (satisfies FR-005, FR-007, AC-09, AC-10, AC-15)
- [ ] 3.5 Create `tracker-app/frontend/src/components/AppModal.tsx` — controlled form using shadcn Dialog; fields: Empresa*, Rol*, Plataforma (Select), Fecha (date input), Contacto, Estado (Select), Próximo paso, Notas (Textarea); empresa+rol required; `editingApp === null` → useCreateApp, else useUpdateApp pre-filled; onSuccess → `onClose()` (satisfies FR-006, AC-03, AC-14)
- [ ] 3.6 Wire `App.tsx` fully — add local state (`activeFilter`, `editingApp`, `isModalOpen`); render order: `MetricsBar` → `FollowUpAlert` (conditional on needFollowup) → `FilterTabs` → filtered `AppTable` or empty state ("Tu búsqueda empieza aquí 🚀 / Agrega tu primera aplicación.") → `AppModal`; filter logic: todas → all apps, else `apps.filter(a => a.estado === activeFilter)` (satisfies FR-008, FR-009, AC-16, DC-001, DC-002)
- [ ] 3.7 Create `tracker-app/README.md` — backend setup (`uv sync`, `uvicorn main:app --reload` on :8000) and frontend setup (`npm install`, `npm run dev` on :5173)
- [ ] 3.8 Full manual verification: add application → appears in table + MetricsBar updates (AC-12); edit → modal pre-filled (AC-14); delete → confirm dialog then row removed (AC-15); click StatusBadge 8 times → cycles all statuses wrapping sin_respuesta → aplicado (AC-07); optimistic update visible before server response (AC-08); filter tabs hide/show per status (AC-13); follow-up banner appears for aplicado/dm_enviado rows >= 7 days (AC-11); empty state shown on fresh DB (AC-16)

---

## Spec Coverage Summary

| Requirement | Covered By |
|---|---|
| FR-001 (List) | 1.3, 1.4, 1.5 |
| FR-002 (Create) | 1.3, 1.4, 1.5 |
| FR-003 (Update) | 1.3, 1.4 |
| FR-004 (Delete) | 1.3, 1.4, 1.5 |
| FR-005 (Table) | 3.4 |
| FR-006 (Modal) | 3.5 |
| FR-007 (Delete confirm) | 3.4 |
| FR-008 (Empty state) | 3.6 |
| FR-009 (Filter tabs) | 3.3, 3.6 |
| FR-010 (Stats endpoint) | 1.3, 1.4 |
| FR-011 (MetricsBar) | 3.1 |
| FR-012 (FollowUpAlert) | 3.2 |
| FR-013 (Status cycle) | 2.5, 2.6, 2.7 |
| FR-014 (Badge colors) | 2.5, 2.7 |
| NFR-001..006 | 1.1–1.5, 2.1–2.3 |
