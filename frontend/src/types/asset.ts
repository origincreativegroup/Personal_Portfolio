// Enhanced Asset management types for comprehensive UI
import { ProjectAsset as SharedProjectAsset, AssetFolder as SharedAssetFolder } from '@portfolioforge/shared'

export interface ProjectAsset extends Omit<SharedProjectAsset, 'tags'> {
  // Frontend-specific extensions - tags converted from string to array
  tags: string[];
}

export interface AssetFolder extends SharedAssetFolder {
  assetCount: number; // Frontend-specific computed field
}

export type AssetCategory = 'image' | 'video' | 'audio' | 'document' | 'other';
export type SortOption = 'recent' | 'name' | 'size' | 'type' | 'modified';
export type ViewMode = 'grid' | 'list';
export type FilterType = 'all' | 'image' | 'video' | 'audio' | 'document' | 'other';
export type DateRange = 'all' | 'today' | 'week' | 'month' | 'year';
export type SizeRange = 'all' | 'small' | 'medium' | 'large' | 'huge';

export interface EnhancedAsset extends ProjectAsset {
  category: AssetCategory;
  modifiedAt?: string;
}

export interface AssetFilter {
  search: string;
  type: FilterType;
  dateRange: DateRange;
  sizeRange: SizeRange;
  tags: string[];
  folders: string[];
}

export interface BulkOperation {
  type: 'delete' | 'download' | 'tag' | 'move' | 'feature' | 'visibility';
  assets: string[];
  data?: any;
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  assetCount: number;
}
