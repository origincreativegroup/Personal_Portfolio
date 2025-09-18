import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpDown,
  Check,
  CheckSquare,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  FolderPlus,
  Grid,
  Image as ImageIcon,
  FileText,
  List,
  Minus,
  Move,
  Music,
  Search,
  Star,
  Tag,
  Trash2,
  Upload,
  Video,
  type LucideIcon,
} from 'lucide-react'

const PROJECT_GLOB = import.meta.glob('../../projects/**/*', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

type FileVisibility = 'public' | 'private'

type FileRecord = {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'audio' | 'other'
  size: string
  sizeBytes: number | null
  tags: string[]
  featured: boolean
  project: string
  uploadDate: string
  visibility: FileVisibility
  folder: string | null
}

type ActiveModal = 'move' | 'copy' | 'tag' | 'edit' | 'delete' | null

type BulkEditData = {
  tags: string
  featured: boolean | null
  visibility: '' | FileVisibility
}

type Props = {
  projectSlug: string
  projectTitle?: string
}

const ICONS: Record<FileRecord['type'], LucideIcon> = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  audio: Music,
  other: FileText,
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '—'
  }
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return value >= 10 || exponent === 0 ? `${value.toFixed(0)} ${units[exponent]}` : `${value.toFixed(1)} ${units[exponent]}`
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())
}

