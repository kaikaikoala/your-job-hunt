# Phase 1 Detailed Design: Job Hunt Tracking

## Overview

Full-stack CRUD web app for job hunt tracking. No AI in this phase.

**Architecture:**
```
Browser (React SPA)
  ↓ HTTPS / REST
Web Service (Spring Boot)
  ↓ JDBC / JPA
PostgreSQL
```

**Auth:** Firebase (Google OAuth). All data is per-user, scoped by Firebase UID.

**Local dev:** Docker Compose runs PostgreSQL locally.

**Delivery method:** Full-stack feature slices — each slice ships a working vertical (DB
migration + backend endpoint + frontend UI) before the next slice begins. Clear context between
slices; manually verify each slice end-to-end before committing.

---

## UI Design Reference

Mockups in `docs/*.html`. Key design decisions:

| Concern | Decision |
|:--------|:---------|
| App name | "The Digital Curator" |
| Headline font | Manrope (Google Fonts) |
| Body font | Inter (Google Fonts) |
| Icons | Material Symbols Outlined (Google) |
| Component library | MUI (`@mui/material`) |
| Charts | MUI X (`@mui/x-charts`) |
| Color — surface | `#F7F9FB` / white cards |
| Color — primary dark | `#0F172A` navy |
| Color — accent | `#607CEC` indigo |
| Color — rejected/error | `#BA1A1A` |
| Color — offer/success | `#4EDEA3` |
| Color — muted text | `#45464D` |
| Dashboard layout | Bento grid (Sankey hero 8-col + todo sidebar 4-col) |
| Nav | Fixed top bar — brand left, page links center, auth right |

---

## Database Schema

All user-owned tables carry a `user_id VARCHAR(128)` column (Firebase UID).

```sql
-- V1__create_network.sql
CREATE TABLE network (
    referrer_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      VARCHAR(128) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(100)
);

-- V2__create_applications.sql
CREATE TABLE applications (
    app_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          VARCHAR(128) NOT NULL,
    company          VARCHAR(255) NOT NULL,
    role             VARCHAR(255) NOT NULL,
    job_posting_url  VARCHAR(2048),
    referrer_id      UUID REFERENCES network(referrer_id),
    salary_range     VARCHAR(100),
    required_skills  TEXT,
    exp_required     VARCHAR(100),
    UNIQUE (user_id, job_posting_url)
);

-- V3__create_application_stage.sql
CREATE TABLE application_stage (
    app_stage_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id        UUID NOT NULL REFERENCES applications(app_id) ON DELETE CASCADE,
    stage         VARCHAR(100) NOT NULL,
    stage_date    DATE,
    result        VARCHAR(100)
);

-- V4__create_action_items.sql
CREATE TABLE action_items (
    action_item_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         VARCHAR(128) NOT NULL,
    app_id          UUID REFERENCES applications(app_id) ON DELETE SET NULL,
    referrer_id     UUID REFERENCES network(referrer_id) ON DELETE SET NULL,
    description     TEXT NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'open',
    due_date        DATE,
    create_date     TIMESTAMP NOT NULL DEFAULT now()
);
```

---

## REST API

All routes require `Authorization: Bearer <firebase_id_token>` except `GET /health`.
All data filtered to authenticated user's `user_id`.

### Network
| Method | Path | Body | Response |
|:-------|:-----|:-----|:---------|
| POST | `/network` | `{name, type?}` | `201` / `409` (FK conflict on delete) |
| GET | `/network` | — | `200 [{referrer_id, name, type}]` |
| GET | `/network/{id}` | — | `200` / `404` |
| PATCH | `/network/{id}` | `{name?, type?}` | `200` / `404` |
| DELETE | `/network/{id}` | — | `204` / `409` (FK) |

