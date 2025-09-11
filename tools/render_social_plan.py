#!/usr/bin/env python3
"""Convert SocialPlan.csv into a simple task list."""
import argparse
import csv
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description='Render a SocialPlan.csv into tasks')
    p.add_argument('file', type=Path)
    args = p.parse_args()

    with args.file.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            print(f"- [ ] {row['platform']} {row['asset']} ({row['ratio']}) on {row['date']}: {row['copy']}")


if __name__ == '__main__':
    main()
