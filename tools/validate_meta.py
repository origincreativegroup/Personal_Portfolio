#!/usr/bin/env python3
"""Validate Meta.Project.yaml files against a simple schema."""
import argparse
from pathlib import Path
import sys
import json

SCHEMA = {
    'title': str,
    'client': str,
    'owner': str,
    'type': str,
    'channels': list,
    'status': str,
    'due_date': str,
    'rights': list,
    'approvals': list,
    'deliverables': list,
    'tags': list,
    'repo_links': list,
}


def main():
    p = argparse.ArgumentParser(description='Validate project metadata YAML')
    p.add_argument('file', type=Path)
    args = p.parse_args()

    data = json.loads(args.file.read_text())
    errors = []
    for key, typ in SCHEMA.items():
        if key not in data:
            errors.append(f'missing key: {key}')
        elif not isinstance(data[key], typ):
            errors.append(f'key {key} should be {typ.__name__}')

    if errors:
        print('Metadata validation failed:')
        for err in errors:
            print(f' - {err}')
        sys.exit(1)
    print('Metadata OK')


if __name__ == '__main__':
    main()
