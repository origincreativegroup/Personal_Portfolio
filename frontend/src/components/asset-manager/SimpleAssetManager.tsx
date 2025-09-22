import { useState, useRef, useMemo } from 'react'
import { Search, Grid, List, Upload, X, Eye, Download, Trash2 } from 'lucide-react'
import { FolderIcon } from '../icons/IconSystem'
import { getAssetThumbnail } from '../../utils/thumbnailUtils'
import type { ProjectAsset } from '../../types/asset'

interface SimpleAssetManagerProps {
  assets: ProjectAsset[]
  onAssetUpload?: (files: FileList) => void
  onAssetRemove?: (assetId: string) => void
  onAssetSelect?: (asset: ProjectAsset) => void
  onAssetToggle?: (assetId: string) => void
  selectedAssets?: string[]
  showSelection?: boolean
  className?: string
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'image' | 'video' | 'audio' | 'document'

const getAssetType = (mimeType: string): FilterType => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
  return 'document'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function SimpleAssetManager({
  assets,
  onAssetUpload,
  onAssetRemove,
  onAssetSelect,
  onAssetToggle,
  selectedAssets = [],
  showSelection = false,
  className = ''
}: SimpleAssetManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedAsset, setSelectedAsset] = useState<ProjectAsset | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesFilter = filterType === 'all' || getAssetType(asset.mimeType) === filterType
      return matchesSearch && matchesFilter
    })
  }, [assets, searchQuery, filterType])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    console.log('🎯 Files dropped:', files.length, 'files')
    if (files.length > 0 && onAssetUpload) {
      console.log('📤 Calling onAssetUpload with dropped files')
      onAssetUpload(files)
    } else {
      console.log('❌ No files or no upload handler in drop:', { files: files.length, onAssetUpload: !!onAssetUpload })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input changed:', e.target.files)
    const files = e.target.files
    if (files && files.length > 0 && onAssetUpload) {
      console.log('📤 Calling onAssetUpload with', files.length, 'files')
      onAssetUpload(files)
      e.target.value = '' // Reset input
    } else {
      console.log('❌ No files or no upload handler:', { files: files?.length, onAssetUpload: !!onAssetUpload })
    }
  }

  const handleAssetClick = (asset: ProjectAsset) => {
    if (showSelection && onAssetToggle) {
      onAssetToggle(asset.id)
    } else {
      setSelectedAsset(asset)
      onAssetSelect?.(asset)
    }
  }

  const getAssetIcon = (asset: ProjectAsset) => {
    const type = getAssetType(asset.mimeType)
    return (
      <FolderIcon
        variant={type === 'image' ? 'default' :
                type === 'video' ? 'shared' :
                type === 'audio' ? 'assets' : 'projects'}
        size={48}
        className="mx-auto"
      />
    )
  }

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 asset-grid-mobile md:asset-grid-tablet">
      {filteredAssets.map(asset => (
        <div
          key={asset.id}
          className={`group bg-surface border rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer interactive asset-item-mobile hover-lift ${
            showSelection && selectedAssets.includes(asset.id)
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-border'
          }`}
          onClick={() => handleAssetClick(asset)}
        >
          {/* Selection indicator */}
          {showSelection && (
            <div className="absolute top-2 right-2 z-10">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedAssets.includes(asset.id)
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              }`}>
                {selectedAssets.includes(asset.id) && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          )}

          {/* Asset preview */}
          <div className="aspect-square bg-surface-secondary rounded-lg mb-3 overflow-hidden">
            {asset.mimeType.startsWith('image/') ? (
              <img
                src={getAssetThumbnail(asset)}
                alt={asset.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    const icon = document.createElement('div')
                    icon.className = 'w-full h-full flex items-center justify-center'
                    // Create a simple fallback icon instead of trying to render JSX
                    icon.innerHTML = '📁'
                    parent.appendChild(icon)
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {getAssetIcon(asset)}
              </div>
            )}
          </div>

          {/* Asset info */}
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-text-primary truncate" title={asset.name}>
              {asset.name}
            </h3>
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>{formatFileSize(asset.size)}</span>
              <span>{formatDate(asset.addedAt)}</span>
            </div>
          </div>

          {/* Hover actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-3 flex justify-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedAsset(asset)
              }}
              className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="Preview"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Download logic
                const link = document.createElement('a')
                link.href = asset.dataUrl
                link.download = asset.name
                link.click()
              }}
              className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Download"
            >
              <Download size={14} />
            </button>
            {onAssetRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAssetRemove(asset.id)
                }}
                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border bg-surface-elevated">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Asset Library</h2>
            <p className="text-text-secondary">{filteredAssets.length} of {assets.length} assets</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Upload</span>
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-text-primary placeholder-text-tertiary"
            />
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>

          {/* View mode toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Drop zone overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-primary-500/10 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-surface border border-primary-500 border-dashed rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-text-primary">Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="p-6 min-h-[400px]"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon variant="default" size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {searchQuery || filterType !== 'all' ? 'No matching assets' : 'No assets yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Upload your first asset to get started'
              }
            </p>
            {!searchQuery && filterType === 'all' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors interactive"
              >
                Upload Assets
              </button>
            )}
          </div>
        ) : (
          renderGridView()
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Asset preview modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{selectedAsset.name}</h3>
                <p className="text-text-secondary">
                  {formatFileSize(selectedAsset.size)} • {formatDate(selectedAsset.addedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-6">
              {selectedAsset.mimeType.startsWith('image/') && selectedAsset.dataUrl ? (
                <img
                  src={selectedAsset.dataUrl}
                  alt={selectedAsset.name}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-surface-secondary rounded-lg">
                  {getAssetIcon(selectedAsset)}
                  <div className="ml-4 text-center">
                    <p className="text-lg font-medium text-text-primary">{selectedAsset.name}</p>
                    <p className="text-text-secondary">Preview not available</p>
                  </div>
                </div>
              )}

              {selectedAsset.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-text-primary mb-2">Description</h4>
                  <p className="text-text-secondary">{selectedAsset.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}