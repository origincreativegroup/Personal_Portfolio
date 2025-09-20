import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import type { Stats } from 'fs';
import { PrismaClient, Prisma, Project as ProjectModel } from '@prisma/client';
import {
  FilesystemAsset,
  FilesystemDeliverable,
  FilesystemProject,
  ParsedMetadata,
  ParsedMetadataLink,
  SyncConflict,
  SyncProjectResult,
  SyncSummary,
  UpdateBriefPayload,
  UpdateMetadataPayload,
} from '../types/projectSync';

const execFileAsync = promisify(execFile);

const METADATA_FILES = ['02_Metadata.json', 'metadata.json'];
const BRIEF_FILES = ['01_Narrative.md', 'brief.md'];
const PRIMARY_BRIEF_FILE = BRIEF_FILES[0];

const ASSET_DIRS = ['03_Assets', 'assets'];
const DELIVERABLE_DIRS = ['06_Exports', 'deliverables'];

const findFirstExistingFile = async (
  basePath: string,
  candidates: string[],
): Promise<{ path: string; stats: Stats } | null> => {
  for (const candidate of candidates) {
    const fullPath = path.join(basePath, candidate);
    const stats = await fs.stat(fullPath).catch(() => null);
    if (stats?.isFile()) {
      return { path: fullPath, stats };
    }
  }
  return null;
};

type SyncOptions = {
  projectRoot: string;
};

export const slugify = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'untitled-project';
};

export const computeChecksum = (input: Buffer | string): string => {
  const hash = crypto.createHash('sha1');
  hash.update(input);
  return hash.digest('hex');
};

const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as T;
};

const readOptionalText = async (filePath: string): Promise<{ content: string; checksum: string; mtime: Date } | null> => {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return null;
    }
    const buffer = await fs.readFile(filePath);
    return {
      content: buffer.toString('utf-8'),
      checksum: computeChecksum(buffer),
      mtime: stats.mtime,
    };
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  return [];
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const pickFirstString = (...candidates: unknown[]): string | undefined => {
  for (const candidate of candidates) {
    const value = normalizeOptionalString(candidate);
    if (value) {
      return value;
    }
  }
  return undefined;
};

const normalizeLinkEntry = (entry: unknown, fallbackType?: string): ParsedMetadataLink | null => {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    const url = normalizeOptionalString(entry);
    if (!url) {
      return null;
    }
    const result: ParsedMetadataLink = { url };
    const inferredType = normalizeOptionalString(fallbackType);
    if (inferredType) {
      result.type = inferredType;
    }
    return result;
  }

  if (typeof entry === 'object') {
    const data = entry as Record<string, unknown>;
    const url = pickFirstString(data.url, data.href, data.link, data.value);
    if (!url) {
      return null;
    }
    const result: ParsedMetadataLink = { url };
    const type = normalizeOptionalString(data.type) ?? normalizeOptionalString(fallbackType);
    if (type) {
      result.type = type;
    }
    const label = pickFirstString(data.label, data.title, data.name);
    if (label) {
      result.label = label;
    }
    return result;
  }

  return null;
};

const normalizeLinks = (value: unknown): ParsedMetadataLink[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(entry => normalizeLinkEntry(entry))
      .filter((entry): entry is ParsedMetadataLink => Boolean(entry));
  }

  if (typeof value === 'string') {
    const single = normalizeLinkEntry(value);
    return single ? [single] : [];
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => normalizeLinkEntry(entry, key))
      .filter((entry): entry is ParsedMetadataLink => Boolean(entry));
  }

  return [];
};

