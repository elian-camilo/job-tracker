# Spec: initial-build — Job Application Tracker

## 1. Capabilities

| Capability | Type | Description |
|---|---|---|
| `application-tracking` | New | CRUD for job applications: table, data model, GET/POST/PUT/DELETE endpoints, frontend table + modal |
| `pipeline-stats` | New | Computed `/api/stats` endpoint (response rate, active interviews, offers, follow-up list) + MetricsBar + FollowUpAlert |
| `status-workflow` | New | 8-status enum, click-to-cycle with wrap, color system, StatusBadge component |

---

## 2. Functional Requirements

### Capability: application-tracking

#### FR-001 — List Applications

The system MUST return all applications ordered by `fecha DESC` on `GET /api/applications`.

**Scenario: Fresh database**
- GIVEN the database contains no applications
- WHEN a client sends `GET /api/applications`
- THEN the response is `200` with an empty JSON array

**Scenario: Existing applications**
- GIVEN one or more applications exist
- WHEN a client sends `GET /api/applications`
- THEN the response is `200` with all applications ordered by `fecha` descending

---

#### FR-002 — Create Application

The system MUST create a new application and return it with a server-generated UUID and timestamps on `POST /api/applications`.

**Scenario: Valid payload**
- GIVEN a valid `ApplicationIn` payload (empresa, rol, fecha, estado all present)
- WHEN a client sends `POST /api/applications`
- THEN the response is `201` with `ApplicationOut` including `id` (UUID v4), `created_at`, and `updated_at`

**Scenario: Missing required field**
- GIVEN a payload missing `empresa`, `rol`, `fecha`, or `estado`
- WHEN a client sends `POST /api/applications`
- THEN the response is `422` with validation error details

---

#### FR-003 — Update Application

The system MUST update an existing application and set `updated_at` to the current timestamp on `PUT /api/applications/{id}`.

**Scenario: Valid update**
- GIVEN an application with the given `id` exists
- WHEN a client sends `PUT /api/applications/{id}` with a valid `ApplicationIn`
- THEN the response is `200` with `ApplicationOut` and `updated_at` reflecting the update time

**Scenario: Application not found**
- GIVEN no application with the given `id` exists
- WHEN a client sends `PUT /api/applications/{id}`
- THEN the response is `404`

---

#### FR-004 — Delete Application

The system MUST delete an existing application on `DELETE /api/applications/{id}`.

**Scenario: Existing application**
- GIVEN an application with the given `id` exists
- WHEN a client sends `DELETE /api/applications/{id}`
- THEN the response is `204` with no body

**Scenario: Application not found**
- GIVEN no application with the given `id` exists
- WHEN a client sends `DELETE /api/applications/{id}`
- THEN the response is `404`

---

#### FR-005 — Frontend Table

The system MUST display applications in a 6-column table: Empresa/Rol | Plataforma | Días desde aplicación | Estado | Próximo paso | Actions.

**Scenario: Days column — same day**
- GIVEN an application with `fecha` equal to today
- WHEN the table renders
- THEN the Días cell shows `"Hoy"`

**Scenario: Days column — past date**
- GIVEN an application with `fecha` N days before today (N > 0)
- WHEN the table renders
- THEN the Días cell shows `"${N}d"`

**Scenario: Stale row highlight**
- GIVEN an application with `estado` in `aplicado` or `dm_enviado` AND `fecha` is 7 or more days ago
- WHEN the table renders
- THEN the row's Días cell is displayed in amber, bold

---

#### FR-006 — Add/Edit Modal

The system MUST provide a modal form with fields: Empresa*, Rol*, Plataforma (select), Fecha (date), Contacto, Estado (select), Próximo paso, Notas (textarea).

**Scenario: Edit pre-fills data**
- GIVEN an application already exists
- WHEN the user clicks the edit action for that application
- THEN the modal opens with all fields pre-filled with the application's current data

**Scenario: Required field validation**
- GIVEN the modal is open
- WHEN the user submits without providing `empresa` or `rol`
- THEN the form does not submit and shows a validation error

**Scenario: Successful create**
- GIVEN valid data is entered
- WHEN the user submits the form in add mode
- THEN `POST /api/applications` is called, both `['applications']` and `['stats']` query keys are invalidated, and the modal closes

**Scenario: Successful edit**
- GIVEN valid data is entered
- WHEN the user submits the form in edit mode
- THEN `PUT /api/applications/{id}` is called, both query keys are invalidated, and the modal closes

