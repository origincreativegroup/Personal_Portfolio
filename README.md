# Portfolio Intake & Analysis Toolkit

A monorepo that powers a modern portfolio workflow: a Vite/React intake app for capturing case studies, a structured project filesystem for long-term storage, and an Express/Prisma service that orchestrates AI-assisted analysis jobs.

## Features
- **Guided project intake.** Responsive React forms help capture problem, solution, impact, evidence, assets, and metadata, then route creators into a rich editor experience.
- **Hybrid browser storage.** Projects are persisted in localStorage with an automatic IndexedDB upgrade, including migration, quota tracking, and manual cleanup utilities.
- **AI analysis pipeline.** The Node/Express backend queues uploads for processing with OpenAI, Bull, Prisma, and PostgreSQL/Redis infrastructure, providing confidence metrics and structured insights.
- **Filesystem bridge.** A sync service keeps Prisma records aligned with the `projects/` directory, exposes APIs for pagination/search, and round-trips metadata or brief edits back to disk.
- **Repeatable content structure.** A `projects/` directory schema plus a Python scaffolding script keep briefs, metadata, and assets consistent across teammates and automation.

## Repository structure
```
.
├── src/                 # React intake, editor, and analysis UI
├── server/              # Express API, Bull queue workers, Prisma models
├── prisma/              # Database schema used by the backend service
├── projects/            # Source-of-truth project folders (briefs, assets, etc.)
├── scripts/             # Tooling such as the new_project generator
├── tests/               # Node test suites (storage manager, etc.)
├── docker-compose.yml   # Optional Postgres + Redis + API bundle
└── Dockerfile           # Backend runtime image used by docker-compose
```

## Quick start (front-end)
1. Install Node.js 20+ and npm (uses ESM modules and Vite).
2. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Visit <http://localhost:5173>. The intake app stores data locally, so no backend is required for basic project capture and editing.

## Running the full stack
The AI analysis views expect the backend, database, and Redis queue to be running.

### Manual setup
1. **Environment variables.** Create a `server/.env` file (or export variables in your shell):
   ```bash
   OPENAI_API_KEY=sk-...
   DATABASE_URL=postgresql://postgres:password@localhost:5432/portfolioforge
   REDIS_URL=redis://localhost:6379
   DEV_USER_ID=demo-user   # optional default user for local development
   PORT=3001               # optional override
   ```
2. **Install dependencies.**
   ```bash
   cd server
   npm install
   ```
3. **Prepare the database.** Ensure PostgreSQL is reachable via `DATABASE_URL`, then run:
   ```bash
   npx prisma migrate deploy
   ```
4. **Start services.** Launch the backend and queue processor:
   ```bash
   npm run dev            # express server with hot reload (ts-node)
   ```
   The API listens on `http://localhost:3001` by default. Configure the front-end with `VITE_API_BASE_URL` or rely on the localhost fallback.

### Docker Compose
To start Postgres, Redis, and the backend together, use:
```bash
docker compose up --build
```
This exposes the API on port 3001 and persists uploads to the `./uploads` directory.

## Managing portfolio content
Projects live in versioned folders under `projects/`:
```
projects/
  2025_Acme_Redesign/
    brief.md          # Narrative following Problem → Actions → Results
    metadata.json     # Machine-readable fields for generation pipelines
    cover.jpg         # Optional hero asset
    assets/           # Reference images, decks, research docs, etc.
    deliverables/     # Final exports shipped to the client/stakeholders
```

Use the helper script to bootstrap new entries:
```bash
python3 scripts/new_project.py \
  --title "Spring Launch" \
  --organization "Caribbean Pools & Spas" \
  --work-type "Employment" \
  --year 2025 \
  --role "Designer" \
  --seniority "Lead" \
  --categories "Branding,Social" \
  --skills "typography,layout" \
  --tools "Figma,Illustrator" \
  --tags "branding,video" \
  --highlights "Increased CTR 22%;Cut time-to-publish by 40%" \
  --link-live "https://example.com" \
  --link-repo "https://github.com/you/repo" \
  --link-video "https://youtu.be/xyz" \
  --nda 0
```
The script scaffolds folders, metadata, and starter briefs aligned with the UI fields and automation pipelines.