export const parseMetadata = (metadata: Record<string, unknown>): ParsedMetadata => {
  const caseData = typeof metadata.case === 'object' && metadata.case !== null ? metadata.case as Record<string, unknown> : {};
  const pcsiData = typeof metadata.pcsi === 'object' && metadata.pcsi !== null ? metadata.pcsi as Record<string, unknown> : {};
  const links = normalizeLinks((metadata as Record<string, unknown>).links);
  return {
    schemaVersion: typeof metadata.schema_version === 'string' ? metadata.schema_version : undefined,
    title: typeof metadata.title === 'string' && metadata.title.trim().length > 0 ? metadata.title.trim() : 'Untitled Project',
    summary: normalizeOptionalString(metadata.summary),
    organization: normalizeOptionalString(metadata.organization),
    workType: normalizeOptionalString(metadata.work_type),
    year: typeof metadata.year === 'number'
      ? metadata.year
      : typeof metadata.year === 'string' && /^\d{4}$/.test(metadata.year)
        ? Number(metadata.year)
        : undefined,
    role: normalizeOptionalString(metadata.role),
    seniority: normalizeOptionalString(metadata.seniority),
    categories: normalizeStringArray(metadata.categories),
    skills: normalizeStringArray(metadata.skills),
    tools: normalizeStringArray(metadata.tools),
    tags: normalizeStringArray(metadata.tags),
    highlights: normalizeStringArray(metadata.highlights),
    links,
    nda: typeof metadata === 'object' && metadata !== null
      ? Boolean((metadata.privacy as Record<string, unknown> | undefined)?.nda)
      : undefined,
    coverImage: normalizeOptionalString(metadata.cover_image),
    case: {
      problem: normalizeOptionalString(caseData.problem),
      challenge: normalizeOptionalString(caseData.challenge),
      actions: normalizeOptionalString(caseData.actions),
      results: normalizeOptionalString(caseData.results),
    },
    pcsi: {
      problem: normalizeOptionalString(pcsiData.problem),
      challenge: normalizeOptionalString(pcsiData.challenge),
      solution: normalizeOptionalString(pcsiData.solution),
      impact: normalizeOptionalString(pcsiData.impact),
    },
  };
};

const inferAssetType = (relativePath: string): string => {
  const extension = path.extname(relativePath).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff', '.webp', '.svg', '.heic'].includes(extension)) {
    return 'image';
  }
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg'].includes(extension)) {
    return 'video';
  }
  if (['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'].includes(extension)) {
    return 'audio';
  }
  if (['.pdf', '.ppt', '.pptx', '.key', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.md'].includes(extension)) {
    return 'document';
  }
  return 'asset';
};

const inferDeliverableFormat = (relativePath: string): string | undefined => {
  const ext = path.extname(relativePath).slice(1).toLowerCase();
  return ext || undefined;
};

const listFiles = async (baseDir: string): Promise<string[]> => {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFiles(entryPath);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
};

const mapAssets = async (projectPath: string): Promise<FilesystemAsset[]> => {
  const existingDirectories = await Promise.all(
    ASSET_DIRS.map(async directory => {
      const absolute = path.join(projectPath, directory);
      const stats = await fs.stat(absolute).catch(() => null);
      return stats?.isDirectory() ? absolute : null;
    }),
  );

  const directories = existingDirectories.filter((value): value is string => Boolean(value));
  if (directories.length === 0) {
    return [];
  }

  const assets: FilesystemAsset[] = [];
  for (const directory of directories) {
    const allFiles = await listFiles(directory);
    for (const file of allFiles) {
      const stats = await fs.stat(file);
      const buffer = await fs.readFile(file);
      const relativePath = path.relative(projectPath, file);
      assets.push({
        relativePath,
        type: inferAssetType(relativePath),
        size: stats.size,
        checksum: computeChecksum(buffer),
        lastModifiedAt: stats.mtime,
        label: path.basename(file),
      });
    }
  }

  return assets;
};

