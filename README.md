# Personal Portfolio Repo

Deployment-ready scaffold generated on 2025-09-18 14:10.

## Quick Start

```bash
# 1) Create a new repo locally
git init
git lfs install

# 2) Ensure LFS tracks common binaries (already configured)
git add .gitattributes

# 3) Create your first project
python scripts/new_project.py \
  --title "Spring Launch" \
  --client "Acme" \
  --type "Social" \
  --year 2025 \
  --tags "branding,video" \
  --status "in-progress"

# 4) Commit and publish
git add .
git commit -m "Initial commit: scaffold + first project"
# Create a repo on GitHub/GitLab, then:
git remote add origin <YOUR-REMOTE-URL>
git push -u origin main
```

## Structure

- `brand/` — global branding assets (logos, palettes, guidelines)
- `docs/` — SOPs, workflows, style guides
- `shared_assets/` — reusable media (fonts, logos, LUTs, music, SFX)
- `templates/` — `brief.md`, `checklist.md`, `metadata.json`
- `projects/` — one folder per project created by `new_project.py`
- `scripts/` — automation utilities

## new_project.py

Creates a standardized folder structure and seeds brief + metadata for each new project.

**Usage:**

```bash
python scripts/new_project.py --title "Project X" --client "Client" --type "Branding" --year 2025 --tags "nyx,merch"
```

Run `python scripts/new_project.py -h` for full options.
