import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Edit3, 
  Trash2, 
  Download, 
  Eye, 
  Star, 
  MoreVertical,
  Folder,
  Tag,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Copy,
  Move,
  Share2,
  Settings
} from 'lucide-react'
import { cn } from '../../shared/utils'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import { FileUpload } from '../ui/FileUpload'
import { ProjectAsset } from '../../types/asset'

// ===== TYPES =====

interface EnhancedAssetManagerProps {
  projectId?: string
  onAssetSelect?: (asset: ProjectAsset) => void
  onAssetEdit?: (asset: ProjectAsset) => void
  onAssetDelete?: (asset: ProjectAsset) => void
  className?: string
}

interface AssetFilters {
  type: string
  search: string
  folder: string
  visibility: string
  featured: boolean | null
  dateRange: {
    start: string
    end: string
  }
}

interface BulkOperation {
  type: 'delete' | 'move' | 'update' | 'download'
  assetIds: string[]
  data?: any
}

// ===== MOCK DATA =====

const mockAssets: ProjectAsset[] = [
  {
    id: '1',
    name: 'hero-image.jpg',
    type: 'image',
    size: 2048000,
    mimeType: 'image/jpeg',
    dataUrl: 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=Hero+Image',
    addedAt: '2024-01-15T10:00:00Z',
    description: 'Main hero image for the landing page',
    tags: ['hero', 'landing', 'main'],
    folder: 'marketing',
    featured: true,
    visibility: 'public',
    isHero: true,
    width: 800,
    height: 600,
  },
  {
    id: '2',
    name: 'product-demo.mp4',
    type: 'video',
    size: 15728640,
    mimeType: 'video/mp4',
    dataUrl: 'https://via.placeholder.com/800x600/10b981/ffffff?text=Product+Demo',
    addedAt: '2024-01-14T14:30:00Z',
    description: 'Product demonstration video',
    tags: ['demo', 'product', 'video'],
    folder: 'demos',
    featured: false,
    visibility: 'public',
    duration: 120,
  },
  {
    id: '3',
    name: 'brand-guidelines.pdf',
    type: 'document',
    size: 512000,
    mimeType: 'application/pdf',
    dataUrl: 'https://via.placeholder.com/800x600/f59e0b/ffffff?text=Brand+Guidelines',
    addedAt: '2024-01-13T09:15:00Z',
    description: 'Complete brand guidelines document',
    tags: ['brand', 'guidelines', 'pdf'],
    folder: 'branding',
    featured: false,
    visibility: 'private',
  }
]

// ===== COMPONENT =====

