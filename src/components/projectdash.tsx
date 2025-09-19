import React, { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit2,
  FileText,
  Filter,
  Folder,
  HardDrive,
  Image as ImageIcon,
  Music,
  Search,
  Trash2,
  Video,
  type LucideIcon,
  File as FileIcon,
} from 'lucide-react'
import type { ProjectAsset } from '../intake/schema'

type AssetCategory = 'image' | 'video' | 'audio' | 'document' | 'other'

type SortOption = 'recent' | 'name' | 'size'

type Props = {
  assets: ProjectAsset[]
  onAssetUpdate: (assetId: string, updates: Partial<ProjectAsset>) => void
  onAssetRemove: (assetId: string) => void
  onAssetReorder?: (assetId: string, direction: 'up' | 'down') => void
}

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  image: 'Images',
  video: 'Video',
  audio: 'Audio',
  document: 'Documents',
  other: 'Other',
}

const CATEGORY_ICONS: Record<AssetCategory, LucideIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  other: FileIcon,
}

const formatBytes = (value: number | undefined): string => {
  if (!Number.isFinite(value) || value === undefined) {
    return '—'
  }

  if (value <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const adjusted = value / 1024 ** exponent
  const display = adjusted >= 10 || exponent === 0 ? adjusted.toFixed(0) : adjusted.toFixed(1)

  return `${display} ${units[exponent]}`
}

const parseTimestamp = (value: string | undefined): number => {
  if (!value) {
    return 0
  }
  const result = Date.parse(value)
  return Number.isNaN(result) ? 0 : result
}

const normaliseCategory = (asset: ProjectAsset): AssetCategory => {
  const mime = asset.mimeType?.toLowerCase() ?? ''

  if (mime.startsWith('image/')) {
    return 'image'
  }
  if (mime.startsWith('video/')) {
    return 'video'
  }
  if (mime.startsWith('audio/')) {
    return 'audio'
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('text') ||
    mime.includes('presentation') ||
    mime.includes('sheet') ||
    mime.includes('spreadsheet')
  ) {
    return 'document'
  }
  return 'other'
}

const categoryFilters: Array<{ value: 'all' | AssetCategory; label: string }> = [
  { value: 'all', label: 'All assets' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
  { value: 'other', label: 'Other' },
]

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'recent', label: 'Recently added' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'size', label: 'File size' },
]