const mapDeliverables = async (projectPath: string): Promise<FilesystemDeliverable[]> => {
  const existingDirectories = await Promise.all(
    DELIVERABLE_DIRS.map(async directory => {
      const absolute = path.join(projectPath, directory);
      const stats = await fs.stat(absolute).catch(() => null);
      return stats?.isDirectory() ? absolute : null;
    }),
  );

  const directories = existingDirectories.filter((value): value is string => Boolean(value));
  if (directories.length === 0) {
    return [];
  }

  const deliverables: FilesystemDeliverable[] = [];
  for (const directory of directories) {
    const allFiles = await listFiles(directory);
    for (const file of allFiles) {
      const stats = await fs.stat(file);
      const buffer = await fs.readFile(file);
      const relativePath = path.relative(projectPath, file);
      deliverables.push({
        relativePath,
        format: inferDeliverableFormat(relativePath),
        size: stats.size,
        checksum: computeChecksum(buffer),
        lastModifiedAt: stats.mtime,
        label: path.basename(file),
      });
    }
  }

  return deliverables;
};

export class ProjectSyncService {
  private prisma: PrismaClient;
  private projectRoot: string;

  constructor(prisma: PrismaClient, options: SyncOptions) {
    this.prisma = prisma;
    this.projectRoot = options.projectRoot;
  }

  async syncAll(): Promise<SyncSummary> {
    const entries = await fs.readdir(this.projectRoot).catch(() => [] as string[]);
    const folders = entries.filter(entry => !entry.startsWith('.'));
    const results: SyncProjectResult[] = [];
    for (const folder of folders) {
      const stat = await fs.stat(path.join(this.projectRoot, folder)).catch(() => null);
      if (!stat?.isDirectory()) {
        continue;
      }
      const result = await this.syncProject(folder);
      results.push(result);
    }

    const created = results.filter(result => result.created).length;
    const updated = results.length - created;
    const conflicts = results.flatMap(result => result.conflicts);
    const warnings = results.flatMap(result => result.warnings);

    return {
      scanned: results.length,
      created,
      updated,
      conflicts,
      warnings,
      projects: results,
    };
  }

  async syncProject(folder: string): Promise<SyncProjectResult> {
    const projectPath = path.join(this.projectRoot, folder);
    const metadataInfo = await findFirstExistingFile(projectPath, METADATA_FILES);
    if (!metadataInfo) {
      throw new Error(`Project ${folder} is missing metadata (${METADATA_FILES.join(', ')})`);
    }

    const metadataPath = metadataInfo.path;
    const metadataStats = metadataInfo.stats;
    const rawMetadata = await readJsonFile<Record<string, unknown>>(metadataPath);
    const parsedMetadata = parseMetadata(rawMetadata);
    const metadataBuffer = await fs.readFile(metadataPath);

    const briefInfo = await findFirstExistingFile(projectPath, BRIEF_FILES);
    const briefPath = briefInfo?.path ?? path.join(projectPath, PRIMARY_BRIEF_FILE);
    const briefData = briefInfo ? await readOptionalText(briefInfo.path) : null;

    const assets = await mapAssets(projectPath);
    const deliverables = await mapDeliverables(projectPath);

    const fsLastModifiedCandidates = [metadataStats.mtime, ...assets.map(a => a.lastModifiedAt).filter(Boolean) as Date[]];
    if (briefData?.mtime) {
      fsLastModifiedCandidates.push(briefData.mtime);
    }
    if (deliverables.length > 0) {
      fsLastModifiedCandidates.push(...deliverables.map(item => item.lastModifiedAt).filter(Boolean) as Date[]);
    }
    const fsLastModified = fsLastModifiedCandidates.length > 0
      ? new Date(Math.max(...fsLastModifiedCandidates.map(date => date.getTime())))
      : new Date();

    const slug = slugify(parsedMetadata.title || folder);

    const fsProject: FilesystemProject = {
      folder,
      slug,
      metadataPath,
      briefPath: briefData ? briefPath : null,
      metadata: parsedMetadata,
      brief: briefData?.content ?? null,
      metadataChecksum: computeChecksum(metadataBuffer),
      briefChecksum: briefData?.checksum ?? null,
      metadataUpdatedAt: metadataStats.mtime,
      briefUpdatedAt: briefData?.mtime,
      fsLastModified,
      assets,
      deliverables,
    };

    return this.persistProject(fsProject);
  }