---

#### FR-007 — Delete Confirmation

The system MUST show a confirmation dialog before executing a delete.

**Scenario: Confirmed delete**
- GIVEN the user clicks the delete action for an application
- WHEN the confirmation dialog appears and the user confirms
- THEN `DELETE /api/applications/{id}` is called and the application is removed from the list

**Scenario: Cancelled delete**
- GIVEN the user clicks the delete action for an application
- WHEN the confirmation dialog appears and the user cancels
- THEN no DELETE request is made and the application remains in the list

---

#### FR-008 — Empty State

The system MUST show an empty state when no applications exist.

**Scenario: No applications**
- GIVEN the applications list is empty
- WHEN the main view renders
- THEN a centered message "Tu búsqueda empieza aquí" with a rocket emoji and "Agrega tu primera aplicación." is displayed instead of the table

---

#### FR-009 — Filter Tabs

The system MUST display a "Todas (N)" tab and one tab per status that has at least one application. Counts MUST be derived from the unfiltered list.

**Scenario: Active filter**
- GIVEN the user selects a status tab
- WHEN the table renders
- THEN only applications with that status are shown, and the tab is highlighted in navy (#1E3A5F)

**Scenario: Status tabs visibility**
- GIVEN applications exist with statuses A and B but not C
- WHEN the filter bar renders
- THEN tabs for A and B are shown; no tab for C is shown

---

### Capability: pipeline-stats

#### FR-010 — Stats Endpoint

The system MUST compute and return stats on `GET /api/stats`.

Computation rules:
- `total`: COUNT(*) of all applications
- `response_rate`: COUNT(estado NOT IN `aplicado`, `dm_enviado`, `sin_respuesta`) / total × 100; returns `0` if total is 0
- `active_interviews`: COUNT(estado IN `entrevista`, `prueba_tecnica`)
- `offers`: COUNT(estado = `oferta`)
- `need_followup`: list of `id` values where estado IN (`aplicado`, `dm_enviado`) AND `fecha <= date('now', '-7 days')`

**Scenario: Empty database**
- GIVEN no applications exist
- WHEN `GET /api/stats` is called
- THEN the response is `200` with `{ total: 0, response_rate: 0, active_interviews: 0, offers: 0, need_followup: [] }`

**Scenario: Mixed statuses**
- GIVEN applications with various statuses exist
- WHEN `GET /api/stats` is called
- THEN each field reflects the correct computed count per the formulas above

---

#### FR-011 — MetricsBar

The system MUST display 4 metric cards at the top: Total aplicadas, Tasa de respuesta, Entrevistas activas, Ofertas. Values MUST be sourced from `GET /api/stats`.

**Scenario: Stats refresh on mutation**
- GIVEN any create, update, or delete mutation completes
- WHEN the query layer invalidates `['stats']`
- THEN the MetricsBar re-fetches and displays updated values

---

#### FR-012 — Follow-Up Alert

The system MUST display a yellow banner when `need_followup` is non-empty, showing empresa names resolved from the local applications list.

**Scenario: No stale applications**
- GIVEN `need_followup` is empty
- WHEN the page renders
- THEN no follow-up banner is shown

**Scenario: Stale applications present**
- GIVEN `need_followup` contains one or more IDs
- WHEN the page renders
- THEN a yellow banner appears showing the empresa names for those IDs, resolved from the loaded applications list

---

### Capability: status-workflow

#### FR-013 — Status Cycle

The system MUST cycle the status of an application through the following ordered sequence on badge click, wrapping from `sin_respuesta` back to `aplicado`:

`aplicado → dm_enviado → en_contacto → entrevista → prueba_tecnica → oferta → rechazado → sin_respuesta → aplicado`

**Scenario: Advance status**
- GIVEN an application with estado = `aplicado`
- WHEN the user clicks the StatusBadge
- THEN the application's estado becomes `dm_enviado`

**Scenario: Wrap from end**
- GIVEN an application with estado = `sin_respuesta`
- WHEN the user clicks the StatusBadge
- THEN the application's estado becomes `aplicado`

**Scenario: Optimistic update**
- GIVEN the user clicks the StatusBadge
- WHEN the UI updates
- THEN the badge reflects the new status immediately before the `PUT /api/applications/{id}` response arrives; if the PUT fails, the status reverts to the previous value

---

#### FR-014 — Status Badge Colors

The system MUST render each status as a colored pill using the following bg/text pairs:

| Status | Background | Text |
|---|---|---|
| `aplicado` | `#EFF6FF` | `#1D4ED8` |
| `dm_enviado` | `#F5F3FF` | `#5B21B6` |
| `en_contacto` | `#FFFBEB` | `#92400E` |
| `entrevista` | `#FFF7ED` | `#9A3412` |
| `prueba_tecnica` | `#FFF7ED` | `#EA580C` |
| `oferta` | `#ECFDF5` | `#065F46` |
| `rechazado` | `#FEF2F2` | `#991B1B` |
| `sin_respuesta` | `#F9FAFB` | `#374151` |

---

## 3. Non-Functional Requirements

- NFR-001: The application MUST be local-only. No authentication, no external services, no deployment configuration.
- NFR-002: The database MUST be a single SQLite file auto-created on backend startup via `CREATE TABLE IF NOT EXISTS`.
- NFR-003: The backend MUST enable CORS exclusively for `http://localhost:5173`.
- NFR-004: All database queries MUST be async using `aiosqlite`.
- NFR-005: The frontend MUST proxy requests to `/api` to `http://localhost:8000` via Vite configuration.
- NFR-006: Both servers MUST be startable independently with a single command each.

---

## 4. Data Constraints

| Field | Type | Constraint |
|---|---|---|
| `id` | TEXT (UUID v4) | Required; generated server-side on POST |
| `empresa` | TEXT | Required; non-empty string |
| `rol` | TEXT | Required; non-empty string |
| `plataforma` | TEXT | Optional; MUST be one of `Torre`, `GetOnBoard`, `Manfred`, `LinkedIn`, `Otro`, or null |
| `fecha` | DATE | Required; ISO 8601 format `YYYY-MM-DD` |
| `contacto` | TEXT | Optional; no format constraint |
| `estado` | TEXT | Required; MUST be one of the 8 valid statuses |
| `proximo_paso` | TEXT | Optional |
| `notas` | TEXT | Optional |
| `created_at` | DATETIME | Set server-side on POST; not client-settable |
| `updated_at` | DATETIME | Set explicitly in the PUT handler; no database trigger |

---

## 5. Design Constraints

- DC-001: Page background color MUST be `#F3F6FA`.
- DC-002: Primary/active UI color (tabs, headers) MUST be `#1E3A5F` (navy).
- DC-003: Surface cards MUST use white background, `1px solid #E5E7EB` border, and `border-radius: 10px`.
- DC-004: Status badges MUST use the exact bg/text color pairs defined in FR-014.

---

## 6. Acceptance Criteria

| # | Criterion |
|---|---|
| AC-01 | `GET /api/applications` returns `200 []` on a fresh database |
| AC-02 | `POST /api/applications` with valid payload returns `201` with UUID and timestamps |
| AC-03 | `POST /api/applications` with missing `empresa` or `rol` returns `422` |
| AC-04 | `PUT /api/applications/{id}` returns `200` with updated `updated_at`; returns `404` for unknown id |
| AC-05 | `DELETE /api/applications/{id}` returns `204`; returns `404` for unknown id |
| AC-06 | `GET /api/stats` returns correct `response_rate`, `active_interviews`, `offers`, and `need_followup` for mixed data |
| AC-07 | Status badge cycles all 8 statuses in order; `sin_respuesta` wraps to `aplicado` |
| AC-08 | Status badge performs an optimistic update and reverts on PUT failure |
| AC-09 | The Días column shows "Hoy" for today; "${N}d" for N > 0 |
| AC-10 | Rows with `aplicado` or `dm_enviado` status and fecha >= 7 days ago have amber+bold Días cell |
| AC-11 | Follow-up banner is hidden when `need_followup` is empty; shows empresa names when non-empty |
| AC-12 | MetricsBar values update after any create, update, or delete mutation |
| AC-13 | Filter tabs show only statuses with at least one application; counts derive from unfiltered list |
| AC-14 | Edit modal opens pre-filled with the application's current data |
| AC-15 | Delete requires confirmation before issuing the DELETE request |
| AC-16 | Empty state message is shown when no applications exist |
| AC-17 | CORS allows requests from `http://localhost:5173` only |
| AC-18 | Vite proxy forwards `/api` requests to `http://localhost:8000` |
