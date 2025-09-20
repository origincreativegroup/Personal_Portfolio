import { projectService } from '../src/services/ProjectService.js';
import { blockService } from '../src/services/BlockService.js';
import { templateService } from '../src/services/TemplateService.js';
import { randomUUID } from 'node:crypto';

async function seed() {
  const project = await projectService.create({
    title: 'demo product analytics',
    summary: 'baseline project seeded for local testing',
    tags: ['demo', 'analytics'],
  });

  blockService.save(project.id, [
    {
      id: randomUUID(),
      type: 'text',
      order: 0,
      content: 'launching the analytics refresh',
      variant: 'heading',
    },
    {
      id: randomUUID(),
      type: 'media',
      order: 1,
      media: {
        url: 'https://images.example.com/dashboard.png',
        kind: 'image',
        alt: 'analytics dashboard screenshot',
      },
      caption: 'the refreshed analytics overview',
    },
    {
      id: randomUUID(),
      type: 'timeline',
      order: 2,
      items: [
        { label: 'discovery', start: '2023-09-01', note: 'journey mapping with stakeholders' },
        { label: 'design', start: '2023-10-15', end: '2023-11-30' },
        { label: 'launch', start: '2024-01-10' },
      ],
    },
    {
      id: randomUUID(),
      type: 'chart',
      order: 3,
      kind: 'bar',
      labels: ['week 1', 'week 2', 'week 3'],
      series: [{ name: 'active users', data: [220, 280, 340] }],
    },
    {
      id: randomUUID(),
      type: 'impact',
      order: 4,
      problem: 'stakeholders lacked clarity on feature adoption',
      solution: 'created a unified analytics workspace with weekly reviews',
      outcomes: ['team leads self-serve metrics', 'weekly updates shortened by 30 minutes'],
      metrics: { 'weekly-active': 320, 'time-saved-min': 30 },
    },
  ]);

  const templates = templateService.list();
  console.info(`Seeded project ${project.title} (${project.id}) with ${templates.length} templates.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