  private async persistProject(project: FilesystemProject): Promise<SyncProjectResult> {
    const existing = await this.prisma.project.findUnique({
      where: { folder: project.folder },
      include: { assets: true, deliverables: true },
    });

    const now = new Date();
    const warnings: string[] = [];
    const conflicts: SyncConflict[] = [];

    const baseData: Prisma.ProjectUpsertArgs['create'] = {
      slug: project.slug,
      folder: project.folder,
      title: project.metadata.title,
      summary: project.metadata.summary,
      description: project.metadata.summary ?? project.brief ?? null,
      organization: project.metadata.organization,
      workType: project.metadata.workType,
      year: project.metadata.year,
      role: project.metadata.role,
      seniority: project.metadata.seniority,
      categories: project.metadata.categories,
      skills: project.metadata.skills,
      tools: project.metadata.tools,
      tags: project.metadata.tags,
      highlights: project.metadata.highlights,
      links: project.metadata.links,
      nda: project.metadata.nda,
      coverImage: project.metadata.coverImage,
      caseProblem: project.metadata.case?.problem ?? null,
      caseActions: project.metadata.case?.actions ?? null,
      caseResults: project.metadata.case?.results ?? null,
      schemaVersion: project.metadata.schemaVersion,
      metadataChecksum: project.metadataChecksum,
      briefChecksum: project.briefChecksum,
      metadataUpdatedAt: project.metadataUpdatedAt,
      briefUpdatedAt: project.briefUpdatedAt,
      fsLastModified: project.fsLastModified,
      lastSyncedAt: now,
      syncStatus: 'clean',
      syncWarnings: warnings.length > 0 ? warnings : null,
    };

    let persistedId: string;
    if (!existing) {
      const created = await this.prisma.project.create({ data: baseData });
      persistedId = created.id;
    } else {
      const isMetadataChanged = existing.metadataChecksum !== project.metadataChecksum;
      const isBriefChanged = existing.briefChecksum !== project.briefChecksum;

      let syncStatus = 'clean';
      if (isMetadataChanged || isBriefChanged) {
        syncStatus = 'filesystem-updated';
      }

      const updated = await this.prisma.project.update({
        where: { id: existing.id },
        data: {
          ...baseData,
          syncStatus,
        },
      });
      persistedId = updated.id;
    }

    await this.syncAssets(persistedId, project.assets);
    await this.syncDeliverables(persistedId, project.deliverables);

    const refreshed = await this.prisma.project.findUnique({
      where: { id: persistedId },
      include: { assets: true, deliverables: true },
    });

    return {
      project: refreshed!,
      created: !existing,
      conflicts,
      warnings,
      assets: refreshed!.assets,
      deliverables: refreshed!.deliverables,
    };
  }

  private async syncAssets(projectId: string, assets: FilesystemAsset[]) {
    const paths = assets.map(asset => asset.relativePath);

    await this.prisma.projectAsset.deleteMany({
      where: {
        projectId,
        NOT: { relativePath: { in: paths.length > 0 ? paths : ['__none__'] } },
      },
    });

    for (const asset of assets) {
      await this.prisma.projectAsset.upsert({
        where: { projectId_relativePath: { projectId, relativePath: asset.relativePath } },
        create: {
          projectId,
          relativePath: asset.relativePath,
          label: asset.label,
          type: asset.type,
          size: asset.size ?? null,
          checksum: asset.checksum ?? null,
          lastModifiedAt: asset.lastModifiedAt ?? null,
        },
        update: {
          label: asset.label,
          type: asset.type,
          size: asset.size ?? null,
          checksum: asset.checksum ?? null,
          lastModifiedAt: asset.lastModifiedAt ?? null,
        },
      });
    }
  }

