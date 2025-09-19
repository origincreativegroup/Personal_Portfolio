# Startup Guide

This guide walks you through launching the full portfolio workspace with a single
command. The `scripts/startup.sh` helper script installs dependencies, brings up
the backing services, and runs both the Express API and Vite front-end so you
can get to work immediately.

## Prerequisites

Before running the script ensure the following tools are available locally:

- **Node.js 20+** and **npm** for building and serving the apps.
- **Docker** with the **docker compose** plugin if you want the script to start
  Postgres and Redis automatically. (Optional when working front-end only.)
- **Python 3** if you plan to use the optional project scaffolding tools in
  `scripts/`, though it is not required for the startup script itself.

> **Tip:** If Docker is unavailable the script will continue without starting
> containers and you can connect to your own Postgres/Redis instances instead.

## Quick start

From the repository root run:

```bash
./scripts/startup.sh
```

The script performs the following steps:

1. Installs npm dependencies for both the Vite front-end and Express backend.
2. Starts the Postgres, Redis, and backend containers defined in
   `docker-compose.yml` (unless you opt out).
3. Optionally runs `npx prisma migrate deploy` to apply database migrations.
4. Launches the backend via `npm run dev` (which bootstraps the filesystem sync service) and the front-end via `npm run dev -- --host`.

When the script completes you will have two services running locally:

- **Front-end:** <http://localhost:5173>
- **Backend API:** <http://localhost:3001>

Stop everything with `Ctrl+C`. Docker services continue running in the
background so you can restart quickly. Run `docker compose down` when you want
those containers to stop as well.

## Environment variables

The script exports a default `VITE_API_BASE_URL=http://localhost:3001` so the
front-end talks to the locally running backend. Override it before launching if
you need to target a different API endpoint:

```bash
VITE_API_BASE_URL=https://staging.example.com ./scripts/startup.sh --no-docker
```

For backend-only configuration (OpenAI keys, database URLs, etc.) create or
update `server/.env` as described in the main `README.md`. The script does not
modify your environment files.

## Useful flags

Pass any of the following options to customise the startup process:

| Flag | Purpose |
| ---- | ------- |
| `--frontend-only` | Skip Docker, Prisma, and the backend server—only the Vite dev server runs. |
| `--skip-install` | Skip dependency installation (useful on repeat launches once `node_modules/` is ready). |
| `--no-docker` | Prevent the script from running `docker compose up -d`. Use this when infrastructure is managed elsewhere. |
| `--prisma-deploy` | Run `npx prisma migrate deploy` inside `server/` before launching the backend. |

See `./scripts/startup.sh --help` for the latest usage text.

## Manual control

Prefer to manage services yourself? The script is optional. You can still
follow the manual steps documented in `README.md` to bring up each component.
After the backend is running you can use the new filesystem bridge CLI:

```bash
cd server
# scan all projects immediately
npm run sync

# rescan a specific folder after uploading assets
npm run sync -- --project 2025_Acme_Redesign
```

The dashboard's "Sync filesystem" button and the `/api/projects` endpoints call the same service, so you can trigger updates from scripts, CI, or scheduled jobs.
