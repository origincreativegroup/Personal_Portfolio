// Types are now defined in schemas.ts as Zod schemas
// Export them here for backwards compatibility
export type { Project, ProjectAsset, AssetFolder, CreateProject, UpdateProject, CreateAsset, UpdateAsset } from './schemas'

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface Block {
  id: string
  type: 'text' | 'image' | 'video' | 'chart' | 'timeline' | 'impact'
  content: any
  order: number
}
