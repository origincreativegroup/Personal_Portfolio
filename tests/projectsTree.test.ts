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

      const metadataCandidates = ['02_Metadata.json', 'metadata.json'];
      const briefCandidates = ['01_Narrative.md', 'brief.md'];

      const hasMetadata = await Promise.all(
        metadataCandidates.map(async file => {
          try {
            await fs.access(path.join(projectsRoot, entry.name, file));
            return true;
          } catch {
            return false;
          }
        }),
      ).then(results => results.some(Boolean));

      const hasNarrative = await Promise.all(
        briefCandidates.map(async file => {
          try {
            await fs.access(path.join(projectsRoot, entry.name, file));
            return true;
          } catch {
            return false;
          }
        }),
      ).then(results => results.some(Boolean));

      if (!hasMetadata) {
        assert.fail(`Missing metadata file (metadata.json or 02_Metadata.json) in projects/${entry.name}`);
      }

      if (!hasNarrative) {
        assert.fail(`Missing narrative file (brief.md or 01_Narrative.md) in projects/${entry.name}`);
      }
    }
  });
});
