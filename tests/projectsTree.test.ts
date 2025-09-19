import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('projects/ directory health', () => {
  it('ensures every project folder contains metadata.json and brief.md', async () => {
    const projectsRoot = path.resolve('projects');
    const entries = await fs.readdir(projectsRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }

      const metadataPath = path.join(projectsRoot, entry.name, 'metadata.json');
      const briefPath = path.join(projectsRoot, entry.name, 'brief.md');

      try {
        await fs.access(metadataPath);
      } catch {
        assert.fail(`Missing metadata.json in projects/${entry.name}`);
      }

      try {
        await fs.access(briefPath);
      } catch {
        assert.fail(`Missing brief.md in projects/${entry.name}`);
      }
    }
  });
});