  private async syncDeliverables(projectId: string, deliverables: FilesystemDeliverable[]) {
    const paths = deliverables.map(item => item.relativePath);

    await this.prisma.projectDeliverable.deleteMany({
      where: {
        projectId,
        NOT: { relativePath: { in: paths.length > 0 ? paths : ['__none__'] } },
      },
    });

    for (const deliverable of deliverables) {
      await this.prisma.projectDeliverable.upsert({
        where: { projectId_relativePath: { projectId, relativePath: deliverable.relativePath } },
        create: {
          projectId,
          relativePath: deliverable.relativePath,
          label: deliverable.label,
          format: deliverable.format ?? null,
          size: deliverable.size ?? null,
          checksum: deliverable.checksum ?? null,
          lastModifiedAt: deliverable.lastModifiedAt ?? null,
        },
        update: {
          label: deliverable.label,
          format: deliverable.format ?? null,
          size: deliverable.size ?? null,
          checksum: deliverable.checksum ?? null,
          lastModifiedAt: deliverable.lastModifiedAt ?? null,
        },
      });
    }
  }

  async updateMetadata({ projectId, metadata, expectedChecksum }: UpdateMetadataPayload) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Project not found');
    }

    if (expectedChecksum && project.metadataChecksum && project.metadataChecksum !== expectedChecksum) {
      const conflict: SyncConflict = {
        field: 'metadata',
        reason: 'Metadata file changed since last fetch',
        expectedChecksum,
        actualChecksum: project.metadataChecksum,
      };
      const error = new Error('Metadata conflict detected');
      (error as any).conflict = conflict;
      throw error;
    }

    const projectPath = path.join(this.projectRoot, project.folder);
    const metadataInfo = await findFirstExistingFile(projectPath, METADATA_FILES);
    const metadataPath = metadataInfo?.path ?? path.join(projectPath, METADATA_FILES[0]);
    const legacyMetadataPath = path.join(projectPath, 'metadata.json');
    const normalizedLinks = normalizeLinks(metadata.links ?? []);
    const normalizedPcsi = metadata.pcsi
      ? {
          problem: metadata.pcsi.problem ?? '',
          challenge: metadata.pcsi.challenge ?? '',
          solution: metadata.pcsi.solution ?? '',
          impact: metadata.pcsi.impact ?? '',
        }
      : undefined;

    const payload = {
      schema_version: metadata.schemaVersion,
      title: metadata.title,
      summary: metadata.summary,
      organization: metadata.organization,
      work_type: metadata.workType,
      year: metadata.year,
      role: metadata.role,
      seniority: metadata.seniority,
      categories: metadata.categories,
      skills: metadata.skills,
      tools: metadata.tools,
      tags: metadata.tags,
      highlights: metadata.highlights,
      links: normalizedLinks,
      privacy: { nda: metadata.nda ?? false },
      case: {
        problem: metadata.case?.problem ?? '',
        challenge: metadata.case?.challenge ?? '',
        actions: metadata.case?.actions ?? '',
        results: metadata.case?.results ?? '',
      },
      pcsi: normalizedPcsi,
      cover_image: metadata.coverImage ?? '',
    };

    const buffer = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
    await fs.writeFile(metadataPath, buffer);
    if (legacyMetadataPath !== metadataPath) {
      await fs.writeFile(legacyMetadataPath, buffer);
    }
    const stats = await fs.stat(metadataPath);
    const checksum = computeChecksum(buffer);

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        title: metadata.title,
        summary: metadata.summary,
        description: metadata.summary ?? project.description,
        organization: metadata.organization,
        workType: metadata.workType,
        year: metadata.year,
        role: metadata.role,
        seniority: metadata.seniority,
        categories: metadata.categories,
        skills: metadata.skills,
        tools: metadata.tools,
        tags: metadata.tags,
        highlights: metadata.highlights,
        links: normalizedLinks,
        nda: metadata.nda,
        coverImage: metadata.coverImage,
        caseProblem: metadata.case?.problem ?? null,
        caseActions: metadata.case?.actions ?? null,
        caseResults: metadata.case?.results ?? null,
        metadataChecksum: checksum,
        metadataUpdatedAt: stats.mtime,
        fsLastModified: stats.mtime,
        lastSyncedAt: new Date(),
        syncStatus: 'clean',
      },
    });

    return updated;
  }

  async updateBrief({ projectId, content, expectedChecksum }: UpdateBriefPayload) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Project not found');
    }

    if (expectedChecksum && project.briefChecksum && project.briefChecksum !== expectedChecksum) {
      const conflict: SyncConflict = {
        field: 'brief',
        reason: 'Brief changed since last fetch',
        expectedChecksum,
        actualChecksum: project.briefChecksum,
      };
      const error = new Error('Brief conflict detected');
      (error as any).conflict = conflict;
      throw error;
    }

    const briefPath = path.join(this.projectRoot, project.folder, PRIMARY_BRIEF_FILE);
    await fs.writeFile(briefPath, content, 'utf-8');
    const stats = await fs.stat(briefPath);
    const checksum = computeChecksum(Buffer.from(content, 'utf-8'));

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        briefChecksum: checksum,
        briefUpdatedAt: stats.mtime,
        description: project.description ?? content,
        fsLastModified: stats.mtime,
        lastSyncedAt: new Date(),
        syncStatus: 'clean',
      },
    });

    return updated;
  }

  async readBrief(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Project not found');
    }
    const briefPath = path.join(this.projectRoot, project.folder, PRIMARY_BRIEF_FILE);
    const brief = await readOptionalText(briefPath);
    return {
      content: brief?.content ?? null,
      checksum: brief?.checksum ?? null,
    };
  }

  metadataFromProject(project: ProjectModel): ParsedMetadata {
    return {
      schemaVersion: project.schemaVersion ?? undefined,
      title: project.title,
      summary: project.summary ?? undefined,
      organization: project.organization ?? undefined,
      workType: project.workType ?? undefined,
      year: project.year ?? undefined,
      role: project.role ?? undefined,
      seniority: project.seniority ?? undefined,
      categories: project.categories ?? [],
      skills: project.skills ?? [],
      tools: project.tools ?? [],
      tags: project.tags ?? [],
      highlights: project.highlights ?? [],
      links: normalizeLinks(project.links ?? undefined),
      nda: project.nda ?? undefined,
      coverImage: project.coverImage ?? undefined,
      case: {
        problem: project.caseProblem ?? undefined,
        actions: project.caseActions ?? undefined,
        results: project.caseResults ?? undefined,
      },
    };
  }

  async importFromZip(buffer: Buffer): Promise<SyncProjectResult[]> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-import-'));
    const archivePath = path.join(tmpDir, 'project.zip');
    await fs.writeFile(archivePath, buffer);

    await execFileAsync('unzip', ['-o', archivePath, '-d', tmpDir]);

    const entries = await fs.readdir(tmpDir, { withFileTypes: true });
    const projectFolders = entries
      .filter(entry => entry.isDirectory() && entry.name !== path.basename(archivePath))
      .map(entry => entry.name);

    if (projectFolders.length === 0) {
      throw new Error('Archive does not contain a project folder');
    }

    const results: SyncProjectResult[] = [];
    for (const folder of projectFolders) {
      const source = path.join(tmpDir, folder);
      const destination = path.join(this.projectRoot, folder);
      await fs.mkdir(destination, { recursive: true });
      await execFileAsync('rsync', ['-a', `${source}/`, `${destination}/`]);
      const result = await this.syncProject(folder);
      results.push(result);
    }

    await fs.rm(tmpDir, { recursive: true, force: true });

    return results;
  }

  async exportToZip(projectId: string): Promise<{ filename: string; buffer: Buffer }> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Project not found');
    }

    const projectPath = path.join(this.projectRoot, project.folder);
    const stats = await fs.stat(projectPath).catch(() => null);
    if (!stats?.isDirectory()) {
      throw new Error('Project directory missing');
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-export-'));
    const archivePath = path.join(tmpDir, `${project.slug || project.folder}.zip`);

    await execFileAsync('zip', ['-r', archivePath, project.folder], { cwd: this.projectRoot });
    const buffer = await fs.readFile(archivePath);

    await fs.rm(tmpDir, { recursive: true, force: true });

    return {
      filename: path.basename(archivePath),
      buffer,
    };
  }
}

export default ProjectSyncService;
