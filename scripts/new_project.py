#!/usr/bin/env python3

import argparse, json, os, re, sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SUBFOLDERS = [
    "01_Brief",
    "02_Research",
    "03_Design",
    "04_Source",
    "05_Media/Photos",
    "05_Media/Video",
    "05_Media/Audio",
    "06_Exports",
    "07_Deliverables",
    "99_Archive",
]

def slugify(s: str, max_len: int = 64):
    s = (s or "").strip().lower()
    s = re.sub(r"[^\w\s\-]+", "", s)
    s = re.sub(r"\s+", "-", s)
    return s[:max_len].strip("-_") or "untitled"

def build_folder_name(title: str, client: str = "", year: str = "") -> str:
    parts = []
    if year:
        parts.append(str(year))
    if client:
        parts.append(slugify(client, 24))
    parts.append(slugify(title, 36))
    return "_".join([p for p in parts if p])

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def write_file(p: Path, content: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)

def load_template(name: str) -> str:
    tpath = ROOT / "templates" / name
    if tpath.exists():
        return tpath.read_text(encoding="utf-8")
    return ""

def main():
    parser = argparse.ArgumentParser(description="Create a new project scaffold.")
    parser.add_argument("--title", required=True, help="Project title")
    parser.add_argument("--client", default="", help="Client/Brand")
    parser.add_argument("--type", default="", help="Type/Category, e.g., Branding, Social, Video")
    parser.add_argument("--year", default="", help="Year (YYYY)")
    parser.add_argument("--owner", default="", help="Primary owner")
    parser.add_argument("--tags", default="", help="Comma-separated tags")
    parser.add_argument("--status", default="planning", help="Project status (planning, in-progress, complete)")
    parser.add_argument("--notes", default="", help="Optional notes")

    args = parser.parse_args()

    # Resolve tags list
    tags = [t.strip() for t in args.tags.split(",") if t.strip()]

    folder = build_folder_name(args.title, args.client, args.year)
    proj_root = ROOT / "projects" / folder
    if proj_root.exists():
        print(f"Error: Project folder already exists: {proj_root}", file=sys.stderr)
        sys.exit(1)

    # Create subfolders
    for sub in SUBFOLDERS:
        ensure_dir(proj_root / sub)

    # Metadata
    metadata = {
        "title": args.title,
        "client": args.client,
        "type": args.type,
        "year": args.year,
        "owner": args.owner,
        "tags": tags,
        "status": args.status,
        "notes": args.notes,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "schema_version": "1.0.0"
    }
    write_file(proj_root / "metadata.json", json.dumps(metadata, indent=2))

    # Brief
    brief_template = load_template("brief.md")
    if not brief_template:
        brief_template = "# Creative Brief\n\n## Project Title\n{title}\n\n## Client / Brand\n{client}\n"
    brief_filled = brief_template.format(title=args.title, client=args.client)
    write_file(proj_root / "01_Brief" / "brief.md", brief_filled)

    # Checklist
    checklist = load_template("checklist.md") or "# Production Checklist\n\n- [ ] Brief approved\n"
    write_file(proj_root / "01_Brief" / "checklist.md", checklist)

    # Keep files so empty dirs are committed if desired
    for sub in SUBFOLDERS:
        keep = proj_root / sub / ".keep"
        write_file(keep, "")

    print(f"✅ Created project at: {proj_root}")
    print("Subfolders:")
    for sub in SUBFOLDERS:
        print(f" - {sub}")

if __name__ == "__main__":
    main()
