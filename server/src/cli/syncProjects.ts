#!/usr/bin/env ts-node
/* eslint-disable no-console */
import path from 'path';
import { PrismaClient } from '@prisma/client';
import ProjectSyncService from '../services/projectSyncService';

const args = process.argv.slice(2);
const flags = new Map<string, string | boolean>();

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i]!;
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      flags.set(key, next);
      i += 1;
    } else {
      flags.set(key, true);
    }
  }
}

const prisma = new PrismaClient();
const projectRoot = process.env.PROJECTS_ROOT ?? path.resolve(__dirname, '../../..', 'projects');
const service = new ProjectSyncService(prisma, { projectRoot });

const run = async () => {
  try {
    const project = flags.get('project');
    let summary;
    if (typeof project === 'string' && project.length > 0) {
      summary = await service.syncProject(project);
      console.log(`Synced ${project}:`, {
        created: summary.created,
        conflicts: summary.conflicts.length,
        assets: summary.assets.length,
        deliverables: summary.deliverables.length,
      });
    } else {
      summary = await service.syncAll();
      console.log(`Synced ${summary.scanned} projects. Created ${summary.created}. Updated ${summary.updated}.`);
      if (summary.conflicts.length > 0) {
        console.warn('Conflicts detected:', summary.conflicts);
      }
      if (summary.warnings.length > 0) {
        console.warn('Warnings:', summary.warnings);
      }
    }
  } catch (error) {
    console.error('Project sync CLI failed', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

run();
