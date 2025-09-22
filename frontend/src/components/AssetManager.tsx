import React, { useState, useRef, useMemo } from 'react';
import {
  Upload, Grid, List, Search,
  Image, FileText, Video, Music,
  Crown, Star, Download, Trash2, Edit2,
  Folder, X,
  MoreVertical,
  ArrowUpDown, ChevronDown, Filter as FilterIcon,
  Lock,
  Maximize2
} from 'lucide-react';
import type { 
  ProjectAsset, AssetCategory, ViewMode, SortOption, 
  FilterType, DateRange, SizeRange, AssetFilter, 
  BulkOperation
} from '../types/asset';

const CATEGORY_ICONS: Record<AssetCategory, React.ComponentType<any>> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  other: FileText,
};

interface AssetManagerProps {
  assets: ProjectAsset[];
  onAssetUpload?: (files: FileList) => void;
  onAssetRemove?: (assetId: string) => void;
  onAssetUpdate?: (assetId: string, updates: Partial<ProjectAsset>) => void;
  onHeroSelect?: (assetId: string | null) => void;
  heroAssetId?: string | null;
  isDarkMode?: boolean;
  onBulkOperation?: (operation: BulkOperation) => void;
}

const categorizeAsset = (asset: ProjectAsset): AssetCategory => {
  const mime = asset.mimeType?.toLowerCase() ?? '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('text') ||
      mime.includes('presentation') || mime.includes('sheet')) return 'document';
  return 'other';
};

const getSizeRange = (size: number): SizeRange => {
  if (size < 1024 * 1024) return 'small'; // < 1MB
  if (size < 10 * 1024 * 1024) return 'medium'; // < 10MB
  if (size < 100 * 1024 * 1024) return 'large'; // < 100MB
  return 'huge'; // >= 100MB
};

const getDateRange = (date: string): DateRange => {
  const assetDate = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - assetDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return 'today';
  if (diffDays <= 7) return 'week';
  if (diffDays <= 30) return 'month';
  if (diffDays <= 365) return 'year';
  return 'all';
};