export default function EnhancedAssetManager({
  projectId,
  onAssetSelect,
  onAssetEdit,
  onAssetDelete,
  className,
}: EnhancedAssetManagerProps) {
  const [assets, setAssets] = useState<ProjectAsset[]>(mockAssets)
  const [filteredAssets, setFilteredAssets] = useState<ProjectAsset[]>(mockAssets)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingAsset, setEditingAsset] = useState<ProjectAsset | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [filters, setFilters] = useState<AssetFilters>({
    type: '',
    search: '',
    folder: '',
    visibility: '',
    featured: null,
    dateRange: { start: '', end: '' }
  })

  // Filter assets based on current filters
  useEffect(() => {
    let filtered = assets

    if (filters.type) {
      filtered = filtered.filter(asset => asset.type === filters.type)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(searchLower) ||
        asset.description?.toLowerCase().includes(searchLower) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    if (filters.folder) {
      filtered = filtered.filter(asset => asset.folder === filters.folder)
    }

    if (filters.visibility) {
      filtered = filtered.filter(asset => asset.visibility === filters.visibility)
    }

    if (filters.featured !== null) {
      filtered = filtered.filter(asset => asset.featured === filters.featured)
    }

    setFilteredAssets(filtered)
  }, [assets, filters])

  // Get unique folders
  const folders = Array.from(new Set(assets.map(asset => asset.folder).filter(Boolean)))

  // Get unique types
  const types = Array.from(new Set(assets.map(asset => asset.type)))

  const handleAssetSelect = (asset: ProjectAsset) => {
    if (onAssetSelect) {
      onAssetSelect(asset)
    }
  }

  const handleAssetEdit = (asset: ProjectAsset) => {
    setEditingAsset(asset)
  }

  const handleAssetDelete = async (asset: ProjectAsset) => {
    if (window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      setAssets(prev => prev.filter(a => a.id !== asset.id))
      if (onAssetDelete) {
        onAssetDelete(asset)
      }
    }
  }

  const handleBulkOperation = async (operation: BulkOperation) => {
    switch (operation.type) {
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${operation.assetIds.length} assets?`)) {
          setAssets(prev => prev.filter(asset => !operation.assetIds.includes(asset.id)))
          setSelectedAssets([])
        }
        break
      case 'move':
        // Handle move operation
        console.log('Move assets:', operation.assetIds, 'to folder:', operation.data?.folder)
        break
      case 'update':
        // Handle update operation
        console.log('Update assets:', operation.assetIds, 'with data:', operation.data)
        break
      case 'download':
        // Handle download operation
        console.log('Download assets:', operation.assetIds)
        break
    }
    setShowBulkActions(false)
  }

  const handleAssetUpdate = (updatedAsset: ProjectAsset) => {
    setAssets(prev => prev.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ))
    setEditingAsset(null)
  }

  const handleFileUpload = useCallback((files: File[]) => {
    console.log('🚀 EnhancedAssetManager: Uploading files:', files.length, 'files')
    console.log('Files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })))
    
    const newAssets: ProjectAsset[] = files.map(file => ({
      id: `asset-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 
            file.type.startsWith('audio/') ? 'audio' : 'document',
      size: file.size,
      mimeType: file.type,
      dataUrl: URL.createObjectURL(file),
      addedAt: new Date().toISOString(),
      description: `Uploaded asset: ${file.name}`,
      tags: ['uploaded'],
      folder: 'uploads',
      featured: false,
      visibility: 'public',
    }))
    
    setAssets(prev => {
      const updated = [...prev, ...newAssets]
      console.log('Updated assets in EnhancedAssetManager:', updated)
      return updated
    })
    
    setShowUpload(false)
  }, [])

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={20} />
      case 'video':
        return <Video size={20} />
      case 'audio':
        return <Music size={20} />
      case 'document':
        return <FileText size={20} />
      default:
        return <FileText size={20} />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
            Asset Manager
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            {filteredAssets.length} assets • {selectedAssets.length} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Search
                </label>
                <Input
                  placeholder="Search assets..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  leftIcon={<Search size={16} />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Folder
                </label>
                <select
                  value={filters.folder}
                  onChange={(e) => setFilters(prev => ({ ...prev, folder: e.target.value }))}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Folders</option>
                  {folders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Visibility
                </label>
                <select
                  value={filters.visibility}
                  onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      {selectedAssets.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700 dark:text-primary-300">
              {selectedAssets.length} assets selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation({ type: 'move', assetIds: selectedAssets, data: { folder: 'new-folder' } })}
                className="flex items-center gap-1"
              >
                <Move size={14} />
                Move
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation({ type: 'download', assetIds: selectedAssets })}
                className="flex items-center gap-1"
              >
                <Download size={14} />
                Download
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkOperation({ type: 'delete', assetIds: selectedAssets })}
                className="flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 size={16} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Assets Grid/List */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-2'
      )}>
        <AnimatePresence>
          {filteredAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'group cursor-pointer transition-all duration-200',
                  selectedAssets.includes(asset.id) && 'ring-2 ring-primary-500',
                  viewMode === 'list' && 'flex items-center gap-4 p-4'
                )}
                onClick={() => handleAssetSelect(asset)}
              >
                {viewMode === 'grid' ? (
                  <div className="space-y-3">
                    {/* Thumbnail */}
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                      <img
                        src={asset.dataUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            setSelectedAssets(prev => 
                              e.target.checked 
                                ? [...prev, asset.id]
                                : prev.filter(id => id !== asset.id)
                            )
                          }}
                          className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        {asset.featured && (
                          <div className="p-1 bg-yellow-500 text-white rounded">
                            <Star size={12} fill="currentColor" />
                          </div>
                        )}
                        {asset.isHero && (
                          <div className="p-1 bg-primary-500 text-white rounded">
                            <Eye size={12} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Asset Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getAssetIcon(asset.type)}
                        <h3 className="font-medium text-text-primary dark:text-text-primary-dark truncate">
                          {asset.name}
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                        {formatFileSize(asset.size)} • {formatDate(asset.addedAt)}
                      </p>
                      {asset.description && (
                        <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark line-clamp-2">
                          {asset.description}
                        </p>
                      )}
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-surface-secondary dark:bg-surface-secondary-dark text-text-secondary dark:text-text-secondary-dark rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {asset.tags.length > 3 && (
                            <span className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                              +{asset.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border dark:border-border-dark">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssetEdit(asset)
                          }}
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssetDelete(asset)
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle download
                          }}
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 w-full">
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        setSelectedAssets(prev => 
                          e.target.checked 
                            ? [...prev, asset.id]
                            : prev.filter(id => id !== asset.id)
                        )
                      }}
                      className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                    />
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {getAssetIcon(asset.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary dark:text-text-primary-dark truncate">
                        {asset.name}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                        {formatFileSize(asset.size)} • {formatDate(asset.addedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {asset.folder && (
                        <span className="px-2 py-1 text-xs bg-surface-secondary dark:bg-surface-secondary-dark text-text-secondary dark:text-text-secondary-dark rounded">
                          {asset.folder}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssetEdit(asset)
                          }}
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssetDelete(asset)
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Assets"
        size="lg"
      >
        <FileUpload
          onUpload={handleFileUpload}
          maxFiles={10}
          maxSize={50 * 1024 * 1024} // 50MB
        />
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
        title="Edit Asset"
        size="md"
      >
        {editingAsset && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Name
              </label>
              <Input
                value={editingAsset.name}
                onChange={(e) => setEditingAsset(prev => prev ? { ...prev, name: e.target.value } : null)}
                fullWidth
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Description
              </label>
              <Input
                value={editingAsset.description || ''}
                onChange={(e) => setEditingAsset(prev => prev ? { ...prev, description: e.target.value } : null)}
                multiline
                rows={3}
                fullWidth
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Tags
              </label>
              <Input
                value={editingAsset.tags?.join(', ') || ''}
                onChange={(e) => setEditingAsset(prev => prev ? { 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                } : null)}
                placeholder="Enter tags separated by commas"
                fullWidth
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingAsset.featured || false}
                  onChange={(e) => setEditingAsset(prev => prev ? { ...prev, featured: e.target.checked } : null)}
                  className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                />
                <span className="text-sm text-text-primary dark:text-text-primary-dark">Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingAsset.isHero || false}
                  onChange={(e) => setEditingAsset(prev => prev ? { ...prev, isHero: e.target.checked } : null)}
                  className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                />
                <span className="text-sm text-text-primary dark:text-text-primary-dark">Hero Asset</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingAsset(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleAssetUpdate(editingAsset)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
