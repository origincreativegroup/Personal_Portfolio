# Portfolio Intake & Analysis Toolkit

A monorepo that powers a modern portfolio workflow: a Vite/React intake app for capturing case studies, a structured project filesystem for long-term storage, and an Express/Prisma service that orchestrates AI-assisted analysis jobs.

## Features
- **Workspace-aware authentication.** Secure email/password auth issues short-lived access tokens and refresh cookies so multiple teammates can collaborate across shared workspaces.
- **Server-backed persistence.** Projects, files, revisions, and invites are stored in PostgreSQL via Prisma models with optimistic concurrency and activity streams delivered over Server-Sent Events.
- **AI analysis pipeline.** The Express backend coordinates Bull queues, Redis, and OpenAI to extract insights, track confidence, and allow one-click application of AI suggestions.
- **Legacy migration support.** Any projects captured in `localStorage`/IndexedDB are automatically imported into a user’s first workspace the moment they log in.

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
1. Install Node.js 20+ and npm (Vite + React Query require modern tooling).
2. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Visit <http://localhost:5173>. The UI now expects the authenticated API, so keep the backend (described below) running for project and analysis data.

## Running the full stack
The AI analysis views expect the backend, database, and Redis queue to be running.

### Manual setup
1. **Environment variables.** Copy `server/.env.sample` to `server/.env` and adjust secrets:
   ```bash
   cp server/.env.sample server/.env
   # then edit JWT secrets, database URL, OpenAI key, etc.
   ```
2. **Install dependencies.**
   ```bash
   cd server
   npm install
   ```
3. **Prepare the database.** Ensure PostgreSQL is reachable via `DATABASE_URL`, then run the Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. **Start services.** Launch the backend and queue processor:
   ```bash
   npm run dev            # express server with hot reload (ts-node)
   ```
   The API listens on `http://localhost:3001` by default. Configure the front-end with `VITE_API_BASE_URL` if you are not running locally.

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

## Storage & sync architecture
The client no longer persists projects in the browser. Instead, React Query orchestrates authenticated fetches to the Express API, performs optimistic updates, and receives live change notifications via Server-Sent Events. When an authenticated user logs in for the first time, any legacy `localStorage`/IndexedDB projects are exported to the active workspace and cleared locally, ensuring a seamless upgrade path.

## Testing
Front-end tests (React Query hooks, auth flows, legacy migration) use Vitest and Testing Library:
```bash
npm run test
```

Backend unit tests (token service, middleware, event bus) live in `server/test`:
```bash
cd server
npm run test
```

## Environment variables summary
| Key | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Authorises AI analysis requests via the OpenAI SDK. |
| `DATABASE_URL` | PostgreSQL connection string for Prisma models. |
| `REDIS_URL` | Redis endpoint for Bull background jobs. |
| `JWT_ACCESS_SECRET` | HMAC secret used to sign short-lived access tokens. |
| `JWT_ACCESS_TTL` | Access-token lifetime (defaults to 15 minutes). |
| `JWT_REFRESH_TTL_SECONDS` | Refresh-token lifetime in seconds (defaults to 14 days). |
| `CORS_ORIGIN` | Comma-separated list of origins allowed to call the API with credentials. |
| `PORT` | Express server port (defaults to `3001`). |
| `VITE_API_BASE_URL` | Optional front-end override for the API base URL. |

With these values configured, the UI, queue workers, and AI analysis endpoints run cohesively for both solo creators and team deployments.
