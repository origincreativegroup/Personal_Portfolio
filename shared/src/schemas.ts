import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  slug: z.string(),
  folder: z.string(),
  title: z.string().min(1),
  summary: z.string().optional(),
  description: z.string().optional(),
  organization: z.string().optional(),
  workType: z.string().optional(),
  year: z.number().optional(),
  role: z.string().optional(),
  seniority: z.string().optional(),
  categories: z.string().optional(),
  skills: z.string().optional(),
  tools: z.string().optional(),
  tags: z.string().optional(),
  highlights: z.string().optional(),
  links: z.string().optional(),
  nda: z.boolean().optional(),
  coverImage: z.string().optional(),
  caseProblem: z.string().optional(),
  caseActions: z.string().optional(),
  caseResults: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const ProjectAssetSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  name: z.string(),
  relativePath: z.string(),
  label: z.string().optional(),
  type: z.string(),
  size: z.number().optional(),
  mimeType: z.string(),
  dataUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  addedAt: z.string(),
  description: z.string().optional(),
  tags: z.string().optional(),
  folder: z.string().optional(),
  featured: z.boolean(),
  visibility: z.string(),
  isHero: z.boolean(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const AssetFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

export const CreateAssetSchema = ProjectAssetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const UpdateAssetSchema = CreateAssetSchema.partial()

export type Project = z.infer<typeof ProjectSchema>
export type CreateProject = z.infer<typeof CreateProjectSchema>
export type UpdateProject = z.infer<typeof UpdateProjectSchema>
export type ProjectAsset = z.infer<typeof ProjectAssetSchema>
export type CreateAsset = z.infer<typeof CreateAssetSchema>
export type UpdateAsset = z.infer<typeof UpdateAssetSchema>
export type AssetFolder = z.infer<typeof AssetFolderSchema>
