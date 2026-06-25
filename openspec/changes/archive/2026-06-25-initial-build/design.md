# Design: initial-build — Job Application Tracker

Technical design for the greenfield local tracker. Maps the proposal's
HOW at architectural level. All code lives under `tracker-app/`.


---

## 1. Architecture Overview

### Layer diagram

```
SQLite file (tracker.db)
   ▲ aiosqlite (async driver)
   │
database.py        init_db + CRUD + stats   (data access, raw SQL)
   ▲
models.py          Pydantic validation       (boundary contracts)
   ▲
main.py            FastAPI routes + lifespan + CORS
   │  HTTP (JSON)
   ▼  Vite proxy  /api → :8000
api/*.ts           TanStack Query hooks       (server-state cache)
   ▲
components/*.tsx   presentation               (pure, prop-driven)
   ▲
App.tsx            composition + local UI state
```

Clean separation: data access never imports HTTP; components never call
`fetch` directly — they consume hooks. `App.tsx` owns only UI state.

### Data flow — read (`GET /api/applications`)

```
useApplications() → queryKey ['applications'] → /api/applications
→ main.py route → database.get_all_applications()
→ aiosqlite SELECT ... ORDER BY fecha DESC → rows → ApplicationOut[]
→ JSON → React Query cache → AppTable renders
```

### Data flow — write (mutation → invalidate → refetch)

```
AppModal submit → useCreateApp.mutate(data) → POST /api/applications
→ 201 ApplicationOut → onSuccess: queryClient.invalidateQueries(['applications'])
                                + invalidateQueries(['stats'])
→ both queries refetch (staleTime 0) → MetricsBar + AppTable re-render
```

`useCycleStatus` differs: optimistic (Section 3).

---

## 2. Backend Design

### database.py

**Connection approach**: one `async with aiosqlite.connect(DB_PATH) as db:`
per call. No pool — local single-file SQLite, single user, low concurrency.
Set `db.row_factory = aiosqlite.Row` so rows map to dict-like objects for
Pydantic `from_attributes`.

**`init_db()`**: `CREATE TABLE IF NOT EXISTS applications (...)` with the full
Section 5 schema. Called once from the FastAPI lifespan on startup.

**Functions**:

| Function | SQL core | Returns |
|---|---|---|
| `get_all_applications()` | `SELECT * ... ORDER BY fecha DESC` | `list[Row]` |
| `get_application(id)` | `SELECT * WHERE id=?` | `Row \| None` |
| `create_application(data)` | `INSERT ... VALUES(?...)` | created `Row` |
| `update_application(id, data)` | `UPDATE ... SET ..., updated_at=datetime('now') WHERE id=?` | updated `Row \| None` |
| `delete_application(id)` | `DELETE WHERE id=?` | `bool` (rowcount>0) |
| `get_stats()` | single aggregate query | `dict` |

All writes call `await db.commit()`. Create/update re-SELECT the row to
return canonical timestamps.

**`updated_at` pattern**: SQLite has no `ON UPDATE`. Every `update_application`
SQL explicitly sets `updated_at = datetime('now')`. `created_at` is never
touched after insert.

**Stats query** — one pass with CASE WHEN, no Python aggregation:

```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN estado NOT IN ('aplicado','dm_enviado','sin_respuesta')
           THEN 1 ELSE 0 END) AS responded,
  SUM(CASE WHEN estado IN ('entrevista','prueba_tecnica')
           THEN 1 ELSE 0 END) AS active_interviews,
  SUM(CASE WHEN estado = 'oferta' THEN 1 ELSE 0 END) AS offers
FROM applications;
```

`response_rate = round(responded/total*100, 1)` in Python (guard `total==0`→0).
`need_followup` is a second query:
`SELECT id FROM applications WHERE estado IN ('aplicado','dm_enviado') AND fecha <= date('now','-7 days')`.

### models.py