export default function ProjectAssetEditor({ assets, onAssetUpdate, onAssetRemove, onAssetReorder }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | AssetCategory>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matches: ProjectAsset[] = assets.filter(asset => {
      const category = normaliseCategory(asset)
      const matchesCategory = activeFilter === 'all' || category === activeFilter
      if (!matchesCategory) {
        return false
      }

      if (!query) {
        return true
      }

      const haystacks = [asset.name, asset.description ?? '', asset.mimeType]
        .filter(Boolean)
        .map(entry => entry.toLowerCase())

      return haystacks.some(text => text.includes(query))
    })

    const sorted = [...matches]
    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'size') {
        const aSize = Number.isFinite(a.size) ? a.size : 0
        const bSize = Number.isFinite(b.size) ? b.size : 0
        return bSize - aSize
      }

      const aTime = parseTimestamp(a.addedAt)
      const bTime = parseTimestamp(b.addedAt)
      return bTime - aTime
    })

    return sorted
  }, [assets, activeFilter, searchQuery, sortBy])

  useEffect(() => {
    if (filteredAssets.length === 0) {
      setSelectedAssetId(null)
      return
    }

    if (!selectedAssetId || !assets.some(asset => asset.id === selectedAssetId)) {
      setSelectedAssetId(filteredAssets[0].id)
      return
    }

    if (!filteredAssets.some(asset => asset.id === selectedAssetId)) {
      setSelectedAssetId(filteredAssets[0].id)
    }
  }, [assets, filteredAssets, selectedAssetId])

  const selectedAsset = useMemo(
    () => assets.find(asset => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  )

  const [nameDraft, setNameDraft] = useState('')
  const [descriptionDraft, setDescriptionDraft] = useState('')

  useEffect(() => {
    if (!selectedAsset) {
      setNameDraft('')
      setDescriptionDraft('')
      return
    }

    setNameDraft(selectedAsset.name)
    setDescriptionDraft(selectedAsset.description ?? '')
  }, [selectedAsset?.id])

  const totalBytes = useMemo(
    () => assets.reduce((sum, asset) => (Number.isFinite(asset.size) ? sum + asset.size : sum), 0),
    [assets],
  )

  const imageCount = useMemo(
    () => assets.filter(asset => normaliseCategory(asset) === 'image').length,
    [assets],
  )

  const lastAdded = useMemo(() => {
    return assets.reduce<{ timestamp: number; label: string } | null>((latest, asset) => {
      const timestamp = parseTimestamp(asset.addedAt)
      if (timestamp === 0) {
        return latest
      }
      if (!latest || timestamp > latest.timestamp) {
        return { timestamp, label: new Date(timestamp).toLocaleString() }
      }
      return latest
    }, null)
  }, [assets])

  const hasDraftChanges =
    !!selectedAsset &&
    (nameDraft.trim() !== selectedAsset.name || (descriptionDraft.trim() || '') !== (selectedAsset.description ?? ''))

  const handleSaveDetails = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAsset) {
      return
    }

    const trimmedName = nameDraft.trim()
    const trimmedDescription = descriptionDraft.trim()

    onAssetUpdate(selectedAsset.id, {
      name: trimmedName.length > 0 ? trimmedName : selectedAsset.name,
      description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
    })
  }

  const handleRemove = (assetId: string) => {
    onAssetRemove(assetId)
    if (selectedAssetId === assetId) {
      setSelectedAssetId(null)
    }
  }

  const selectedCategory = selectedAsset ? normaliseCategory(selectedAsset) : null
  const selectedCategoryKey: AssetCategory = selectedCategory ?? 'other'
  const SelectedPlaceholderIcon = CATEGORY_ICONS[selectedCategoryKey]
  const selectedAddedTimestamp = parseTimestamp(selectedAsset?.addedAt)
  const selectedIndex = selectedAssetId ? assets.findIndex(asset => asset.id === selectedAssetId) : -1
  const canMoveUp = onAssetReorder && selectedIndex > 0
  const canMoveDown = onAssetReorder && selectedIndex !== -1 && selectedIndex < assets.length - 1

  if (assets.length === 0) {
    return (
      <div className="asset-editor asset-editor--empty">
        <div className="asset-editor__empty">
          <h3>No assets yet</h3>
          <p>Add renders, briefs, or exports to see them here. Uploads remain local to your browser.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="asset-editor">
      <div className="asset-editor__summary">
        <div className="asset-editor__summary-card">
          <Folder className="asset-editor__summary-icon" />
          <div>
            <p>Total assets</p>
            <strong>{assets.length}</strong>
          </div>
        </div>
        <div className="asset-editor__summary-card">
          <ImageIcon className="asset-editor__summary-icon" />
          <div>
            <p>Visuals</p>
            <strong>{imageCount}</strong>
          </div>
        </div>
        <div className="asset-editor__summary-card">
          <HardDrive className="asset-editor__summary-icon" />
          <div>
            <p>Total size</p>
            <strong>{formatBytes(totalBytes)}</strong>
          </div>
        </div>
        <div className="asset-editor__summary-card">
          <Clock className="asset-editor__summary-icon" />
          <div>
            <p>Last added</p>
            <strong>{lastAdded?.label ?? '—'}</strong>
          </div>
        </div>
      </div>

      <div className="asset-editor__toolbar">
        <div className="asset-editor__search">
          <Search className="asset-editor__search-icon" />
          <input
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search by name, type, or notes"
          />
        </div>
        <div className="asset-editor__toolbar-actions">
          <div className="asset-editor__filters">
            <Filter className="asset-editor__filters-icon" />
            <div className="asset-editor__filters-buttons">
              {categoryFilters.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={filter.value === activeFilter ? 'is-active' : ''}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <label className="asset-editor__sort">
            <span>Sort</span>
            <select value={sortBy} onChange={event => setSortBy(event.target.value as SortOption)}>
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="asset-editor__body">
        <div className="asset-editor__grid">
          {filteredAssets.map(asset => {
            const category = normaliseCategory(asset)
            const Icon = CATEGORY_ICONS[category]
            const isSelected = selectedAssetId === asset.id
            const sizeLabel = formatBytes(asset.size)
            const addedTimestamp = parseTimestamp(asset.addedAt)
            const addedLabel = addedTimestamp ? new Date(addedTimestamp).toLocaleDateString() : '—'

            const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setSelectedAssetId(asset.id)
              }
            }

            return (
              <div
                key={asset.id}
                role="button"
                tabIndex={0}
                className={`asset-editor__item ${isSelected ? 'asset-editor__item--selected' : ''}`}
                onClick={() => setSelectedAssetId(asset.id)}
                onKeyDown={handleKeyDown}
                aria-pressed={isSelected}
              >
                <div className="asset-editor__thumb">
                  {category === 'image' ? (
                    <img src={asset.dataUrl} alt={asset.name} />
                  ) : category === 'video' ? (
                    asset.thumbnailUrl ? (
                      <div className="asset-editor__thumb-video">
                        <img src={asset.thumbnailUrl} alt={`${asset.name} thumbnail`} />
                        <span className="asset-editor__thumb-video-indicator">
                          <Video size={16} />
                        </span>
                      </div>
                    ) : (
                      <div className="asset-editor__thumb-icon">
                        <Video />
                      </div>
                    )
                  ) : category === 'audio' ? (
                    <div className="asset-editor__thumb-icon">
                      <Music />
                    </div>
                  ) : (
                    <div className="asset-editor__thumb-icon">
                      <Icon />
                    </div>
                  )}
                  <span className="asset-editor__badge">{CATEGORY_LABELS[category]}</span>
                  <button
                    type="button"
                    className="asset-editor__item-remove"
                    onClick={event => {
                      event.stopPropagation()
                      handleRemove(asset.id)
                    }}
                    title="Remove asset"
                  >
                    <Trash2 />
                  </button>
                </div>
                <div className="asset-editor__item-body">
                  <strong>{asset.name}</strong>
                  <span>{sizeLabel}</span>
                  <small>Added {addedLabel}</small>
                </div>
              </div>
            )
          })}

          {filteredAssets.length === 0 && (
            <div className="asset-editor__empty">
              <h3>No matches</h3>
              <p>Adjust the filters or search query to see assets.</p>
            </div>
          )}
        </div>

        {selectedAsset && (
          <aside className="asset-editor__details">
            <header className="asset-editor__details-header">
              <div>
                <p className="asset-editor__details-label">Selected asset</p>
                <h3>{selectedAsset.name}</h3>
              </div>
              <a
                className="asset-editor__details-download"
                href={selectedAsset.dataUrl}
                download={selectedAsset.name}
              >
                <Download />
                Download
              </a>
            </header>

            <div className="asset-editor__details-preview">
              {selectedCategory === 'image' ? (
                <img src={selectedAsset.dataUrl} alt={selectedAsset.name} />
              ) : selectedCategory === 'video' ? (
                <video
                  controls
                  poster={selectedAsset.thumbnailUrl ?? undefined}
                  src={selectedAsset.dataUrl}
                />
              ) : selectedCategory === 'audio' ? (
                <audio controls src={selectedAsset.dataUrl} />
              ) : (
                <div className="asset-editor__details-placeholder">
                  <SelectedPlaceholderIcon />
                </div>
              )}
            </div>

            <dl className="asset-editor__details-meta">
              <div>
                <dt>Type</dt>
                <dd>{CATEGORY_LABELS[selectedCategoryKey]}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{formatBytes(selectedAsset.size)}</dd>
              </div>
              <div>
                <dt>Added</dt>
                <dd>{selectedAddedTimestamp ? new Date(selectedAddedTimestamp).toLocaleString() : '—'}</dd>
              </div>
              <div>
                <dt>MIME type</dt>
                <dd>{selectedAsset.mimeType || '—'}</dd>
              </div>
            </dl>

            <form className="asset-editor__form" onSubmit={handleSaveDetails}>
              <label>
                <span>Name</span>
                <div className="asset-editor__form-field">
                  <Edit2 />
                  <input value={nameDraft} onChange={event => setNameDraft(event.target.value)} required />
                </div>
              </label>

              <label>
                <span>Description</span>
                <textarea
                  value={descriptionDraft}
                  onChange={event => setDescriptionDraft(event.target.value)}
                  placeholder="Add context, usage, or links"
                  rows={3}
                />
              </label>

              <div className="asset-editor__form-actions">
                <button type="submit" className="button button--primary" disabled={!hasDraftChanges}>
                  Save details
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    if (selectedAsset) {
                      setNameDraft(selectedAsset.name)
                      setDescriptionDraft(selectedAsset.description ?? '')
                    }
                  }}
                  disabled={!hasDraftChanges}
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="asset-editor__actions">
              <button type="button" className="button button--ghost button--danger" onClick={() => handleRemove(selectedAsset.id)}>
                <Trash2 />
                Remove asset
              </button>

              {onAssetReorder && (
                <div className="asset-editor__reorder">
                  <span>Reorder</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => selectedAssetId && onAssetReorder(selectedAssetId, 'up')}
                      disabled={!canMoveUp}
                    >
                      <ChevronUp />
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => selectedAssetId && onAssetReorder(selectedAssetId, 'down')}
                      disabled={!canMoveDown}
                    >
                      <ChevronDown />
                      Down
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
