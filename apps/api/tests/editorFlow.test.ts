import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer, type ApiServer } from '../src/server.js';
import { randomUUID } from 'node:crypto';
import type { AnyBlockT } from '@portfolioforge/schemas';

let server: ApiServer;

beforeAll(async () => {
  server = await buildServer();
});

afterAll(async () => {
  await server.close();
});

describe('project editor flow', () => {
  it('creates project, persists blocks, generates narrative, publishes, and exports', async () => {
    const createRes = await request(server.server)
      .post('/projects')
      .send({ title: 'Test Project', summary: 'demo summary', tags: ['test'] })
      .expect(200);

    const projectId = createRes.body.id as string;
    expect(projectId).toBeTruthy();

    const blocks: AnyBlockT[] = [
      {
        id: randomUUID(),
        type: 'text',
        order: 0,
        content: 'Heading',
        variant: 'heading',
      },
      {
        id: randomUUID(),
        type: 'media',
        order: 1,
        media: {
          url: 'https://example.com/image.png',
          kind: 'image',
          alt: 'example image',
        },
        caption: 'Media caption',
      },
      {
        id: randomUUID(),
        type: 'timeline',
        order: 2,
        items: [
          { label: 'Kickoff', start: '2024-01-01' },
          { label: 'Launch', start: '2024-03-01', end: '2024-05-01' },
        ],
      },
      {
        id: randomUUID(),
        type: 'chart',
        order: 3,
        kind: 'line',
        labels: ['Jan', 'Feb'],
        series: [
          { name: 'Growth', data: [10, 20] },
        ],
      },
      {
        id: randomUUID(),
        type: 'impact',
        order: 4,
        problem: 'Low activation',
        solution: 'Introduced guided onboarding',
        outcomes: ['Activation +30%'],
        metrics: { Activation: 30 },
      },
    ];

    await request(server.server)
      .post(`/blocks/${projectId}`)
      .send(blocks)
      .expect(200);

    const listRes = await request(server.server).get(`/blocks/${projectId}`).expect(200);
    expect(listRes.body).toHaveLength(5);

    const narrativeRes = await request(server.server)
      .post(`/narratives/${projectId}/generate`)
      .send({ tone: 3, mode: 'default' })
      .expect(200);
    expect(narrativeRes.body.executiveSummary).toContain('Test Project');

    const publishRes = await request(server.server).post(`/projects/${projectId}/publish`).expect(200);
    expect(publishRes.body.url).toContain('portfolioforge.dev');

    const exportRes = await request(server.server)
      .post(`/export/${projectId}/pdf`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(exportRes.headers['content-type']).toBe('application/pdf');
    expect(exportRes.body.length).toBeGreaterThan(1000);
  });
});