```python
class ApplicationIn(BaseModel):
    empresa: str
    rol: str
    fecha: str                     # ISO YYYY-MM-DD
    estado: Estado                 # str Enum, 8 values
    plataforma: Plataforma | None = None
    contacto: str | None = None
    proximo_paso: str | None = None
    notas: str | None = None

class ApplicationOut(ApplicationIn):
    id: str
    created_at: str
    updated_at: str
    model_config = ConfigDict(from_attributes=True)

class StatsOut(BaseModel):
    total: int
    response_rate: float           # 0–100, one decimal
    active_interviews: int
    offers: int
    need_followup: list[str]
```

`Estado` / `Plataforma` are `str, Enum` so invalid enums 422 at the boundary
(not enforced in SQL). `from_attributes=True` lets `ApplicationOut` build
directly from `aiosqlite.Row`.

### main.py

- `lifespan` async context manager: `await init_db()` on enter; nothing on exit.
- `app = FastAPI(lifespan=lifespan)`.
- `CORSMiddleware(allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])`.
- Routes:

| Route | Status | Notes |
|---|---|---|
| `GET /api/applications` | 200 | list |
| `POST /api/applications` | 201 | `id = str(uuid.uuid4())`; created/updated_at = `datetime('now')` via DB default or explicit |
| `PUT /api/applications/{id}` | 200 / 404 | 404 if `get_application` None before update |
| `DELETE /api/applications/{id}` | 204 / 404 | 404 if rowcount 0; empty body |
| `GET /api/stats` | 200 | `StatsOut` |

UUID generated in the POST handler, passed to `create_application`.

---

## 3. Frontend Design

### State architecture

- **Server state** (React Query): applications list, stats. Single source of
  truth; no duplication into `useState`.
- **Local state** (`App.tsx` `useState`): `activeFilter: string` (default
  `"todas"`), `editingApp: ApplicationOut | null`, `isModalOpen: boolean`.

### api/ hooks

A shared `client.ts` wraps `fetch('/api/...')` (relative — Vite proxies).

| Hook | Type | Key / behavior |
|---|---|---|
| `useApplications` | query | `['applications']`, `staleTime: 0` |
| `useStats` | query | `['stats']`, `staleTime: 0` |
| `useCreateApp` | mutation | POST → onSuccess invalidate `['applications']`+`['stats']` |
| `useUpdateApp` | mutation | PUT → same invalidation |
| `useDeleteApp` | mutation | DELETE → same invalidation |
| `useCycleStatus` | mutation | optimistic (below) |

**`useCycleStatus` optimistic pattern**:

```
onMutate(({id, next})): cancelQueries(['applications']);
   snapshot = getQueryData(['applications']);
   setQueryData(['applications'], rows => rows.map(r =>
       r.id===id ? {...r, estado: next} : r));
   return { snapshot }
onError(_e,_v,ctx): setQueryData(['applications'], ctx.snapshot)  // rollback
onSettled(): invalidateQueries(['applications']); invalidateQueries(['stats'])
```

Cycle order (wraps): `aplicado → dm_enviado → en_contacto → entrevista →
prueba_tecnica → oferta → rechazado → sin_respuesta → aplicado`. A shared
`STATUS_ORDER` array + `nextStatus()` helper lives in a `status.ts` constants
module reused by `StatusBadge` and the hook.

### Components

| Component | Props | Key logic / render |
|---|---|---|
| `StatusBadge` | `{ estado, onCycle }` | `STATUS_COLORS[estado]` (bg/text). Clickable `<span>` pill; click → `onCycle(nextStatus(estado))` |
| `MetricsBar` | `{ stats }` | 4 cards in flex row: Total, Tasa de respuesta (`${response_rate.toFixed(1)}%`), Entrevistas activas, Ofertas |
| `FollowUpAlert` | `{ needFollowup, applications }` | resolve IDs→empresa names locally; yellow banner, amber border; render only if length>0 |
| `FilterTabs` | `{ applications, activeFilter, setActiveFilter }` | counts from **full unfiltered** list; "Todas (N)" + one tab per status with count>0; active tab navy |
| `AppTable` | `{ applications, onEdit, onDelete }` | days = `Math.floor((Date.now()-Date.parse(fecha))/86400000)`; render "Hoy" if 0 else `${days}d`; amber+bold row when `estado∈{aplicado,dm_enviado} && days>=7`; embeds `StatusBadge`; edit/delete actions (delete confirms) |
| `AppModal` | `{ isOpen, onClose, editingApp }` | controlled form, all fields; `editingApp===null` → add (useCreateApp) else edit (useUpdateApp prefilled); empresa+rol required; submit → mutate → onClose |

