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

Sign in with the root administrator defined by `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
in `apps/api/.env`. When `SEED_DEMO_DATA=true`, demo users share `SEED_DEMO_USER_PASSWORD`
(e.g. `priya.sharma@<admin email domain>`). **Change these values before any real deployment.**

API documentation (Swagger) is served at `http://localhost:4000/api/docs` when `SWAGGER_ENABLED=true`.

### Run with Docker

Requirements: **Docker** with Docker Compose. No Node.js needed.

```bash
docker compose up --build
```

Open http://localhost:3000 and sign in as `admin@segueit.com` / `ChangeMe@123`.
Data is kept in the `api-data` volume; JWT secrets are generated on first start and stored there too.

Change settings with environment variables or a `.env` file next to `docker-compose.yml`:

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | `admin@segueit.com` / `ChangeMe@123` | Root administrator, the only one who can create workspaces (created on first start only) |
| `SEED_DEMO_DATA` | `false` | `true` adds sample users and projects on first start |
| `WEB_PORT` | `3000` | Port on your machine |
| `COOKIE_SECURE` | `false` | Set `true` when served over HTTPS |
| `APP_NAME`, `BRAND_COLOR` | SegueIT Projects, `#2563eb` | Branding (rebuild after changing) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | generated | Provide your own to manage secrets yourself |

The `Dockerfile` has two targets, `api` and `web`, if you want to build the images separately
(`docker build --target api .`). Web settings starting with `NEXT_PUBLIC_` and `API_PROXY_TARGET`
are fixed at build time, so pass them as `--build-arg`.

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
- **Timeline (Gantt)** – day/week/month zoom, dependency arrows, milestones, today marker, drag to reschedule and resize.
- **Milestones** – timeline view with completion tracking and task-based progress.
- **Issues** – bug tracker with configurable statuses, severities, priorities, assignee and due dates.
- **Timesheets** – log time against projects/tasks, billable flag, approval workflow, daily charts.
- **Dashboards** – organization dashboard and per-project overview (status mix, priorities, workload, budget burn).
- **Reports** – portfolio health (on track / at risk / off track) with CSV export, resource utilization vs capacity, time analysis, issue trends.
- **Activity & notifications** – audit trail per project and in-app notifications (the bell) for: task or issue assigned, new comments, added to a project, time waiting for approval (admins and project managers), time approved or rejected, and reminders when a task or issue is due today or tomorrow or becomes overdue (checked hourly, sent once per due date, in the workspace's timezone).
- **Workspaces & roles** – each company or team gets its own isolated workspace; there is no public sign-up.

  | Role | Can do |
  | ---- | ------ |
  | Root admin | The setup admin (`SEED_ADMIN_EMAIL`). Everything an Admin can, plus create workspaces with their first admin, see all workspaces, and soft delete / restore them (**Settings → Workspaces**). Other admins cannot demote, deactivate or reset the root admin's password. |
  | Admin | Add and manage users, create and manage every project, approve time, reports and settings for their workspace. |
  | Employee | See the projects they are added to, work on their tasks, issues and milestones, and log and edit their own time. |

  Inside a project people also have a project role: **Manager** (manages that project's members and approves its time), **Member** (works on it) or **Viewer** (read-only).
  A soft-deleted workspace keeps its data; its users are signed out and cannot sign in until the root admin restores it.
  Databases from earlier versions are converted on the next seed / container start: Owner, Admin and Manager become Admin; Member and Guest become Employee.
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
│        ├─ auth/  users/  organizations/  workspaces/  lookups/
│        ├─ projects/  task-lists/  tasks/  milestones/  issues/  comments/
│        ├─ timesheets/  activity/  notifications/
│        └─ dashboard/  reports/  health/
└─ web/                         Next.js App Router client
   └─ src/
      ├─ app/                   routes only (thin pages composing feature components)
      │  ├─ (auth)/login
      │  └─ (app)/dashboard, my-work, projects/[projectId]/{tasks,board,gantt,…}, timesheets, reports, settings, profile
      ├─ features/              auth, projects, tasks, gantt, milestones, issues, comments,
      │                         timesheets, dashboard, reports, activity, notifications,
      │                         lookups, users, organization, task-lists, my-work, workspaces
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
