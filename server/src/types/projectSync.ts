import { Project, ProjectAsset, ProjectDeliverable } from '@prisma/client';

export type ParsedMetadata = {
  schemaVersion?: string;
  title: string;
  summary?: string;
  organization?: string;
  workType?: string;
  year?: number;
  role?: string;
  seniority?: string;
  categories: string[];
  skills: string[];
  tools: string[];
  tags: string[];
  highlights: string[];
  links?: Record<string, unknown> | null;
  nda?: boolean;
  coverImage?: string | null;
  case?: {
    problem?: string | null;
    actions?: string | null;
    results?: string | null;
  } | null;
};

export type FilesystemAsset = {
  relativePath: string;
  type: string;
  label?: string;
  size?: number;
  checksum?: string;
  lastModifiedAt?: Date;
};

export type FilesystemDeliverable = {
  relativePath: string;
  format?: string;
  label?: string;
  size?: number;
  checksum?: string;
  lastModifiedAt?: Date;
};

export type FilesystemProject = {
  folder: string;
  slug: string;
  metadataPath: string;
  briefPath: string | null;
  metadata: ParsedMetadata;
  brief: string | null;
  metadataChecksum: string;
  briefChecksum: string | null;
  metadataUpdatedAt?: Date;
  briefUpdatedAt?: Date;
  fsLastModified?: Date;
  assets: FilesystemAsset[];
  deliverables: FilesystemDeliverable[];
};

export type SyncConflict = {
  field: 'metadata' | 'brief';
  reason: string;
  expectedChecksum?: string | null;
  actualChecksum?: string | null;
};

export type SyncProjectResult = {
  project: Project;
  created: boolean;
  conflicts: SyncConflict[];
  warnings: string[];
  assets: ProjectAsset[];
  deliverables: ProjectDeliverable[];
};

export type SyncSummary = {
  scanned: number;
  created: number;
  updated: number;
  conflicts: SyncConflict[];
  warnings: string[];
  projects: SyncProjectResult[];
};

export type UpdateMetadataPayload = {
  projectId: string;
  metadata: ParsedMetadata;
  expectedChecksum?: string;
};

export type UpdateBriefPayload = {
  projectId: string;
  content: string;
  expectedChecksum?: string | null;
};