### Applications
| Method | Path | Body | Response |
|:-------|:-----|:-----|:---------|
| POST | `/applications` | `{company, role, job_posting_url?, referrer_id?, salary_range?, required_skills?, exp_required?}` | `201` / `409` (dup URL) |
| GET | `/applications` | — | `200 [ApplicationSummary]` |
| GET | `/applications/dashboard` | — | `200 [ApplicationWithLatestStage]` |
| GET | `/applications/{id}` | — | `200` / `404` |
| PATCH | `/applications/{id}` | partial fields | `200` / `404` |
| DELETE | `/applications/{id}` | — | `204` / `409` (action items FK) |

### Application Stages
| Method | Path | Body | Response |
|:-------|:-----|:-----|:---------|
| POST | `/applications/{app_id}/stages` | `{stage, stage_date?, result?}` | `201` / `404` |
| GET | `/applications/{app_id}/stages` | — | `200 [Stage]` |
| GET | `/applications/{app_id}/stages/{stage_id}` | — | `200` / `404` |
| PATCH | `/applications/{app_id}/stages/{stage_id}` | `{stage?, stage_date?, result?}` | `200` / `404` |
| DELETE | `/applications/{app_id}/stages/{stage_id}` | — | `204` / `404` |

### Action Items
| Method | Path | Body | Response |
|:-------|:-----|:-----|:---------|
| POST | `/action-items` | `{app_id?, referrer_id?, description, due_date?}` | `201` |
| GET | `/action-items` | `?app_id=&referrer_id=&status=` | `200 [ActionItem]` |
| PATCH | `/action-items/{id}` | partial fields | `200` / `404` |
| DELETE | `/action-items/{id}` | — | `204` / `404` |

---

## Slices

### Slice 0 — Project Scaffold

Get all services wired end-to-end and deployed, even empty.

**Infrastructure**
- `docker-compose.yml` at repo root: PostgreSQL 16, port 5432, named volume
- `database/migrations/` directory for Flyway SQL files

**Web service (`web-service/`)**
- Spring Boot, Kotlin, Gradle Kotlin DSL, JDK 21
- Dependencies: Spring Web, Spring Data JPA, Flyway, PostgreSQL driver, Spring Security
- Flyway location: `database/migrations/`
- Health endpoint: `GET /health` → `200 OK`
- `Dockerfile`: multi-stage (Gradle build → JDK 21 runtime)

**Frontend (`frontend/`)**
- Vite `react-ts` template
- Dependencies: `@mui/material @mui/x-charts @emotion/react @emotion/styled @tanstack/react-query firebase react-router-dom`
- Manrope + Inter loaded from Google Fonts in `index.html`
- MUI theme: colors + typography

**Deployment**
- `render.yaml`: Render PostgreSQL + web service (Docker) + static site (Vite build)
- Env vars: `DATABASE_URL`, Firebase service account

**Done when:** `GET /health` → 200 on Render; blank SPA loads at static site URL.

---

### Slice 1 — Landing Page

Static entry point, no auth.

**Reference:** `docs/home-mock.html`

**Frontend only**
- Route `/` → `LandingPage`
- Fixed top nav: "The Digital Curator" brand left; "Resume Builder" + "Hunt Tracker" links center; "Sign In" button right
- Two path cards (2-column grid):
  - **"Track & Conquer"** — high emphasis, dark navy, CTA links to `/sign-in`
  - **"Refine & Tailor"** — standard emphasis, CTA links to `/sign-in` (Phase 3 content)

**Done when:** Landing page live at Render URL.

---

### Slice 2 — Sign In Flow

Firebase auth end-to-end.

**Frontend**
- Firebase project + web app config in `.env`
- `AuthContext` + `useAuth`: `user`, `signInWithGoogle`, `signOut`
- Route `/sign-in` → `SignInPage`: Google OAuth button
- Protected route wrapper: unauthenticated → redirect `/sign-in`
- Post-sign-in redirect → `/dashboard`
- Top nav: authenticated state shows "Sign Out" + profile avatar
- Axios interceptor: `Authorization: Bearer <id_token>` on all requests

**Web service**
- Firebase Admin SDK
- `FirebaseTokenFilter`: validates Bearer token; extracts `uid` into request context
- Unprotected: `GET /health`

