# Deploying on Vercel

The app runs as **two Vercel projects from this one repository**:

| Project | Root Directory | What it is |
| ------- | -------------- | ---------- |
| `ptms-api` | `apps/api` | NestJS API as a serverless function, with a Neon Postgres database |
| `ptms-web` | `apps/web` | Next.js web app; forwards `/api/*` to the API, so sign-in cookies stay on one domain |

Local development keeps using SQLite (`npm run dev`); the Vercel build switches to Postgres automatically.

Allow about 15 minutes. You need a Vercel account linked to the GitHub repository.

## 1. Choose the branch

Vercel deploys the repository's **Production Branch** (normally `main`). Either merge this work into `main`,
or after creating each project set **Settings → Git → Production Branch** to the branch you want to deploy.

## 2. Create the API project

1. Vercel dashboard → **Add New… → Project** → import this repository.
2. **Project Name**: `ptms-api` (any name; it becomes `https://<name>.vercel.app`).
3. **Root Directory**: `apps/api`. **Framework Preset**: `Other`. Leave the build settings as they are
   (`apps/api/vercel.json` sets them).
4. **Environment Variables** (Production):

   | Name | Value |
   | ---- | ----- |
   | `JWT_ACCESS_SECRET` | a random string of at least 48 characters |
   | `JWT_REFRESH_SECRET` | a different random string of at least 48 characters |
   | `ROOT_EMAIL` | the email you will sign in with as root, e.g. `admin@yourcompany.com` |
   | `ROOT_PASSWORD` | the root password: at least 8 characters with upper-case, lower-case and a number |
   | `CRON_SECRET` | a random string of at least 16 characters (protects the daily reminder job) |
   | `MEETING_DIGEST_HOUR` | optional, default `8` |

   Generate random strings with `openssl rand -hex 48`, or your password manager's generator.
   Never commit these values.
5. Click **Deploy**. The first build fails because there is no database yet — that is expected.
6. Open the project → **Storage** → **Create Database** → **Neon** (Postgres) → accept the defaults →
   **Connect** it to the project for **Production** (Vercel adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`).
7. **Deployments** → the latest deployment → **⋯ → Redeploy**.
8. Check `https://<api-project>.vercel.app/api/health` shows `"status":"ok","database":"up"`.

Each deployment applies schema changes to the database (`prisma db push`, never destructive) and creates the
root account if it does not exist yet. Changing `ROOT_PASSWORD` later does not change an existing root
account — change the password from the app instead.

## 3. Create the web project

1. **Add New… → Project** → import the same repository again.
2. **Project Name**: `ptms-web`. **Root Directory**: `apps/web`. **Framework Preset**: `Next.js`.
3. **Environment Variables** (Production):

   | Name | Value |
   | ---- | ----- |
   | `API_PROXY_TARGET` | `https://<api-project>.vercel.app/api` (the URL from step 2, ending in `/api`) |
   | `NEXT_PUBLIC_APP_NAME` | optional, e.g. `SegueIT Projects` |
   | `NEXT_PUBLIC_LOGO_URL`, `NEXT_PUBLIC_LOGO_DARK_URL` | optional, e.g. `/brand/segueit-logo.png`, `/brand/segueit-logo-dark.png` |
   | `NEXT_PUBLIC_BRAND_COLOR` | optional, e.g. `#0b5cad` |

   `NEXT_PUBLIC_*` values are built into the app: redeploy after changing them.
4. Click **Deploy**, then open `https://<web-project>.vercel.app`.

## 4. First sign-in

1. Sign in with `ROOT_EMAIL` / `ROOT_PASSWORD`. You land on the Platform console.
2. **Organizations → New organization**: enter your company name and its first **project coordinator**.
3. The coordinator signs in, creates member accounts (**Settings → Users**), projects and meetings.
4. Ask everyone to change their initial password from **Profile**.

## Hobby plan notes

- **Reminders run once a day** (02:30 UTC, see `crons` in `apps/api/vercel.json`): due-date reminders and the
  notice for the day's meetings. Meetings scheduled later the same day are announced as soon as they are saved.
  On a Pro plan you can make the job run more often by changing its `schedule`.
- **Cold starts**: the first request after a quiet period takes 1–2 seconds while the API starts.
- **Preview deployments** use the same database unless you give them their own Neon branch, so deploy previews
  only if you know what you are doing — or turn them off under **Settings → Git**.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| API build fails: "Set the ROOT_PASSWORD environment variable" | Add `ROOT_PASSWORD` (Production) and redeploy |
| API build fails at `prisma db push` / health shows `database: down` | Connect the Neon database to the project (step 2.6) and redeploy |
| Web build fails: "API_PROXY_TARGET is not set" | Add `API_PROXY_TARGET` to the web project and redeploy |
| Sign-in succeeds but you are sent back to the login page | `API_PROXY_TARGET` must point at the API project URL ending in `/api`; open the site over `https://` |
| "Invalid environment configuration" in the API logs | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` missing or shorter than 32 characters |
