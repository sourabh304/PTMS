# SegueIT Project Tracker

Work-management platform by SegueIT — plan, track and deliver projects from a colorful,
inline-editable main table, with Kanban boards, Gantt charts, milestones, issue tracking,
timesheets with approvals, dashboards and portfolio reporting.

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

The seed creates the **SegueIT workspace** and its first **Project Manager** (`WORKSPACE` in
`apps/api/prisma/seed-data.ts`). With `SEED_DEMO_DATA=true` it also adds demo users and projects; they share
`DEMO_USER_PASSWORD` (e.g. `priya.sharma@segueit.com`). Change these first-run passwords after signing in.

**Change these values before any real deployment.**

## Accounts and roles

There are exactly two roles:

| Role | Can do |
| ---- | ------ |
| **Project Manager** | Everything: people and roles, workspace settings and workflows, create and manage every project, approve timesheets, reports. The workspace always keeps at least one active Project Manager. |
| **Employee** | Works on the projects they are a member of: create and update tasks, issues, comments and their own time. Manages a project only if they own it. |

Projects simply have members; there are no per-project roles.

API documentation (Swagger) is served at `http://localhost:4000/api/docs` when `SWAGGER_ENABLED=true`.

### Run with Docker

Requirements: **Docker** with Docker Compose. No Node.js needed.

```bash
docker compose up --build
```

Open http://localhost:3000 and sign in with the project manager from `apps/api/prisma/seed-data.ts`
(`WORKSPACE`). Change its password after signing in.
Data is kept in the `api-data` volume; JWT secrets are generated on first start and stored there too.

Change settings with environment variables or a `.env` file next to `docker-compose.yml`:

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `SEED_DEMO_DATA` | `false` | `true` adds demo users and projects on the first start |
| `WEB_PORT` | `3000` | Port on your machine |
| `COOKIE_SECURE` | `false` | Set `true` when served over HTTPS |
| `APP_NAME`, `BRAND_COLOR` | SegueIT Projects, `#0b5cad` | Branding (rebuild after changing) |
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

- **Home** – personal greeting, quick stats, recent projects, your upcoming work, latest updates and milestones.
- **Main table** – each project opens on a table of colored, collapsible **groups**: inline-edit the task name, owners, status and priority (full-color labels), timeline and estimate; quick-add tasks per group; per-group summaries (status/priority distribution, date range, total estimate, average progress); rename, recolor and delete groups.
- **Sidebar** – your projects and **Favorites** (star any project), with a filter for long lists.
- **My work** – everything assigned to you, grouped into Past dates, Today, This week, Next week, Later and Without a date, with inline status changes.
- **Projects** – portfolio grid/table, status, owner, budget, timeline, color, archive/restore, members with project roles (Manager / Member / Viewer).
- **Tasks** – groups, subtasks, assignees, priorities, estimates, progress, start/due dates, dependencies (with cycle detection), updates (comments), time logged.
- **Kanban** – drag & drop across configurable statuses with persistent ordering.
- **Gantt** – day/week/month zoom, dependency arrows, milestones, today marker, drag to reschedule and resize.
- **Milestones** – timeline view with completion tracking and task-based progress.
- **Issues** – bug tracker with configurable statuses, severities, priorities, assignee and due dates.
- **Timesheets** – log time against projects/tasks, billable flag, approval workflow, daily charts.
- **Dashboards** – organization dashboard and per-project overview (status mix, priorities, workload, budget burn).
- **Reports** – portfolio health (on track / at risk / off track) with CSV export, resource utilization vs capacity, time analysis, issue trends.
- **Activity & notifications** – audit trail per project and in-app notifications: task/issue assignment, task and issue status changes, due date changes, new comments (creator, assignees and everyone in the thread), added to / removed from a project, time submitted for approval and reviewed, due today/tomorrow and overdue reminders (hourly, in the organization's timezone), and plan changes for organization admins.
- **Administration** – users and roles (Project Manager, Employee), workspace name and default brand color, timezone, working hours and fully configurable workflows.
- **Appearance** – per-user light/dark/system theme, accent color, font (Figtree, Inter, Geist, IBM Plex Sans, Manrope), density, corner radius, light/dark sidebar, and a collapsible sidebar (Ctrl/⌘+B).
- **Security** – httpOnly cookie auth, short-lived access tokens, rotating refresh tokens with reuse detection, bcrypt, Helmet, rate limiting, strict DTO validation, role-based permissions + project-level authorization.

---

## Configuration — nothing is hard-coded

| Concern | Where it lives |
| ------- | -------------- |
| Branding (product name, logo files, brand color), API path, UI defaults, date formats | `apps/web/.env.local` (see `.env.example`); logo files in `apps/web/public/brand/` |
| Main table columns | `apps/web/src/features/tasks/components/table/table-columns.ts` |
| Group color palette | `apps/web/src/features/task-lists/group-colors.ts` (UI) and `apps/api/src/features/task-lists/task-list.colors.ts` (defaults for new groups) |
| Ports, CORS, secrets, cookies, rate limits, pagination | `apps/api/.env` (validated with Zod at boot) |
| Workspace, first project manager, demo data | `apps/api/prisma/seed-data.ts`; `SEED_DEMO_DATA` in `apps/api/.env` |
| Statuses, priorities, severities | Database, per organization — **Settings → Workflow** |
| Org name, default brand color, timezone, week start, working hours | Database — **Settings → Organization** |
| Personal theme, accent, font, density, radius, sidebar | Browser storage — **Settings → Appearance** (options in `apps/web/src/shared/theme/theme.config.ts`) |
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
      │  ├─ (auth)/login
      │  └─ (app)/home, my-work, projects/[projectId]/{(main table),board,gantt,overview,…}, timesheets, reports, settings, profile
      ├─ features/              auth, home, projects, tasks (incl. tasks/components/table), gantt,
      │                         milestones, issues, comments, timesheets, dashboard, reports,
      │                         activity, notifications, lookups, users, organization, task-lists, my-work
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