const sortAssets = (assets: ProjectAsset[], sortBy: SortOption): ProjectAsset[] => {
  return [...assets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return b.size - a.size;
      case 'type':
        return categorizeAsset(a).localeCompare(categorizeAsset(b));
      case 'modified':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'recent':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
};

export default function AssetManager({
  assets = [],
  onAssetUpload,
  onAssetRemove,
  onAssetUpdate,
  onHeroSelect,
  heroAssetId,
  isDarkMode = false,
  onBulkOperation
}: AssetManagerProps) {
  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Enhanced filtering and sorting
  const [filter, setFilter] = useState<AssetFilter>({
    search: '',
    type: 'all',
    dateRange: 'all',
    sizeRange: 'all',
    tags: [],
    folders: []
  });
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<ProjectAsset | null>(null);
  
  // Bulk operations
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  
  // Edit and delete functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ProjectAsset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const assetInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // Enhanced filtering and sorting logic
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets.filter(asset => {
      // Search filter
      if (filter.search && !asset.name.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filter.type !== 'all') {
        const category = categorizeAsset(asset);
        if (category !== filter.type) return false;
      }
      
      // Date range filter
      if (filter.dateRange !== 'all') {
        const assetDateRange = getDateRange(asset.addedAt);
        if (filter.dateRange === 'today' && assetDateRange !== 'today') return false;
        if (filter.dateRange === 'week' && !['today', 'week'].includes(assetDateRange)) return false;
        if (filter.dateRange === 'month' && !['today', 'week', 'month'].includes(assetDateRange)) return false;
        if (filter.dateRange === 'year' && !['today', 'week', 'month', 'year'].includes(assetDateRange)) return false;
      }
      
      // Size range filter
      if (filter.sizeRange !== 'all') {
        const assetSizeRange = getSizeRange(asset.size);
        if (assetSizeRange !== filter.sizeRange) return false;
      }
      
      // Tags filter
      if (filter.tags.length > 0) {
        const assetTags = asset.tags || [];
        if (!filter.tags.some(tag => assetTags.includes(tag))) return false;
      }
      
      // Folder filter
      if (filter.folders.length > 0) {
        const assetFolder = asset.folder || 'root';
        if (!filter.folders.includes(assetFolder)) return false;
      }
      
      return true;
    });
    
    return sortAssets(filtered, sortBy);
  }, [assets, filter, sortBy]);

  // Enhanced assets with metadata
  const enhancedAssets = filteredAndSortedAssets.map(asset => ({
    ...asset,
    category: categorizeAsset(asset),
    tags: asset.tags || [],
    featured: asset.featured || false,
    visibility: asset.visibility || 'public' as const,
    folder: asset.folder || undefined,
    isHero: asset.id === heroAssetId,
  }));

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && onAssetUpload) {
      handleUploadFiles(files);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    if (!onAssetUpload) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 100);

    try {
      await onAssetUpload(files);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }

    clearInterval(progressInterval);
  };

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === enhancedAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(enhancedAssets.map(asset => asset.id));
    }
  };

  const handleBulkOperation = (type: BulkOperation['type'], data?: any) => {
    if (selectedAssets.length === 0) return;
    
    const operation: BulkOperation = {
      type,
      assets: selectedAssets,
      data
    };
    
    if (onBulkOperation) {
      onBulkOperation(operation);
    }
    
    setSelectedAssets([]);
    setShowBulkMenu(false);
  };

  const handlePreviewAsset = (asset: ProjectAsset) => {
    setPreviewAsset(asset);
    setShowPreview(true);
  };

  const handleEditAsset = (asset: ProjectAsset) => {
    setEditingAsset(asset);
    setShowEditModal(true);
  };

  const handleDeleteAsset = (assetId: string) => {
    setDeletingAssetId(assetId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAsset = () => {
    if (deletingAssetId && onAssetRemove) {
      onAssetRemove(deletingAssetId);
    }
    setShowDeleteConfirm(false);
    setDeletingAssetId(null);
  };

  const handleSaveAsset = (updatedAsset: Partial<ProjectAsset>) => {
    if (editingAsset && onAssetUpdate) {
      onAssetUpdate(editingAsset.id, updatedAsset);
    }
    setShowEditModal(false);
    setEditingAsset(null);
  };

  const handleFilterChange = (key: keyof AssetFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilter({
      search: '',
      type: 'all',
      dateRange: 'all',
      sizeRange: 'all',
      tags: [],
      folders: []
    });
  };

  // Get all unique tags from assets
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    assets.forEach(asset => {
      (asset.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [assets]);

  // Get all unique folders from assets
  const allFolders = useMemo(() => {
    const folderSet = new Set<string>();
    assets.forEach(asset => {
      if (asset.folder) folderSet.add(asset.folder);
    });
    return Array.from(folderSet).sort();
  }, [assets]);

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {enhancedAssets.map((asset) => {
        const IconComponent = CATEGORY_ICONS[asset.category];
        const isSelected = selectedAssets.includes(asset.id);
        const isHero = asset.isHero;

        return (
          <div
            key={asset.id}
            className={`group relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
              isSelected
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 ring-2 ring-purple-200 dark:ring-purple-800 shadow-lg'
                : isDarkMode
                  ? 'border-gray-700 bg-gray-800 hover:bg-gray-750 hover:border-gray-600 hover:shadow-md'
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
            } ${!selectMode ? 'hover:scale-[1.02]' : ''}`}
            onClick={() => selectMode ? handleAssetSelect(asset.id) : undefined}
          >
            {/* Hero indicator */}
            {isHero && (
              <div className="absolute top-3 right-3 z-20">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full p-1.5 shadow-lg">
                  <Crown size={14} />
                </div>
              </div>
            )}

            {/* Selection Checkbox */}
            {selectMode && (
              <div className="absolute top-3 left-3 z-20">
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 shadow-md'
                    : 'border-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm'
                }`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            )}

            {/* Asset Preview */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden mb-3">
              {asset.category === 'image' && asset.dataUrl && !asset.dataUrl.includes('data:application/') ? (
                <img
                  src={asset.dataUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.src = `https://via.placeholder.com/300x200/6366f1/ffffff?text=${encodeURIComponent(asset.name)}`;
                  }}
                />
              ) : asset.category === 'video' && asset.thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      ((e.currentTarget as HTMLElement).nextElementSibling as HTMLElement).style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50" style={{ display: 'none' }}>
                    <div className="text-center text-white">
                      <Video size={32} className="mx-auto mb-2" />
                      <span className="text-xs">Video Preview</span>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Video size={12} />
                    <span>VIDEO</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <IconComponent size={32} className="text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {asset.category}
                  </span>
                </div>
              )}
              
              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewAsset(asset);
                    }}
                    className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Preview"
                  >
                    <Maximize2 size={16} className="text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAsset(asset);
                    }}
                    className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Edit details"
                  >
                    <Edit2 size={16} className="text-gray-700" />
                  </button>
                  {onHeroSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onHeroSelect(isHero ? null : asset.id);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        isHero 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-white/90 hover:bg-white text-gray-700'
                      }`}
                      title={isHero ? "Remove as hero" : "Set as hero"}
                    >
                      <Crown size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAsset(asset.id);
                    }}
                    className="p-2 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              </div>
              
              {/* Duration for videos/audio */}
              {(asset.category === 'video' || asset.category === 'audio') && asset.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                </div>
              )}
              
              {/* Featured badge */}
              {asset.featured && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  <Star size={12} className="inline mr-1" />
                  Featured
                </div>
              )}
            </div>

            {/* Asset Info */}
            <div className="p-3 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatBytes(asset.size)}
                    </p>
                    <span className="text-gray-300">•</span>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(asset.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {asset.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {asset.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {asset.tags.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      +{asset.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                    asset.category === 'image'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                      : asset.category === 'video'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                        : asset.category === 'audio'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                          : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                  }`}>
                    {asset.category}
                  </span>
                  
                  {asset.visibility === 'private' && (
                    <Lock size={12} className="text-gray-500" />
                  )}
                </div>

                {isHero && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
                    Hero
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      ref={dropZoneRef}
      className={`asset-manager transition-colors duration-200 ${
        isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      } ${isDragOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className={`border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Image size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Asset Library</h2>
                <p className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span>{enhancedAssets.length} assets</span>
                  {selectedAssets.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-purple-600 font-medium">{selectedAssets.length} selected</span>
                    </>
                  )}
                  {(filter.search || filter.type !== 'all' || filter.dateRange !== 'all' || filter.sizeRange !== 'all' || filter.tags.length > 0 || filter.folders.length > 0) && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">filtered</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Bulk operations menu */}
              {selectedAssets.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <MoreVertical size={16} />
                    Bulk Actions
                  </button>
                  
                  {showBulkMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                      <div className="py-2">
                        <button
                          onClick={() => handleBulkOperation('download')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Download size={16} />
                          Download Selected
                        </button>
                        <button
                          onClick={() => handleBulkOperation('delete')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 size={16} />
                          Delete Selected
                        </button>
                        <button
                          onClick={() => handleBulkOperation('feature')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Star size={16} />
                          Feature Selected
                        </button>
                        <button
                          onClick={() => handleBulkOperation('visibility', 'private')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Lock size={16} />
                          Make Private
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectMode(!selectMode)}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium ${
                  selectMode
                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 shadow-sm'
                    : isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {selectMode ? 'Exit Select' : 'Select Mode'}
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium flex items-center gap-2 ${
                  showFilters
                    ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300'
                    : isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <FilterIcon size={16} />
                Filters
              </button>

              <div className="relative">
                <button
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => assetInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Assets
                    </>
                  )}
                </button>

                {isUploading && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={assetInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleUploadFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search assets..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                    : 'border-gray-200 bg-white focus:border-purple-500'
                }`}
              />
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setShowFilters(!showFilters)}
              >
                <ArrowUpDown size={16} />
                <span className="text-sm">
                  {sortBy === 'recent' ? 'Recent' : 
                   sortBy === 'name' ? 'Name' :
                   sortBy === 'size' ? 'Size' :
                   sortBy === 'type' ? 'Type' : 'Modified'}
                </span>
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectMode && (
                <button
                  onClick={handleSelectAll}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {selectedAssets.length === enhancedAssets.length ? 'Deselect All' : 'Select All'}
                </button>
              )}

              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Grid size={16} />
                </button>

                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* File Type Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">File Type</label>
                <select
                  value={filter.type}
                  onChange={(e) => handleFilterChange('type', e.target.value as FilterType)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select
                  value={filter.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value as DateRange)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Size Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">File Size</label>
                <select
                  value={filter.sizeRange}
                  onChange={(e) => handleFilterChange('sizeRange', e.target.value as SizeRange)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (&lt; 1MB)</option>
                  <option value="medium">Medium (1-10MB)</option>
                  <option value="large">Large (10-100MB)</option>
                  <option value="huge">Huge (&gt; 100MB)</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="size">Size (Largest)</option>
                  <option value="type">Type</option>
                  <option value="modified">Last Modified</option>
                </select>
              </div>
            </div>

            {/* Tags and Folders Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = filter.tags.includes(tag)
                            ? filter.tags.filter(t => t !== tag)
                            : [...filter.tags, tag];
                          handleFilterChange('tags', newTags);
                        }}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          filter.tags.includes(tag)
                            ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Folders Filter */}
              {allFolders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Folders</label>
                  <div className="flex flex-wrap gap-2">
                    {allFolders.map(folder => (
                      <button
                        key={folder}
                        onClick={() => {
                          const newFolders = filter.folders.includes(folder)
                            ? filter.folders.filter(f => f !== folder)
                            : [...filter.folders, folder];
                          handleFilterChange('folders', newFolders);
                        }}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors flex items-center gap-1 ${
                          filter.folders.includes(folder)
                            ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Folder size={12} />
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-purple-500/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-purple-500 max-w-md mx-4">
            <div className="text-center">
              <Upload size={48} className="mx-auto mb-4 text-purple-600 animate-bounce" />
              <h3 className="text-xl font-semibold mb-2">Drop your files here</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload images, videos, audio files, and documents
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {enhancedAssets.length === 0 ? (
          <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="max-w-md mx-auto">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Image size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {(filter.search || filter.type !== 'all' || filter.dateRange !== 'all' || filter.sizeRange !== 'all' || filter.tags.length > 0 || filter.folders.length > 0) ? 'No matching assets' : 'No assets yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(filter.search || filter.type !== 'all' || filter.dateRange !== 'all' || filter.sizeRange !== 'all' || filter.tags.length > 0 || filter.folders.length > 0)
                  ? 'Try adjusting your filters to find what you\'re looking for'
                  : 'Upload images, videos, documents, and other files to build your asset library'
                }
              </p>
              {!(filter.search || filter.type !== 'all' || filter.dateRange !== 'all' || filter.sizeRange !== 'all' || filter.tags.length > 0 || filter.folders.length > 0) && (
                <button
                  onClick={() => assetInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Upload size={16} className="inline mr-2" />
                  Upload Your First Asset
                </button>
              )}
            </div>
          </div>
        ) : (
          renderGridView()
        )}
      </main>

      {/* Asset Preview Modal */}
      {showPreview && previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {previewAsset.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatBytes(previewAsset.size)} • {new Date(previewAsset.addedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  {(() => {
                    const assetCategory = categorizeAsset(previewAsset);
                    return assetCategory === 'image' && previewAsset.dataUrl && !previewAsset.dataUrl.includes('data:application/') ? (
                      <img
                        src={previewAsset.dataUrl}
                        alt={previewAsset.name}
                        className="w-full h-auto rounded-lg shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/600x400/6366f1/ffffff?text=${encodeURIComponent(previewAsset.name)}`;
                        }}
                      />
                    ) : assetCategory === 'video' && previewAsset.thumbnailUrl ? (
                      <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={previewAsset.thumbnailUrl}
                          alt={previewAsset.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            ((e.currentTarget as HTMLElement).nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80" style={{ display: 'none' }}>
                          <div className="text-center text-white">
                            <Video size={64} className="mx-auto mb-4" />
                            <p className="text-lg font-medium">{previewAsset.name}</p>
                            <p className="text-sm opacity-75">Video preview not available</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-black/70 rounded-full flex items-center justify-center">
                            <Video size={32} className="text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          {(() => {
                            const IconComponent = CATEGORY_ICONS[assetCategory];
                            return <IconComponent size={48} className="mx-auto mb-4 text-gray-400" />;
                          })()}
                          <p className="text-gray-500 dark:text-gray-400">
                            Preview not available for {assetCategory} files
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="w-80 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="text-gray-900 dark:text-gray-100 capitalize">{categorizeAsset(previewAsset)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Size:</span>
                        <span className="text-gray-900 dark:text-gray-100">{formatBytes(previewAsset.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Added:</span>
                        <span className="text-gray-900 dark:text-gray-100">{new Date(previewAsset.addedAt).toLocaleDateString()}</span>
                      </div>
                      {previewAsset.width && previewAsset.height && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                          <span className="text-gray-900 dark:text-gray-100">{previewAsset.width} × {previewAsset.height}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {previewAsset.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{previewAsset.description}</p>
                    </div>
                  )}
                  
                  {previewAsset.tags && previewAsset.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {previewAsset.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        // Download functionality
                        const link = document.createElement('a');
                        link.href = previewAsset.dataUrl;
                        link.download = previewAsset.name;
                        link.click();
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    {onHeroSelect && (
                      <button
                        onClick={() => {
                          onHeroSelect(previewAsset.isHero ? null : previewAsset.id);
                          setShowPreview(false);
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          previewAsset.isHero
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Crown size={16} />
                        {previewAsset.isHero ? 'Remove Hero' : 'Set as Hero'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && editingAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Edit Asset Details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Update the details for {editingAsset.name}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <EditAssetForm 
                asset={editingAsset} 
                onSave={handleSaveAsset}
                onCancel={() => setShowEditModal(false)}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingAssetId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Delete Asset
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this asset? This will permanently remove it from your library.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAsset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Asset Form Component
function EditAssetForm({ 
  asset, 
  onSave, 
  onCancel, 
  isDarkMode 
}: { 
  asset: ProjectAsset; 
  onSave: (updates: Partial<ProjectAsset>) => void; 
  onCancel: () => void;
  isDarkMode: boolean;
}) {
  const [formData, setFormData] = useState({
    name: asset.name,
    description: asset.description || '',
    tags: (asset.tags || []).join(', '),
    folder: asset.folder || '',
    featured: asset.featured || false,
    visibility: asset.visibility || 'public',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<ProjectAsset> = {
      name: formData.name,
      description: formData.description,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      folder: formData.folder || undefined,
      featured: formData.featured,
      visibility: formData.visibility as 'public' | 'private',
    };
    onSave(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          Asset Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800 text-gray-100'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800 text-gray-100'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
          placeholder="Add a description for this asset..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          Tags
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800 text-gray-100'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
          placeholder="tag1, tag2, tag3..."
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Separate tags with commas
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          Folder
        </label>
        <input
          type="text"
          value={formData.folder}
          onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800 text-gray-100'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
          placeholder="folder-name"
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-gray-900 dark:text-gray-100">Featured Asset</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-900 dark:text-gray-100">Visibility:</label>
          <select
            value={formData.visibility}
            onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
            className={`px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800 text-gray-100'
                : 'border-gray-200 bg-white text-gray-900'
            }`}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
