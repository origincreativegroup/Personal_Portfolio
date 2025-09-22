# PortfolioForge · AI Agent Toolkit (One-Repo, No-Chaos)

This file is the **contract** for humans and AI agents working together. It lists tools, configs, and hard rules that keep changes consistent, reviewable, and reversible.

## 0) Non-negotiables (read me or revert)
- **One SSOT:** `/docs/system.md`, `/docs/product_spec.md`, `/docs/architecture.md`.  
  Any conflicting change must first update SSOT via PR, then implement.
- **No private forks of reality:** no alternate specs in random folders. Link to SSOT lines in your PR.
- **Small PRs, single purpose:** target <400 LOC when possible, 1 linked issue with explicit AC.
- **Design tokens only:** royal purple `#5a3cf4`, lavender `#cbc0ff`, neutral charcoal grays; Poppins; flat vector; no gradients/shadows.
- **Telemetry or it didn’t happen:** add/adjust events and document in `/docs/telemetry.md`.

## 1) Repo scaffolding & scripts
Add these commands to your root `package.json` (or merge them with your existing scripts):

```json
{
  "scripts": {
    "build": "turbo run build --filter=...[HEAD]",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint && prettier -c .",
    "format": "prettier -w .",
    "test": "turbo run test",
    "test:e2e": "playwright test",
    "openapi:check": "swagger-cli validate docs/openapi.yaml",
    "schema:check": "node tools/schema-check.mjs",
    "tokens:check": "node tools/tokens-check.mjs",
    "docs:check": "node tools/ssot-refs.mjs",
    "pr:bot": "tsx tools/pr-bot.ts",
    "agent:run": "tsx tools/orchestrator.ts",
    "agent:plan": "tsx tools/agent-plan.ts",
    "changeset": "changeset",
    "release": "changeset version && changeset publish"
  }
}
```

## 2) GitHub automation (don’t merge without it)
CI blocks merges on interface drift, rogue tokens, and missing SSOT refs.

## 3) Contract checks (agents can’t “invent” APIs or tokens)
- `/docs/openapi.yaml` is the only API contract.
- `/docs/schema/*.json` defines shared data objects.
- `/packages/ui/theme.ts` contains brand tokens; no ad‑hoc colors/shadows.

## 4) Multi-agent orchestration
Agents must follow **Plan → Diff → Apply**, cite SSOT line refs, and respect path-level permissions per role. See `tools/orchestrator.ts`.

## 5) Data & events (retention is a feature)
See `/docs/telemetry.md` in this bundle and update as features land.

## 6) Minimal app structure (shared mental model)
```
/apps
  /web        # Next.js: Dashboard, Projects (PCSI), Templates, Profile, Resume
  /api        # FastAPI/Fastify: auth, projects, media, narratives, publish, insights
/packages
  /ui         # tokens, primitives, templates, Storybook
  /lib        # generated API client, shared utils, types
/docs         # SSOT + schemas + openapi + ADRs + telemetry
/tools        # this toolkit scripts
/.github      # templates + workflows
```

## 7) Onboarding checklist
1. Turn on branch protection for `main` (require CI + codeowner reviews).
2. Add repo secrets for CI (never commit secrets).
3. Link this file from `README.md`.
4. Use the workflows, templates, and tools in this bundle.
5. First sprint: Auth → Projects CRUD → PCSI intake → Template #1 → Publish profile → Weekly email stub.

## 8) Success metrics
- Fewer broken merges; faster PR cycles; measurable usage via telemetry; week‑4 retention rising.

**TL;DR**: This turns a bunch of clever agents into one disciplined team. Propose ADRs for changes; link SSOT lines; evolve intentionally.
