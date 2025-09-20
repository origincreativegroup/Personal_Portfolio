import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  computeChecksum,
  parseMetadata,
  slugify,
} from '../server/src/services/projectSyncService.ts';
import ProjectSyncService from '../server/src/services/projectSyncService.ts';
import type { ParsedMetadata as MetadataResponse } from '../server/src/types/projectSync.ts';

type MutableProject = {
  id: string;
  folder: string;
  title: string;
  summary: string | null;
  description: string | null;
  organization: string | null;
  workType: string | null;
  year: number | null;
  role: string | null;
  seniority: string | null;
  categories: string[];
  skills: string[];
  tools: string[];
  tags: string[];
  highlights: string[];
  links: unknown;
  nda: boolean | null;
  coverImage: string | null;
  caseProblem: string | null;
  caseActions: string | null;
  caseResults: string | null;
  schemaVersion: string | null;
  metadataChecksum: string | null;
  briefChecksum: string | null;
  metadataUpdatedAt: Date | null;
  briefUpdatedAt: Date | null;
  fsLastModified: Date | null;
  lastSyncedAt: Date | null;
  syncStatus: string;
};

describe('projectSyncService helpers', () => {
  it('normalises metadata correctly', () => {
    const result = parseMetadata({
      title: '  Demo Project  ',
      year: '2024',
      categories: [' design ', '', 'ops'],
      skills: 'ignored',
      tags: ['UI', ''],
      privacy: { nda: 1 },
      case: { problem: ' Why? ', actions: 'How', results: '' },
    } as unknown as Record<string, unknown>);

    assert.strictEqual(result.title, 'Demo Project');
    assert.strictEqual(result.year, 2024);
    assert.deepEqual(result.categories, ['design', 'ops']);
    assert.deepEqual(result.tags, ['UI']);
    assert.strictEqual(result.nda, true);
    assert.strictEqual(result.case?.problem, 'Why?');
    assert.strictEqual(result.case?.results, undefined);
  });

  it('slugifies titles safely', () => {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
    assert.strictEqual(slugify('  🚀 Launch Plan!  '), 'launch-plan');
  });

  it('normalises legacy link structures to arrays', () => {
    const result = parseMetadata({
      title: 'Links project',
      links: {
        live: ' https://example.com ',
        repo: { url: 'https://github.com/example/repo', label: ' GitHub ' },
        video: { href: 'https://youtu.be/demo', name: 'Launch video' },
        empty: '',
      },
    } as unknown as Record<string, unknown>);

    assert.deepEqual(result.links, [
      { type: 'live', url: 'https://example.com' },
      { type: 'repo', url: 'https://github.com/example/repo', label: 'GitHub' },
      { type: 'video', url: 'https://youtu.be/demo', label: 'Launch video' },
    ]);
  });

  it('returns empty link arrays when metadata omits links', () => {
    const result = parseMetadata({
      title: 'No links project',
    } as unknown as Record<string, unknown>);

    assert.deepEqual(result.links, []);
  });

  it('normalises database link maps when building metadata responses', () => {
    const service = new ProjectSyncService({} as any, { projectRoot: process.cwd() });
    const metadata = service.metadataFromProject({
      id: 'db-project',
      slug: 'db-project',
      folder: 'db-project',
      title: 'DB Project',
      summary: null,
      description: null,
      organization: null,
      workType: null,
      year: null,
      role: null,
      seniority: null,
      categories: [],
      skills: [],
      tools: [],
      tags: [],
      highlights: [],
      links: {
        live: 'https://example.com/live',
        repo: { url: 'https://github.com/example/repo', label: 'Repo' },
      },
      nda: null,
      coverImage: null,
      caseProblem: null,
      caseActions: null,
      caseResults: null,
      schemaVersion: null,
      metadataChecksum: null,
      briefChecksum: null,
      metadataUpdatedAt: null,
      briefUpdatedAt: null,
      fsLastModified: null,
      lastSyncedAt: null,
      syncStatus: 'clean',
    } as any);

    assert.deepEqual(metadata.links, [
      { type: 'live', url: 'https://example.com/live' },
      { type: 'repo', url: 'https://github.com/example/repo', label: 'Repo' },
    ]);
  });
});

