#!/usr/bin/env python3
"""Scaffold a new project from templates."""
import argparse
import datetime as dt
from pathlib import Path
import re
import shutil
import json

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / 'templates'

SUBDIRS = [
    '01_brief',
    '02_research',
    '03_design/print',
    '03_design/social',
    '03_design/large_format',
    '03_design/vehicle_wrap',
    '03_design/motion',
    '03_design/ivr',
    '03_design/web',
    '03_design/app',
    '04_assets/raw_photo',
    '04_assets/raw_video',
    '04_assets/audio',
    '04_assets/gfx',
    '04_assets/fonts',
    '05_edit/video_projects',
    '05_edit/motion_projects',
    '06_exports/print_ready',
    '06_exports/social_ready',
    '06_exports/video_masters',
    '06_exports/thumbnails',
    '06_exports/deliverables',
    '07_docs/approvals',
    '07_docs/rights',
    '08_archive',
]


def slugify(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def render_template(src: Path, dst: Path, context: dict) -> None:
    text = src.read_text()
    for key, val in context.items():
        text = text.replace(f'{{{{{key}}}}}', val)
    dst.write_text(text)


def main():
    p = argparse.ArgumentParser(description='Scaffold a new project directory')
    p.add_argument('--client', required=True)
    p.add_argument('--title', required=True)
    p.add_argument('--type', required=True, help='e.g., social, print, motion')
    p.add_argument('--due', required=True, help='YYYY-MM-DD')
    p.add_argument('--owner', required=True)
    args = p.parse_args()

    today = dt.date.today()
    year = str(today.year)
    date_str = today.strftime('%Y-%m-%d')
    client_slug = slugify(args.client)
    title_slug = slugify(args.title)

    project_dir = ROOT / 'projects' / year / f'{date_str}_{client_slug}_{title_slug}'
    for sub in SUBDIRS:
        (project_dir / sub).mkdir(parents=True, exist_ok=True)

    # fonts folder reminder
    (project_dir / '04_assets/fonts/README.md').write_text(
        'Do not commit licensed font files. Reference licenses externally.')

    ctx = {
        'title': args.title,
        'client': args.client,
        'owner': args.owner,
        'type': args.type,
        'due_date': args.due,
    }

    render_template(TEMPLATES / 'README.Project.md', project_dir / 'README.md', ctx)
    render_template(TEMPLATES / 'Brief.Project.md', project_dir / '01_brief/Brief.md', ctx)
    render_template(TEMPLATES / 'Checklist.Release.md', project_dir / '07_docs/Checklist.Release.md', ctx)
    render_template(TEMPLATES / 'QA.Checks.md', project_dir / '07_docs/QA.Checks.md', ctx)
    shutil.copy(TEMPLATES / 'Credits.Rights.md', project_dir / '07_docs/rights/Credits.Rights.md')
    (project_dir / '07_docs/changelog.md').write_text('# Changelog\n')

    if args.type in ('social', 'motion'):
        shutil.copy(TEMPLATES / 'SocialPlan.csv', project_dir / '03_design/social/SocialPlan.csv')

    meta = {
        'title': args.title,
        'client': args.client,
        'owner': args.owner,
        'type': args.type,
        'due_date': args.due,
        'status': 'planning',
        'channels': [],
        'rights': [],
        'approvals': [],
        'deliverables': [],
        'tags': [],
        'repo_links': [],
    }
    with open(project_dir / 'Meta.Project.yaml', 'w') as f:
        json.dump(meta, f, indent=2)

    print(f'Created project at {project_dir}')
    print('Next steps: fill in README.md and Brief.md, then update Meta.Project.yaml as the project evolves.')


if __name__ == '__main__':
    main()