**Done when:** Sign-in/out flow works; unauthenticated API requests return 401.

---

### Slice 3 — List & Add Applications

First real data.

**Reference:** `docs/hunt-dashboard-mock.html` — application list section

**DB:** `V1__create_network.sql`, `V2__create_applications.sql`

**Web service**
- `Application` JPA entity + `ApplicationRepository`
- `POST /applications` — create, 409 on duplicate URL per user
- `GET /applications` — list for authenticated user

**Frontend**
- Route `/dashboard` → `DashboardPage` (protected)
- Page header: "The Hunt Dashboard" + "New Application" CTA
- Application cards: company logo placeholder, role (bold), company name, days since applied, gray stage dot placeholder, "Rejected" outlined + "Passed Round" primary buttons, add-task icon button
- `AddApplicationDialog`: company (required), role (required), job URL, salary fields
- TanStack `useQuery` for list + `useMutation` for create; invalidate on add
- Empty state when no applications

**Done when:** User can add an application and see it listed.

---

### Slice 4 — Application Stages

Lifecycle tracking per application.

**Reference:** `docs/hunt-dashboard-mock.html` — stage indicators on cards

**DB:** `V3__create_application_stage.sql`

**Web service**
- `ApplicationStage` JPA entity + repository
- `GET /applications/{id}`, `POST/GET/PATCH/DELETE` for stages (user-scoped)

**Frontend**
- Route `/applications/:id` → `ApplicationDetailPage`
- Link from dashboard card → detail page
- Application metadata display
- Stages timeline: chronological with date + result badge; inline add/edit/delete
- Stage badge on dashboard card (live): Applied=indigo, Technical=primary-blue, Offer=green, Rejected=red
- Dashboard "Passed Round" → add-stage dialog; "Rejected" → adds rejected stage immediately

**Done when:** Stages tracked per application; dashboard cards show live latest stage.

---

### Slice 5 — Hunt Dashboard (Sankey + Latest Stage)

**Reference:** `docs/hunt-dashboard-mock.html` — "Conversion Flow" Sankey card

**Web service**
- `GET /applications/dashboard` — latest stage per application (window function or subquery)
- Route must be declared before `GET /applications/{id}` to avoid Spring path conflict

**Frontend**
- Switch dashboard to use `/applications/dashboard`
- Bento grid: Sankey hero (8-col) + todo placeholder sidebar (4-col)
- MUI X `SankeyChart`:
  - Active path: Applied → Screening → Interview → Offer (indigo / green nodes)
  - Rejected dropoff in red (`#BA1A1A`)
  - Edge weights from real stage transition counts

**Done when:** Sankey renders live data; latest stage correct on all cards.

---

### Slice 6 — Action Items (Todos)

**Reference:** `docs/hunt-dashboard-mock.html` — to-do sidebar card

**DB:** `V4__create_action_items.sql`

**Web service**
- Full CRUD for `/action-items` with `app_id`, `referrer_id`, `status` filters

**Frontend**
- Todo sidebar on dashboard: open items with due dates; "+ Add Task" button; check-to-complete
- Action items section on `ApplicationDetailPage` filtered to that app
- Route `/action-items` → standalone filterable list

**Done when:** Create/complete/delete tasks from dashboard sidebar and detail page.

---

### Slice 7 — Network / Contacts

**Web service**
- Full CRUD for `/network` (V1 table already created)
- `DELETE /network/{id}` → 409 if referenced by application or action item

**Frontend**
- Route `/network` → contact list table (name, type, linked app count)
- Add/edit/delete via dialog
- "Referred by" dropdown on application add/edit form

**Done when:** Contacts manageable; linkable to applications.

---

### Slice 8 — Edit & Delete Applications

**Web service**
- `PATCH /applications/{id}` — user-scoped field update
- `DELETE /applications/{id}` — 409 if action items reference app (stages cascade-delete)

**Frontend**
- Edit button on detail page → edit dialog
- Delete with confirmation; optimistic removal from dashboard list

**Done when:** Full CRUD on applications complete.