Components are presentational/prop-driven except `AppModal` and the badge
cycle, which call mutation hooks directly (acceptable container leaf nodes).

### App.tsx composition

- `QueryClientProvider` wraps the tree (created once, module-level `QueryClient`).
- Render order: `MetricsBar` → `FollowUpAlert` (conditional) → `FilterTabs`
  → `AppTable` (or empty state) → `AppModal`.
- Filter logic: `activeFilter==="todas"` → all; else
  `apps.filter(a => a.estado===activeFilter)`; filtered list passed to AppTable.
- Empty state ("Tu búsqueda empieza aquí" 🚀) when applications length 0.

---

## 4. shadcn/ui Integration

- Init: `npx shadcn@latest init` (Tailwind v4 + Vite template).
- Components: Dialog, Button, Input, Select, Textarea, Table, Alert, Badge
  (StatusBadge stays a custom pill because of dynamic per-status colors).
- Tailwind v4: **no `tailwind.config.js`** — `@import "tailwindcss";` in
  `index.css`, theme tokens via CSS variables (`@theme`). Navy/amber/status
  colors declared as CSS custom properties.

---

## 5. pyproject.toml (uv)

```toml
[project]
name = "tracker-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "aiosqlite>=0.20",
    "pydantic>=2.9",
    "python-multipart>=0.0.12",
]
```

No `[tool.uv]` block needed. `uv sync` resolves; run `uvicorn main:app --reload`.

---

## 6. Vite config

```ts
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } },
});
```

Proxy means frontend uses relative `/api/...`; no CORS issue in dev, but
backend keeps CORS for direct `:8000` access.

---

## 7. Implementation Order

1. `tracker-app/backend/pyproject.toml` — env first so `uv sync` works.
2. `database.py` — schema + CRUD + stats (no HTTP deps).
3. `models.py` — contracts depend on nothing runtime.
4. `main.py` — wires lifespan + routes over the two above. **Smoke gate:
   `GET /api/applications` → `[]`.** (PR1 boundary.)
5. Frontend scaffold: Vite + Tailwind v4 + shadcn init + `vite.config.ts`.
6. `api/client.ts` + query/mutation hooks + `status.ts` constants.
7. `StatusBadge` + `App.tsx` shell (lists data). (PR2 boundary.)
8. `MetricsBar`, `FollowUpAlert`, `FilterTabs`, `AppTable`, `AppModal`, full
   wiring, `README.md`. (PR3 boundary.)

Backend-first lets the API be verified independently before any UI exists,
matching the proposal's 3 chained PRs.

---

## 8. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| ~~`en_revision` vs `en_contacto` mismatch~~ | ~~High~~ | ✓ Resolved: using `en_contacto` per CLAUDE.md |
| shadcn/Tailwind v4 init differs from v3 | Med | Use `shadcn@latest init` v4+Vite template; CSS-var theme, no config file |
| `updated_at` not auto-updated | Low | Explicit `datetime('now')` in every UPDATE |
| `need_followup` returns IDs only | Low | FollowUpAlert joins stats IDs with applications list locally |
| Filter counts reflect filtered view | Low | Derive counts from unfiltered `applications` |
| Optimistic cycle desync on error | Low | `onMutate` snapshot + `onError` rollback + `onSettled` invalidate |
| `response_rate` divide-by-zero on empty DB | Low | Guard `total==0 → 0.0` |
| Build exceeds 400-line PR budget (~1145 lines) | High | 3 chained PRs per Section 7 boundaries |
