# Creative Projects Repository

This repository organizes multidisciplinary creative work—design, video, web, audio, and more—into a consistent, version-controlled structure. It includes templates, documentation, and automation scripts to standardize how projects are started and delivered.

## Quick Start (10 min)
1. Install [Git LFS](https://git-lfs.com/) and run `git lfs install` once.
2. Clone the repo and pull LFS objects:
   ```bash
   git clone <repo-url>
   git lfs pull
   ```
3. Ensure Python 3 is available for helper scripts.
4. Scaffold a project:
   ```bash
   python tools/new_project.py --client "Acme" --title "Spring Launch" --type social --due 2024-05-01 --owner "You"
   ```
5. Commit new work following the provided templates and checklists.

## Repository Layout
Key directories:
- `docs/` – operations guides and playbooks.
- `templates/` – starting points for briefs, checklists, and metadata.
- `tools/` – automation scripts such as the project scaffold generator.
- `brand/` – reusable brand assets (no licensed source files).
- `shared_assets/` – music, SFX, stock references, and LUTs.
- `projects/` – all dated client projects generated via `new_project.py`.

For details on workflows, approvals, and naming conventions, see [`docs/GUIDE.CreativeOps.md`](docs/GUIDE.CreativeOps.md).

## LFS Setup
Binary design and media formats are tracked with Git LFS. Confirm it is installed before committing large assets. Patterns are defined in `.gitattributes`.

## Contributing
Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting changes. Use issue and PR templates for all work.