function generateAccentColour(slug: string): string {
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) {
    hash = slug.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 55%)`
}

function guessFileType(fileName: string): FileRecord['type'] {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension) {
    return 'document'
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(extension)) {
    return 'image'
  }
  if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(extension)) {
    return 'video'
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
    return 'audio'
  }
  return 'document'
}

function normaliseTag(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function ProjectFileExplorer({ projectSlug, projectTitle }: Props) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'type' | 'visibility' | 'folder'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showProgress, setShowProgress] = useState(false)
  const [operationProgress, setOperationProgress] = useState(0)
  const [currentOperation, setCurrentOperation] = useState('')
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
    tags: '',
    featured: null,
    visibility: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [moveTargetFolder, setMoveTargetFolder] = useState('')
  const [copyTargetFolder, setCopyTargetFolder] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [customFolders, setCustomFolders] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    const loadFiles = async () => {
      setIsLoading(true)
      const prefix = `../../projects/${projectSlug}`
      const projectEntries = Object.keys(PROJECT_GLOB).filter(path => path.startsWith(prefix))

      if (projectEntries.length === 0) {
        if (!cancelled) {
          setFiles([])
          setIsLoading(false)
        }
        return
      }

      try {
        const entries = await Promise.all(
          projectEntries.map(async path => {
            const relativePath = path.slice(prefix.length + 1)
            if (!relativePath) {
              return null
            }

            const segments = relativePath.split('/')
            const fileName = segments[segments.length - 1]
            const folder = segments.length > 1 ? segments.slice(0, -1).join('/') : null

            let size = '—'
            let sizeBytes: number | null = null
            try {
              const loader = PROJECT_GLOB[path]
              const contents = await loader()
              const byteLength = new TextEncoder().encode(contents).length
              size = formatBytes(byteLength)
              sizeBytes = byteLength
            } catch (error) {
              console.warn('Unable to determine file size for', path, error)
            }

            const tags = segments
              .slice(0, -1)
              .map(segment => normaliseTag(segment))
              .filter(Boolean)

            const record: FileRecord = {
              id: `${projectSlug}/${relativePath}`,
              name: fileName,
              type: guessFileType(fileName),
              size,
              sizeBytes,
              tags,
              featured: false,
              project: projectSlug,
              uploadDate: '—',
              visibility: 'public',
              folder,
            }

            return record
          }),
        )

        if (!cancelled) {
          const filteredEntries = entries.filter((entry): entry is FileRecord => Boolean(entry))
          filteredEntries.sort((a, b) => a.name.localeCompare(b.name))
          setFiles(filteredEntries)
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to load files for project', projectSlug, error)
          setFiles([])
          setIsLoading(false)
        }
      }
    }

    loadFiles()

    return () => {
      cancelled = true
    }
  }, [projectSlug])

  useEffect(() => {
    setSelectedFiles([])
    setSelectMode(false)
    setFilterTags([])
    setSearchQuery('')
    setSortBy('name')
    setSortOrder('asc')
    setTagInput('')
    setBulkEditData({ tags: '', featured: null, visibility: '' })
    setMoveTargetFolder('')
    setCopyTargetFolder('')
    setNewFolderName('')
    setCustomFolders([])
  }, [projectSlug])

  useEffect(() => {
    setSelectedFiles(previous => previous.filter(id => files.some(file => file.id === id)))
  }, [files])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    files.forEach(file => {
      file.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [files])

  const allFolders = useMemo(() => {
    const folderSet = new Set<string>()
    files.forEach(file => {
      if (file.folder) {
        const segments = file.folder.split('/')
        segments.forEach((_, index) => {
          folderSet.add(segments.slice(0, index + 1).join('/'))
        })
      }
    })
    customFolders.forEach(folder => folderSet.add(folder))
    return Array.from(folderSet).sort((a, b) => a.localeCompare(b))
  }, [files, customFolders])

  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = files.filter(file => {
      const matchesQuery =
        query.length === 0 ||
        file.name.toLowerCase().includes(query) ||
        file.tags.some(tag => tag.toLowerCase().includes(query))
      const matchesTags = filterTags.length === 0 || filterTags.every(tag => file.tags.includes(tag))
      return matchesQuery && matchesTags
    })
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'size': {
          const aSize = a.sizeBytes ?? -1
          const bSize = b.sizeBytes ?? -1
          comparison = aSize - bSize
          break
        }
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'visibility':
          comparison = a.visibility.localeCompare(b.visibility)
          break
        case 'folder':
          comparison = (a.folder ?? '').localeCompare(b.folder ?? '')
          break
        case 'name':
        default:
          comparison = a.name.localeCompare(b.name)
          break
      }

      if (comparison === 0 && sortBy !== 'name') {
        comparison = a.name.localeCompare(b.name)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [files, searchQuery, filterTags, sortBy, sortOrder])

  const projectName = projectTitle ?? slugToTitle(projectSlug)
  const projectAccent = useMemo(() => generateAccentColour(projectSlug), [projectSlug])
  const hasSelection = selectedFiles.length > 0
  const selectionCount = selectedFiles.length
  const isAllSelected = filteredFiles.length > 0 && filteredFiles.every(file => selectedFiles.includes(file.id))

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(previous =>
      previous.includes(fileId)
        ? previous.filter(id => id !== fileId)
        : [...previous, fileId],
    )
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(filteredFiles.map(file => file.id))
    }
  }

  const handleSelectNone = () => {
    setSelectedFiles([])
    setSelectMode(false)
  }

  const simulateOperation = async (operationName: string) => {
    setCurrentOperation(operationName)
    setShowProgress(true)
    setOperationProgress(0)

    for (let progress = 0; progress <= 100; progress += 10) {
      setOperationProgress(progress)
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 120))
    }

    setTimeout(() => {
      setShowProgress(false)
      setCurrentOperation('')
      setActiveModal(null)
      setSelectedFiles([])
      setSelectMode(false)
    }, 600)
  }

  const handleBulkMove = async () => {
    await simulateOperation(`Moving ${selectionCount} file${selectionCount === 1 ? '' : 's'}`)
    setMoveTargetFolder('')
  }

  const handleBulkCopy = async () => {
    await simulateOperation(`Copying ${selectionCount} file${selectionCount === 1 ? '' : 's'}`)
    setCopyTargetFolder('')
  }

  const handleBulkDelete = async () => {
    await simulateOperation(`Deleting ${selectionCount} file${selectionCount === 1 ? '' : 's'}`)
  }

  const handleBulkTag = async () => {
    await simulateOperation(`Tagging ${selectionCount} file${selectionCount === 1 ? '' : 's'}`)
    setTagInput('')
  }

  const handleBulkEdit = async () => {
    await simulateOperation(`Updating ${selectionCount} file${selectionCount === 1 ? '' : 's'}`)
    setBulkEditData({ tags: '', featured: null, visibility: '' })
  }

  const addCustomFolder = () => {
    const value = newFolderName.trim()
    if (!value) {
      return
    }
    setCustomFolders(previous => (previous.includes(value) ? previous : [...previous, value]))
    if (activeModal === 'move') {
      setMoveTargetFolder(value)
    }
    if (activeModal === 'copy') {
      setCopyTargetFolder(value)
    }
    setNewFolderName('')
  }

  const BulkActionBar = () => (
    <div className="file-explorer__bulk-bar" aria-live="polite">
      <div className="file-explorer__bulk-bar__selection">
        <span className="file-explorer__bulk-bar__count">{selectionCount} selected</span>
        <button type="button" className="file-explorer__bulk-bar__clear" onClick={handleSelectNone}>
          Clear
        </button>
      </div>
      <div className="file-explorer__bulk-bar__divider" aria-hidden="true" />
      <div className="file-explorer__bulk-bar__actions">
        <button type="button" className="file-explorer__chip-button" onClick={() => setActiveModal('move')}>
          <Move size={16} /> Move
        </button>
        <button type="button" className="file-explorer__chip-button" onClick={() => setActiveModal('copy')}>
          <Copy size={16} /> Copy
        </button>
        <button type="button" className="file-explorer__chip-button" onClick={() => setActiveModal('tag')}>
          <Tag size={16} /> Tag
        </button>
        <button type="button" className="file-explorer__chip-button" onClick={() => setActiveModal('edit')}>
          <Edit2 size={16} /> Edit
        </button>
        <button
          type="button"
          className="file-explorer__chip-button file-explorer__chip-button--danger"
          onClick={() => setActiveModal('delete')}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  )

  const renderGrid = () => (
    <div className="file-explorer__grid" role="list">
      {filteredFiles.map(file => {
        const Icon = ICONS[file.type]
        const isSelected = selectedFiles.includes(file.id)
        return (
          <div
            key={file.id}
            role="listitem"
            className={`file-card${isSelected ? ' file-card--selected' : ''}${selectMode ? ' file-card--selectable' : ''}`}
            onClick={() => {
              if (selectMode) {
                handleFileSelect(file.id)
              }
            }}
          >
            {selectMode && (
              <button
                type="button"
                className={`file-card__checkbox${isSelected ? ' file-card__checkbox--checked' : ''}`}
                onClick={event => {
                  event.stopPropagation()
                  handleFileSelect(file.id)
                }}
                aria-pressed={isSelected}
                aria-label={isSelected ? `Deselect ${file.name}` : `Select ${file.name}`}
              >
                <Check size={16} />
              </button>
            )}
            <div className="file-card__preview" aria-hidden="true">
              <Icon size={28} />
            </div>
            <div className="file-card__info">
              <div className="file-card__title-row">
                <span className="file-card__name" title={file.name}>
                  {file.name}
                </span>
                {file.featured && <Star size={14} className="file-card__featured" aria-label="Featured asset" />}
              </div>
              <div className="file-card__meta">
                <span>{file.size}</span>
                <span>{file.visibility === 'public' ? <Eye size={14} /> : <EyeOff size={14} />}</span>
              </div>
              <div className="file-card__project" aria-label={`Project ${projectName}`}>
                <span className="file-card__project-indicator" style={{ backgroundColor: projectAccent }} />
                <span>{projectName}</span>
              </div>
              {file.tags.length > 0 && (
                <div className="file-card__tags">
                  {file.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="file-card__tag">
                      {tag}
                    </span>
                  ))}
                  {file.tags.length > 2 && <span className="file-card__tag">+{file.tags.length - 2}</span>}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderList = () => (
    <div className="file-explorer__list" role="table">
      <div className="file-explorer__list-header" role="row">
        <div role="columnheader">{selectMode ? <Check size={16} aria-hidden="true" /> : null}</div>
        <div role="columnheader">Name</div>
        <div role="columnheader">Folder</div>
        <div role="columnheader">Size</div>
        <div role="columnheader">Tags</div>
        <div role="columnheader">Visibility</div>
      </div>
      {filteredFiles.map(file => {
        const Icon = ICONS[file.type]
        const isSelected = selectedFiles.includes(file.id)
        return (
          <div
            key={file.id}
            role="row"
            className={`file-row${isSelected ? ' file-row--selected' : ''}`}
            onClick={() => {
              if (selectMode) {
                handleFileSelect(file.id)
              }
            }}
          >
            <div role="cell" className="file-row__select">
              {selectMode ? (
                <button
                  type="button"
                  className={`file-row__checkbox${isSelected ? ' file-row__checkbox--checked' : ''}`}
                  onClick={event => {
                    event.stopPropagation()
                    handleFileSelect(file.id)
                  }}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Deselect ${file.name}` : `Select ${file.name}`}
                >
                  <Check size={16} />
                </button>
              ) : (
                <span className="file-row__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
              )}
            </div>
            <div role="cell" className="file-row__name" title={file.id}>
              <span>{file.name}</span>
              {file.featured && <Star size={14} className="file-card__featured" aria-label="Featured asset" />}
            </div>
            <div role="cell" className="file-row__folder">
              {file.folder ? file.folder : '—'}
            </div>
            <div role="cell" className="file-row__size">
              {file.size}
            </div>
            <div role="cell" className="file-row__tags">
              {file.tags.length > 0 ? file.tags.join(', ') : '—'}
            </div>
            <div role="cell" className="file-row__visibility">
              {file.visibility === 'public' ? <Eye size={16} aria-label="Public" /> : <EyeOff size={16} aria-label="Private" />}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="file-explorer">
      <header className="file-explorer__header">
        <div className="file-explorer__header-copy">
          <p className="file-explorer__eyebrow">Asset workspace</p>
          <h2 className="file-explorer__title">{projectName}</h2>
          <p className="file-explorer__subtitle">
            {filteredFiles.length} file{filteredFiles.length === 1 ? '' : 's'} · {selectionCount} selected
          </p>
        </div>
        <div className="file-explorer__header-actions">
          <button
            type="button"
            className={`file-explorer__button${selectMode ? ' file-explorer__button--active' : ''}`}
            onClick={() => {
              if (selectMode) {
                setSelectMode(false)
                setSelectedFiles([])
              } else {
                setSelectMode(true)
              }
            }}
          >
            {selectMode ? 'Exit select' : 'Select mode'}
          </button>
          <button type="button" className="file-explorer__button file-explorer__button--primary">
            <Upload size={16} /> Upload files
          </button>
        </div>
      </header>

      <div className="file-explorer__controls">
        <label className="file-explorer__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search files or tags"
          />
        </label>
        <div className="file-explorer__control-buttons">
          {selectMode && (
            <button type="button" className="file-explorer__button" onClick={handleSelectAll}>
              {isAllSelected ? (
                <>
                  <Minus size={16} /> Deselect all
                </>
              ) : (
                <>
                  <CheckSquare size={16} /> Select all
                </>
              )}
            </button>
          )}
          <button type="button" className="file-explorer__button" aria-label="Filter files">
            <Filter size={16} />
          </button>
          <div className="file-explorer__view-toggle" role="radiogroup" aria-label="Toggle file view">
            <button
              type="button"
              className={`file-explorer__view-button${viewMode === 'grid' ? ' file-explorer__view-button--active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              className={`file-explorer__view-button${viewMode === 'list' ? ' file-explorer__view-button--active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              <List size={16} />
            </button>
          </div>
          <div className="file-explorer__sort" role="group" aria-label="Sort files">
            <label className="file-explorer__sort-label">
              <span>Sort by</span>
              <select
                className="file-explorer__select"
                value={sortBy}
                onChange={event => setSortBy(event.target.value as typeof sortBy)}
              >
                <option value="name">Name</option>
                <option value="folder">Folder</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
                <option value="visibility">Visibility</option>
              </select>
            </label>
            <button
              type="button"
              className={`file-explorer__button${sortOrder === 'desc' ? ' file-explorer__button--active' : ''}`}
              onClick={() => setSortOrder(previous => (previous === 'asc' ? 'desc' : 'asc'))}
              aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown size={16} />
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="file-explorer__filters" aria-label="Quick tag filters">
          {allTags.map(tag => {
            const isActive = filterTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                className={`file-explorer__chip${isActive ? ' file-explorer__chip--active' : ''}`}
                onClick={() =>
                  setFilterTags(previous =>
                    previous.includes(tag)
                      ? previous.filter(activeTag => activeTag !== tag)
                      : [...previous, tag],
                  )
                }
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      <section className="file-explorer__content" aria-live="polite">
        {isLoading && <div className="file-explorer__state">Loading project files…</div>}
        {!isLoading && filteredFiles.length === 0 && files.length === 0 && (
          <div className="file-explorer__state file-explorer__state--empty">
            <p>
              No files detected for this project. Add assets to the <code>projects/{projectSlug}</code> directory to get started.
            </p>
          </div>
        )}
        {!isLoading && filteredFiles.length === 0 && files.length > 0 && (
          <div className="file-explorer__state">No files match the current filters.</div>
        )}
        {!isLoading && filteredFiles.length > 0 && (viewMode === 'grid' ? renderGrid() : renderList())}
      </section>

      {hasSelection && <BulkActionBar />}

      {showProgress && (
        <div className="file-explorer__modal-backdrop" role="dialog" aria-modal="true" aria-live="polite">
          <div className="file-explorer__modal file-explorer__modal--progress">
            <h3>{currentOperation}</h3>
            <div className="file-explorer__progress">
              <div className="file-explorer__progress-bar" style={{ width: `${operationProgress}%` }} />
            </div>
            <p>{operationProgress}% complete</p>
          </div>
        </div>
      )}

      {activeModal === 'move' && (
        <div className="file-explorer__modal-backdrop" role="dialog" aria-modal="true">
          <div className="file-explorer__modal">
            <div className="file-explorer__modal-header">
              <h3 className="file-explorer__modal-title">Move {selectionCount} selected file{selectionCount === 1 ? '' : 's'}</h3>
              <button type="button" className="file-explorer__icon-button" onClick={() => setActiveModal(null)}>
                <span className="sr-only">Close</span>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="file-explorer__modal-content">
              <label className="file-explorer__field">
                <span>Destination folder</span>
                <select value={moveTargetFolder} onChange={event => setMoveTargetFolder(event.target.value)}>
                  <option value="">Top level</option>
                  {allFolders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </label>
              <div className="file-explorer__field file-explorer__field--inline">
                <label className="file-explorer__field">
                  <span>Create new folder</span>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={event => setNewFolderName(event.target.value)}
                    placeholder="e.g. moodboards"
                  />
                </label>
                <button type="button" className="file-explorer__button" onClick={addCustomFolder}>
                  <FolderPlus size={16} />
                  Add
                </button>
              </div>
            </div>
            <div className="file-explorer__modal-actions">
              <button type="button" className="file-explorer__button" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="file-explorer__button file-explorer__button--primary"
                disabled={moveTargetFolder === '' && newFolderName.trim().length === 0}
                onClick={handleBulkMove}
              >
                Move files
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'copy' && (
        <div className="file-explorer__modal-backdrop" role="dialog" aria-modal="true">
          <div className="file-explorer__modal">
            <div className="file-explorer__modal-header">
              <h3 className="file-explorer__modal-title">Copy {selectionCount} selected file{selectionCount === 1 ? '' : 's'}</h3>
              <button type="button" className="file-explorer__icon-button" onClick={() => setActiveModal(null)}>
                <span className="sr-only">Close</span>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="file-explorer__modal-content">
              <label className="file-explorer__field">
                <span>Destination folder</span>
                <select value={copyTargetFolder} onChange={event => setCopyTargetFolder(event.target.value)}>
                  <option value="">Top level</option>
                  {allFolders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </label>
              <div className="file-explorer__field file-explorer__field--inline">
                <label className="file-explorer__field">
                  <span>Create new folder</span>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={event => setNewFolderName(event.target.value)}
                    placeholder="e.g. deliverables"
                  />
                </label>
                <button type="button" className="file-explorer__button" onClick={addCustomFolder}>
                  <FolderPlus size={16} />
                  Add
                </button>
              </div>
            </div>
            <div className="file-explorer__modal-actions">
              <button type="button" className="file-explorer__button" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="file-explorer__button file-explorer__button--primary"
                disabled={copyTargetFolder === '' && newFolderName.trim().length === 0}
                onClick={handleBulkCopy}
              >
                Copy files
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'edit' && (
        <div className="file-explorer__modal-backdrop" role="dialog" aria-modal="true">
          <div className="file-explorer__modal file-explorer__modal--large">
            <div className="file-explorer__modal-header">
              <h3 className="file-explorer__modal-title">Bulk edit {selectionCount} file{selectionCount === 1 ? '' : 's'}</h3>
              <button type="button" className="file-explorer__icon-button" onClick={() => setActiveModal(null)}>
                <span className="sr-only">Close</span>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="file-explorer__modal-content file-explorer__modal-content--grid">
              <label className="file-explorer__field file-explorer__field--full">
                <span>Add tags</span>
                <input
                  type="text"
                  value={bulkEditData.tags}
                  onChange={event => setBulkEditData(previous => ({ ...previous, tags: event.target.value }))}
                  placeholder="ui, demo, final"
                />
              </label>
              <label className="file-explorer__field">
                <span>Featured status</span>
                <select
                  value={bulkEditData.featured === null ? '' : bulkEditData.featured ? 'true' : 'false'}
                  onChange={event =>
                    setBulkEditData(previous => ({
                      ...previous,
                      featured: event.target.value === '' ? null : event.target.value === 'true',
                    }))
                  }
                >
                  <option value="">No change</option>
                  <option value="true">Mark as featured</option>
                  <option value="false">Remove featured</option>
                </select>
              </label>
              <label className="file-explorer__field">
                <span>Visibility</span>
                <select
                  value={bulkEditData.visibility}
                  onChange={event =>
                    setBulkEditData(previous => ({
                      ...previous,
                      visibility: event.target.value as BulkEditData['visibility'],
                    }))
                  }
                >
                  <option value="">No change</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
            <div className="file-explorer__modal-actions">
              <button type="button" className="file-explorer__button" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="button" className="file-explorer__button file-explorer__button--primary" onClick={handleBulkEdit}>
                Update files
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'tag' && (
        <div className="file-explorer__modal-backdrop" role="dialog" aria-modal="true">
          <div className="file-explorer__modal">
            <div className="file-explorer__modal-header">
              <h3 className="file-explorer__modal-title">Tag {selectionCount} file{selectionCount === 1 ? '' : 's'}</h3>
              <button type="button" className="file-explorer__icon-button" onClick={() => setActiveModal(null)}>
                <span className="sr-only">Close</span>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="file-explorer__modal-content">
              <label className="file-explorer__field">
                <span>Add tags</span>
                <input
                  type="text"
                  value={tagInput}
                  onChange={event => setTagInput(event.target.value)}
                  placeholder="ui, hero, iteration"
                />
              </label>
              {allTags.length > 0 && (
                <div className="file-explorer__tag-suggestions">
                  <p>Suggested tags</p>
                  <div className="file-explorer__tag-suggestions-list">
                    {allTags.slice(0, 8).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const parts = tagInput
                            .split(',')
                            .map(value => normaliseTag(value))
                            .filter(Boolean)
                          if (!parts.includes(tag)) {
                            setTagInput(parts.length > 0 ? `${parts.join(', ')}, ${tag}` : tag)
                          }
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="file-explorer__modal-actions">
              <button type="button" className="file-explorer__button" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="file-explorer__button file-explorer__button--primary"
                onClick={handleBulkTag}
                disabled={tagInput.trim().length === 0}
              >
                Add tags
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'delete' && (
        <div className="file-explorer__modal-backdrop" role="dialog" aria-modal="true">
          <div className="file-explorer__modal file-explorer__modal--danger">
            <div className="file-explorer__modal-header">
              <div className="file-explorer__modal-icon">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="file-explorer__modal-title">Delete files</h3>
                <p>These assets will be removed from the project workspace.</p>
              </div>
              <button type="button" className="file-explorer__icon-button" onClick={() => setActiveModal(null)}>
                <span className="sr-only">Close</span>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="file-explorer__modal-copy">
              Are you sure you want to delete {selectionCount} selected file{selectionCount === 1 ? '' : 's'}? This action cannot be
              undone.
            </p>
            <div className="file-explorer__modal-actions">
              <button type="button" className="file-explorer__button" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="button" className="file-explorer__button file-explorer__button--danger" onClick={handleBulkDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