Immediately after creation the script runs `npm run sync -- --project <folder>` inside `server/` so the new project is registered with the database.

### Keeping Prisma in sync with `projects/`

The Node service performs a full filesystem scan on boot and then every five minutes (configurable). You can also trigger a manual sync from the command line or via the REST API:

```bash
# one-off CLI sync for all projects
cd server
npm run sync

# limit the sync to a specific folder created on disk
npm run sync -- --project 2025_Acme_Redesign

# REST endpoint for automation or dashboards
curl -X POST http://localhost:3001/api/projects/sync
```

The dashboard now reads directly from `/api/projects` and surfaces freshness indicators when the filesystem has diverged from the database. Editing metadata or the project brief rewrites `metadata.json` and `brief.md` on disk, updates Prisma, and recalculates checksums to guard against conflicts.

### Importing and exporting project bundles

- **Import:** Upload a zipped project (matching the `projects/` schema) from the dashboard or `POST /api/projects/import`. The archive is extracted into `projects/` with `unzip`/`rsync`, then synced to Prisma.
- **Export:** Use the dashboard "Export bundle" action or `GET /api/projects/:id/export` to produce a shareable zip assembled from the current filesystem state.
- **Assets/Deliverables:** The dashboard renders previews directly from the Prisma `project_assets` / `project_deliverables` tables so the UI mirrors the on-disk folder structure (`assets/` and `deliverables/`).

## Storage architecture
The `storageManager` service automatically promotes projects from `localStorage` to IndexedDB, handles migrations, and reports usage so authors can diagnose quota issues from the UI. Tests cover IndexedDB fallbacks, migrations, and quota reporting to ensure reliability across browsers.

## Testing
Run the Node test suites with:
```bash
npm run test
```
The suites cover the browser storage manager, filesystem metadata parsing, sync conflict detection, and React rendering of real project data. Tests run via Node's built-in runner with a custom TypeScript loader.

## Environment variables summary
| Key | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Authorises AI analysis requests via the OpenAI SDK. |
| `DATABASE_URL` | PostgreSQL connection string for Prisma models. |
| `REDIS_URL` | Redis endpoint for Bull background jobs. |
| `DEV_USER_ID` | Default user injected into requests during local development. |
| `PORT` | Express server port (defaults to `3001`). |
| `VITE_API_BASE_URL` | Optional front-end override for the API base URL. |
| `VITE_ANALYSIS_USER_ID` | Front-end default identifier associated with analysis requests. |
| `PROJECTS_ROOT` | Absolute path to the on-disk `projects/` directory scanned by the sync service. Defaults to `<repo>/projects`. |
| `PROJECT_SYNC_INTERVAL_MS` | Interval (in ms) between automated filesystem scans. Set to `0` to disable the scheduler. |

## Production deployment considerations

- **Shared storage:** Mount the canonical `projects/` directory into both the API and any worker containers (see `docker-compose.yml`). In production this is typically an NFS or SMB share so every replica sees the same filesystem state.
- **Backups:** Schedule backups of both the Postgres database and the `projects/` volume. A simple approach is nightly snapshots of the network share plus database dumps via `pg_dump`.
- **Conflict monitoring:** Monitor the `/api/projects` freshness indicators or the CLI sync output for `filesystem-updated`/`conflict` statuses. Unexpected conflicts usually signal an out-of-band edit on disk and should be resolved before continuing edits via the dashboard.
- **Batch imports/exports:** When automating imports use the REST endpoints so each bundle is synced immediately. The same applies to exports for downstream tooling—call `/api/projects/:id/export` instead of zipping folders manually to ensure you get the canonical structure.

With these values configured, the UI, queue workers, and AI analysis endpoints run cohesively for both solo creators and team deployments.
