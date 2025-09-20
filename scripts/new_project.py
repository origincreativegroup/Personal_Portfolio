#!/usr/bin/env python3
import argparse, json, re, shutil, subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]

def slug(s, maxlen=None):
    s = (s or "").strip().lower()
    s = re.sub(r"[^\w\s\-]+", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"^[-_]+|[-_]+$", "", s)
    return s[:maxlen] if maxlen else s

def ensure(p: Path):
    p.mkdir(parents=True, exist_ok=True)
    return p

def write(p: Path, text: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")

def main():
    ap = argparse.ArgumentParser(description="Create a minimal portfolio project (v5).")
    ap.add_argument("--title", required=True)
    ap.add_argument("--organization", default="")
    ap.add_argument("--work-type", default="Employment")
    ap.add_argument("--year", default="")
    ap.add_argument("--role", default="")
    ap.add_argument("--seniority", default="Lead", choices=["Lead","Contributor"])
    ap.add_argument("--categories", default="")  # comma
    ap.add_argument("--skills", default="")      # comma
    ap.add_argument("--tools", default="")       # comma
    ap.add_argument("--tags", default="")        # comma
    ap.add_argument("--highlights", default="")  # comma
    ap.add_argument("--link-live", default="")
    ap.add_argument("--link-repo", default="")
    ap.add_argument("--link-video", default="")
    ap.add_argument("--nda", type=int, default=0)  # 1 or 0
    args = ap.parse_args()

    year = args.year.strip() or str(datetime.now().year)
    org = args.organization.strip() or "personal"
    folder = f"{year}_{slug(org,24)}_{slug(args.title,36) or 'untitled'}"
    proj = ROOT / "projects" / folder

    if proj.exists():
        raise SystemExit(f"Folder already exists: {proj}")

    # structure
    ensure(proj / "03_Assets")
    ensure(proj / "06_Exports")

    # metadata
    categories = [s.strip() for s in args.categories.split(",") if s.strip()]
    skills     = [s.strip() for s in args.skills.split(",") if s.strip()]
    tools      = [s.strip() for s in args.tools.split(",") if s.strip()]
    tags       = [s.strip() for s in args.tags.split(",") if s.strip()]
    highlights = [s.strip() for s in args.highlights.split(",") if s.strip()]

    metadata = {
        "schema_version": "3.0.0",
        "title": args.title,
        "organization": args.organization,
        "work_type": args.work_type,
        "year": year,
        "role": args.role,
        "seniority": args.seniority,
        "categories": categories,
        "skills": skills,
        "tools": tools,
        "tags": tags,
        "highlights": highlights,
        "links": {
            "live": args.link_live,
            "repo": args.link_repo,
            "video": args.link_video,
        },
        "privacy": { "nda": bool(args.nda) },
        "pcsi": { "problem": "", "challenge": "", "solution": "", "impact": "" },
        "case": { "problem": "", "challenge": "", "actions": "", "results": "" },
        "cover_image": "06_Exports/cover.jpg",
        "assets": [],
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }
    write(proj / "02_Metadata.json", json.dumps(metadata, indent=2) + "\n")
    write(proj / "metadata.json", json.dumps(metadata, indent=2) + "\n")

    # narrative
    snapshot = []
    if args.organization:
        snapshot.append(f"- **Organization:** {args.organization}")
    if args.role:
        snapshot.append(f"- **Role:** {args.role} ({args.seniority})")
    if categories:
        snapshot.append(f"- **Categories:** {', '.join(categories)}")
    if tools:
        snapshot.append(f"- **Tools:** {', '.join(tools)}")

    narrative = [
        f"# {args.title}",
        "",
        "## Problem",
        "<What was broken or missing?>",
        "",
        "## Challenge",
        "<Context or constraints you faced>",
        "",
        "## Solution",
        "<What did you build or change?>",
        "",
        "## Impact",
        "<How did things improve? Add data if possible.>",
    ]

    if snapshot:
        narrative.extend(["", "### Project Snapshot", *snapshot])

    if highlights:
        narrative.extend(["", "### Highlights", *[f"- {item}" for item in highlights]])

    write(proj / "01_Narrative.md", "\n".join(narrative) + "\n")
    write(proj / "brief.md", "\n".join(narrative) + "\n")

    print(f"✅ Created {proj}")

    try:
        subprocess.run(
            ["npm", "run", "sync", "--", "--project", folder],
            cwd=ROOT / "server",
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        print("🔄 Project registered with sync service.")
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        print("⚠️  Unable to register project with sync service:", exc)
        print("   Run `cd server && npm run sync -- --project", folder, "` manually once dependencies are installed.")

if __name__ == "__main__":
    main()
