# PortfolioForge

Portfolio creation platform with AI-powered content generation and visual editing.

## Architecture

This project uses npm workspaces to manage multiple packages:

```
/frontend/          # React frontend (Vite + TypeScript)
/backend/           # Fastify API server (TypeScript + Prisma)
/shared/            # Shared utilities and types
/src/               # UI component library (@portfolioforge/ui)
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development servers:**
   ```bash
   ./start-simplified-macos.sh
   ```
   Or manually:
   ```bash
   npm run dev:backend    # API server on :3000
   npm run dev:frontend   # React app on :5173
   ```

## Workspace Commands

- `npm run typecheck` - TypeScript validation across all workspaces
- `npm run lint` - Code linting (TypeScript checking)
- `npm run build` - Build all packages
- `npm run test` - Run tests across workspaces

## Project Structure

### Frontend (`/frontend/`)
- React application with Vite
- TanStack Router for routing
- TailwindCSS for styling
- GrapesJS for visual editing

### Backend (`/backend/`)
- Fastify server with TypeScript
- Prisma ORM with SQLite
- OpenAI integration for AI analysis
- File upload and processing

### Shared (`/shared/`)
- Common types and utilities
- Design tokens and theme
- Shared configuration

### UI Library (`/src/`)
- Reusable React components
- Design system with theme tokens
- Visual editors and blocks

## AI Agent Toolkit

This project includes an AI Agent Toolkit for collaborative development. See:
- `/docs/agent_toolkit.md` - Development rules and contracts
- `/docs/system.md` - System architecture
- `/docs/product_spec.md` - Product specifications
- `/docs/architecture.md` - Technical decisions

## Development

The project follows design token standards:
- **Primary:** `#5a3cf4` (royal purple)
- **Highlight:** `#cbc0ff` (lavender)
- **Typography:** Poppins font family
- **Style:** Flat design, no gradients or shadows

All changes must maintain design token compliance and pass TypeScript validation.