describe('projectSyncService metadata updates', () => {
  let tmpDir: string;
  let projectDir: string;
  let project: MutableProject;
  let service: ProjectSyncService;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-sync-test-'));
    projectDir = path.join(tmpDir, 'demo-project');
    await fs.mkdir(projectDir, { recursive: true });

    const originalMetadata = {
      schema_version: '2.0.0',
      title: 'Demo Project',
      categories: ['design'],
      skills: ['research'],
      tools: ['figma'],
      tags: ['ux'],
      highlights: ['shipped v1'],
      privacy: { nda: false },
      case: { problem: 'Slow funnel', actions: 'Redesign', results: 'Faster' },
    };
    await fs.writeFile(path.join(projectDir, 'metadata.json'), JSON.stringify(originalMetadata, null, 2));

    const checksum = computeChecksum(JSON.stringify(originalMetadata, null, 2));

    project = {
      id: 'project-123',
      folder: 'demo-project',
      title: 'Demo Project',
      summary: 'Summary',
      description: 'Summary',
      organization: 'Acme',
      workType: 'Design',
      year: 2024,
      role: 'Lead',
      seniority: 'Senior',
      categories: ['design'],
      skills: ['research'],
      tools: ['figma'],
      tags: ['ux'],
      highlights: ['shipped v1'],
      links: [],
      nda: false,
      coverImage: null,
      caseProblem: 'Slow funnel',
      caseActions: 'Redesign',
      caseResults: 'Faster',
      schemaVersion: '2.0.0',
      metadataChecksum: checksum,
      briefChecksum: null,
      metadataUpdatedAt: null,
      briefUpdatedAt: null,
      fsLastModified: null,
      lastSyncedAt: null,
      syncStatus: 'clean',
    };

    const fakePrisma = {
      project: {
        findUnique: async () => ({ ...project }),
        update: async ({ data }: { data: Partial<MutableProject> }) => {
          project = { ...project, ...data };
          return { ...project };
        },
      },
    } as const;

    service = new ProjectSyncService(fakePrisma as any, { projectRoot: tmpDir });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('detects metadata checksum conflicts', async () => {
    await assert.rejects(
      service.updateMetadata({
        projectId: project.id,
        metadata: {
          title: 'Updated title',
          summary: 'Updated summary',
          categories: ['design'],
          skills: [],
          tools: [],
          tags: [],
          highlights: [],
        } as MetadataResponse,
        expectedChecksum: 'different-checksum',
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /conflict/i);
        assert.ok((error as { conflict?: unknown }).conflict);
        return true;
      },
    );
  });

  it('writes metadata changes to disk and updates checksum', async () => {
    const updated = await service.updateMetadata({
      projectId: project.id,
      metadata: {
        title: 'Updated project',
        summary: 'New summary',
        categories: ['design', 'ux'],
        skills: ['leadership'],
        tools: ['figma'],
        tags: ['ux'],
        highlights: ['launched beta'],
        links: [
          { type: 'demo', url: 'https://demo.example.com', label: ' Demo ' },
          { url: ' https://fallback.example.com ' },
        ],
        case: { problem: 'Old problem', actions: 'New actions', results: 'New results' },
      } as MetadataResponse,
      expectedChecksum: project.metadataChecksum ?? undefined,
    });

    const disk = JSON.parse(await fs.readFile(path.join(projectDir, 'metadata.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(disk.title, 'Updated project');
    assert.ok(Array.isArray(disk.links));
    assert.deepEqual(disk.links, [
      { type: 'demo', url: 'https://demo.example.com', label: 'Demo' },
      { url: 'https://fallback.example.com' },
    ]);

    assert.strictEqual(updated.title, 'Updated project');
    assert.deepStrictEqual(project.categories, ['design', 'ux']);
    assert.deepEqual(project.links, [
      { type: 'demo', url: 'https://demo.example.com', label: 'Demo' },
      { url: 'https://fallback.example.com' },
    ]);
    assert.ok(project.metadataChecksum);
    assert.notStrictEqual(project.metadataChecksum, null);
  });
});
