# SegueIT Projects

Enterprise project tracking platform — plan, track and deliver projects with task lists,
Kanban boards, Gantt charts, milestones, issue tracking, timesheets with approvals,
dashboards and portfolio reporting.

| Layer    | Stack                                                                 |
| -------- | --------------------------------------------------------------------- |
| Web      | Next.js 15 (App Router), React 19, TanStack Query, Tailwind CSS 4, Recharts, dnd-kit |
| API      | NestJS 11, Prisma 6, Passport JWT, class-validator, Swagger, Throttler, Event Emitter |
| Database | SQLite out of the box, PostgreSQL ready                               |

---

## Quick start

Requirements: **Node.js ≥ 20.11** and npm.

```bash
npm run setup   # creates env files with random secrets, installs, creates & seeds the DB
npm run dev     # API on http://localhost:4000, web on http://localhost:3000
```

Sign in with the administrator defined by `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
in `apps/api/.env`. When `SEED_DEMO_DATA=true`, demo users share `SEED_DEMO_USER_PASSWORD`
(e.g. `priya.sharma@<admin email domain>`). **Change these values before any real deployment.**

API documentation (Swagger) is served at `http://localhost:4000/api/docs` when `SWAGGER_ENABLED=true`.

### Production

```bash
npm run build
npm start
```

Set `NODE_ENV=production`, `COOKIE_SECURE=true` (HTTPS), real `CORS_ORIGINS`, and strong JWT secrets.

---

## Features

- **Projects** – portfolio grid/table, status, owner, budget, timeline, color, archive/restore, members with project roles (Manager / Member / Viewer).
- **Tasks** – task lists, subtasks, assignees, priorities, estimates, progress, start/due dates, dependencies (with cycle detection), comments, time logged.
- **Board** – drag & drop Kanban across configurable statuses with persistent ordering.
- **Gantt** – day/week/month zoom, dependency arrows, milestones, today marker, drag to reschedule and resize.
- **Milestones** – timeline view with completion tracking and task-based progress.
- **Issues** – bug tracker with configurable statuses, severities, priorities, assignee and due dates.
- **Timesheets** – log time against projects/tasks, billable flag, approval workflow, daily charts.
- **Dashboards** – organization dashboard and per-project overview (status mix, priorities, workload, budget burn).
- **Reports** – portfolio health (on track / at risk / off track) with CSV export, resource utilization vs capacity, time analysis, issue trends.
- **Activity & notifications** – audit trail per project and in-app notifications for assignments, comments, reviews.
- **Administration** – users & roles, organization branding (name, logo, brand color), timezone, working hours, and fully configurable workflows.
- **Security** – httpOnly cookie auth, short-lived access tokens, rotating refresh tokens with reuse detection, bcrypt, Helmet, rate limiting, strict DTO validation, RBAC + project-level authorization.

---

## Configuration — nothing is hard-coded

| Concern | Where it lives |
| ------- | -------------- |
| Branding, API path, UI defaults | `apps/web/.env.local` (see `.env.example`) |
| Ports, CORS, secrets, cookies, rate limits, pagination | `apps/api/.env` (validated with Zod at boot) |
| Seed admin, demo data | `SEED_*` variables in `apps/api/.env` |
| Statuses, priorities, severities | Database, per organization — **Settings → Workflow** |
| Org name, logo, brand color, timezone, week start, working hours | Database — **Settings → Organization** |
| Role → permission matrix | `apps/api/src/common/constants/permissions.constants.ts` (served to the UI via `/auth/me`) |
| Defaults for new organizations | `apps/api/src/features/lookups/lookup.defaults.ts`, `features/organizations/organization.defaults.ts` |

### Using PostgreSQL

1. In `apps/api/prisma/schema.prisma` set `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://user:pass@host:5432/segueit"` in `apps/api/.env`.
3. Run `npm run db:setup`.

---

## Project structure

Both apps are organized **by feature**; each feature owns its API calls, types and components.

```
apps/
├─ api/                         NestJS REST API
│  ├─ prisma/                   schema.prisma, seed.ts, seed-data.ts
│  └─ src/
│     ├─ config/                typed configuration + env validation
│     ├─ common/                guards, decorators, filters, events, pagination, validation
│     ├─ prisma/                PrismaService
│     └─ features/
│        ├─ auth/  users/  organizations/  lookups/
│        ├─ projects/  task-lists/  tasks/  milestones/  issues/  comments/
│        ├─ timesheets/  activity/  notifications/
│        └─ dashboard/  reports/  health/
└─ web/                         Next.js App Router client
   └─ src/
      ├─ app/                   routes only (thin pages composing feature components)
      │  ├─ (auth)/login, register
      │  └─ (app)/dashboard, my-work, projects/[projectId]/{tasks,board,gantt,…}, timesheets, reports, settings, profile
      ├─ features/              auth, projects, tasks, gantt, milestones, issues, comments,
      │                         timesheets, dashboard, reports, activity, notifications,
      │                         lookups, users, organization, task-lists, my-work
      └─ shared/                config, api client, UI kit, hooks, utils
```

The browser talks to the API through a same-origin Next.js rewrite (`/api/*`), so auth
cookies remain first-party and no API URL is exposed to client code.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run setup` | Env files + install + database schema + seed |
| `npm run dev` | Run API and web in watch mode |
| `npm run build` / `npm start` | Production build / start |
| `npm run typecheck` | Type-check both apps |
| `npm test` | API unit tests |
| `npm run db:seed` | Seed (idempotent) |
| `npm run db:reset` | Drop, recreate and seed the database |
