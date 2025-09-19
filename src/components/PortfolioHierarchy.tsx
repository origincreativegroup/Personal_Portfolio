import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Folder,
  GripVertical,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText,
  FileQuestion,
  type LucideIcon,
} from 'lucide-react'
import type { ProjectAsset, ProjectMeta } from '../intake/schema'
import { listProjects, saveProject } from '../utils/storageManager'

import './PortfolioHierarchy.css'

type PortfolioHierarchyProps = {
  selectedProjectId?: string | null
  onSelectProject?: (projectId: string) => void
  onHierarchyChanged?: (projects: ProjectMeta[]) => void
}

type DragItem =
  | { type: 'project'; projectSlug: string }
  | { type: 'asset'; projectSlug: string; assetId: string }

type DropIndicator =
  | { type: 'project'; projectSlug: string }
  | { type: 'asset'; projectSlug: string; assetId: string; position: 'before' | 'after' }

const ASSET_ICONS: Array<{ matcher: (asset: ProjectAsset) => boolean; icon: LucideIcon }> = [
  { matcher: asset => asset.mimeType.startsWith('image/'), icon: ImageIcon },
  { matcher: asset => asset.mimeType.startsWith('video/'), icon: VideoIcon },
  { matcher: asset => asset.mimeType.startsWith('audio/'), icon: MusicIcon },
]

const determineAssetIcon = (asset: ProjectAsset): LucideIcon => {
  const match = ASSET_ICONS.find(entry => entry.matcher(asset))
  return match ? match.icon : FileText
}

const formatAssetSize = (size: number): string => {
  if (!Number.isFinite(size) || size <= 0) {
    return '—'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let value = size

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

const accentFromSlug = (slug: string): string => {
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) {
    hash = slug.charCodeAt(index) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 58%)`
}

export default function PortfolioHierarchy({ selectedProjectId, onSelectProject, onHierarchyChanged }: PortfolioHierarchyProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const refreshProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const storedProjects = await listProjects()
      const sorted = [...storedProjects].sort((a, b) => a.title.localeCompare(b.title))
      setProjects(sorted)
      setExpandedProjects(previous => {
        if (Object.keys(previous).length > 0) {
          return previous
        }
        const defaults: Record<string, boolean> = {}
        sorted.forEach(project => {
          defaults[project.slug] = project.slug === selectedProjectId
        })
        return defaults
      })
    } catch (fetchError) {
      console.error('Failed to load projects for hierarchy', fetchError)
      setError('Unable to load local projects. Save a project in the workspace to continue.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    void refreshProjects()
  }, [refreshProjects])

  useEffect(() => {
    if (!selectedProjectId) {
      return
    }

    setExpandedProjects(previous => ({
      ...previous,
      [selectedProjectId]: true,
    }))
  }, [selectedProjectId])

  const handleToggleProject = (projectSlug: string) => {
    setExpandedProjects(previous => ({
      ...previous,
      [projectSlug]: !previous[projectSlug],
    }))
  }

  const handleSelectProject = (projectSlug: string) => {
    onSelectProject?.(projectSlug)
  }

  const handleProjectDragStart = (projectSlug: string, event: React.DragEvent) => {
    event.stopPropagation()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', projectSlug)
    setDragItem({ type: 'project', projectSlug })
  }

  const handleAssetDragStart = (projectSlug: string, assetId: string, event: React.DragEvent) => {
    event.stopPropagation()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', assetId)
    setDragItem({ type: 'asset', projectSlug, assetId })
  }

  const clearDragState = () => {
    setDragItem(null)
    setDropIndicator(null)
  }

  const handleDragEnd = () => {
    clearDragState()
  }

  const reorderProjects = (sourceSlug: string, targetSlug: string) => {
    if (sourceSlug === targetSlug) {
      return
    }

    setProjects(previous => {
      const next = [...previous]
      const fromIndex = next.findIndex(project => project.slug === sourceSlug)
      const toIndex = next.findIndex(project => project.slug === targetSlug)

      if (fromIndex === -1 || toIndex === -1) {
        return previous
      }

      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const persistProjects = async (updated: ProjectMeta | ProjectMeta[]) => {
    const projectList = Array.isArray(updated) ? updated : [updated]
    await Promise.all(projectList.map(project => saveProject(project)))
  }

  const moveAsset = async (
    sourceProjectSlug: string,
    assetId: string,
    targetProjectSlug: string,
    targetIndex: number,
  ) => {
    setIsUpdating(true)
    setError(null)

    setProjects(previous => {
      const next = previous.map(project => ({
        ...project,
        assets: [...project.assets],
      }))

      const sourceProject = next.find(project => project.slug === sourceProjectSlug)
      const targetProject = next.find(project => project.slug === targetProjectSlug)

      if (!sourceProject || !targetProject) {
        setIsUpdating(false)
        return previous
      }

      const assetIndex = sourceProject.assets.findIndex(asset => asset.id === assetId)
      if (assetIndex === -1) {
        setIsUpdating(false)
        return previous
      }

      const [asset] = sourceProject.assets.splice(assetIndex, 1)
      let insertionIndex = targetIndex

      if (sourceProjectSlug === targetProjectSlug && assetIndex < insertionIndex) {
        insertionIndex -= 1
      }

      if (sourceProject.cover === assetId) {
        delete sourceProject.cover
      }

      const clampedIndex = Math.max(0, Math.min(insertionIndex, targetProject.assets.length))
      targetProject.assets.splice(clampedIndex, 0, asset)

      const timestamp = new Date().toISOString()
      sourceProject.updatedAt = timestamp
      targetProject.updatedAt = timestamp

      void persistProjects(
        sourceProjectSlug === targetProjectSlug
          ? sourceProject
          : [sourceProject, targetProject],
      ).catch(persistError => {
        console.error('Failed to persist asset move', persistError)
        void refreshProjects()
        setError('Unable to save asset changes. Try again.')
      }).finally(() => {
        setIsUpdating(false)
      })

      if (onHierarchyChanged) {
        const payload = next.map(project => ({
          ...project,
          assets: [...project.assets],
        }))
        onHierarchyChanged(payload)
      }

      return next
    })
  }

  const handleProjectDragOver = (projectSlug: string, event: React.DragEvent) => {
    if (!dragItem) {
      return
    }

    if (dragItem.type === 'project' && dragItem.projectSlug === projectSlug) {
      return
    }

    if (dragItem.type === 'asset' || dragItem.type === 'project') {
      event.preventDefault()
      setDropIndicator({ type: 'project', projectSlug })
    }
  }

  const handleProjectDrop = (projectSlug: string, event: React.DragEvent) => {
    event.preventDefault()
    if (!dragItem) {
      return
    }

    if (dragItem.type === 'project') {
      reorderProjects(dragItem.projectSlug, projectSlug)
    }

    if (dragItem.type === 'asset') {
      const targetProject = projects.find(project => project.slug === projectSlug)
      if (!targetProject) {
        clearDragState()
        return
      }
      void moveAsset(dragItem.projectSlug, dragItem.assetId, projectSlug, targetProject.assets.length)
    }

    clearDragState()
  }

  const handleAssetDragOver = (projectSlug: string, assetId: string, event: React.DragEvent) => {
    if (!dragItem || dragItem.type !== 'asset') {
      return
    }

    if (dragItem.projectSlug === projectSlug && dragItem.assetId === assetId) {
      return
    }

    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = event.clientY - bounds.top > bounds.height / 2 ? 'after' : 'before'
    setDropIndicator({ type: 'asset', projectSlug, assetId, position })
  }

  const handleAssetDrop = (projectSlug: string, assetId: string, event: React.DragEvent) => {
    event.preventDefault()
    if (!dragItem || dragItem.type !== 'asset') {
      return
    }

    const targetProject = projects.find(project => project.slug === projectSlug)
    if (!targetProject) {
      clearDragState()
      return
    }

    const targetIndex = targetProject.assets.findIndex(asset => asset.id === assetId)
    if (targetIndex === -1) {
      clearDragState()
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const isAfter = event.clientY - bounds.top > bounds.height / 2
    const insertionIndex = targetIndex + (isAfter ? 1 : 0)

    void moveAsset(dragItem.projectSlug, dragItem.assetId, projectSlug, insertionIndex)
    clearDragState()
  }

  const handleAssetListDrop = (projectSlug: string, event: React.DragEvent) => {
    if (!dragItem || dragItem.type !== 'asset') {
      return
    }
    event.preventDefault()
    const targetProject = projects.find(project => project.slug === projectSlug)
    if (!targetProject) {
      clearDragState()
      return
    }

    void moveAsset(dragItem.projectSlug, dragItem.assetId, projectSlug, targetProject.assets.length)
    clearDragState()
  }

  const isProjectExpanded = useCallback((slug: string) => {
    return expandedProjects[slug] ?? false
  }, [expandedProjects])

  const dropHint = useMemo(() => dropIndicator, [dropIndicator])

  return (
    <section className="portfolio-hierarchy" aria-label="Portfolio hierarchy">
      <header className="portfolio-hierarchy__header">
        <div className="portfolio-hierarchy__header-icon" aria-hidden="true">
          <FolderTree size={18} />
        </div>
        <div>
          <p className="portfolio-hierarchy__eyebrow">Asset workspace</p>
          <h3 id="portfolio-hierarchy-title" className="portfolio-hierarchy__title">Portfolio hierarchy</h3>
        </div>
        {isUpdating ? (
          <span className="portfolio-hierarchy__status" role="status">Saving…</span>
        ) : null}
      </header>

      {error ? (
        <p className="portfolio-hierarchy__error">{error}</p>
      ) : null}

      {isLoading ? (
        <div className="portfolio-hierarchy__empty">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="portfolio-hierarchy__empty">
          <FileQuestion size={18} />
          <p>No local projects found. Capture a project to explore its assets.</p>
        </div>
      ) : (
        <div className="portfolio-hierarchy__tree" role="tree" aria-labelledby="portfolio-hierarchy-title">
          <div className="portfolio-hierarchy__root" role="treeitem" aria-expanded="true">
            <div className="portfolio-hierarchy__root-header">
              <span className="portfolio-hierarchy__root-icon" aria-hidden="true">
                <Folder size={16} />
              </span>
              <span className="portfolio-hierarchy__root-label">Portfolio</span>
              <span className="portfolio-hierarchy__root-meta">{projects.length} project{projects.length === 1 ? '' : 's'}</span>
            </div>
            <div role="group" className="portfolio-hierarchy__projects">
              {projects.map(project => {
                const expanded = isProjectExpanded(project.slug)
                const accent = accentFromSlug(project.slug)
                const assetCount = project.assets.length
                const isActive = selectedProjectId === project.slug
                const projectDropActive = dropHint?.type === 'project' && dropHint.projectSlug === project.slug

                return (
                  <div
                    key={project.slug}
                    className={`portfolio-hierarchy__project${projectDropActive ? ' portfolio-hierarchy__project--drop' : ''}`}
                    role="treeitem"
                    aria-expanded={expanded}
                    aria-selected={isActive}
                  >
                    <button
                      type="button"
                      className={`portfolio-hierarchy__project-button${isActive ? ' portfolio-hierarchy__project-button--active' : ''}`}
                      onClick={() => handleSelectProject(project.slug)}
                      onDoubleClick={() => handleToggleProject(project.slug)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleToggleProject(project.slug)
                        }
                      }}
                      draggable
                      onDragStart={event => handleProjectDragStart(project.slug, event)}
                      onDragEnd={handleDragEnd}
                      onDragOver={event => handleProjectDragOver(project.slug, event)}
                      onDrop={event => handleProjectDrop(project.slug, event)}
                    >
                      <span className="portfolio-hierarchy__project-toggle" onClick={() => handleToggleProject(project.slug)}>
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                      <span className="portfolio-hierarchy__project-accent" style={{ backgroundColor: accent }} />
                      <span className="portfolio-hierarchy__project-title">{project.title || project.slug}</span>
                      <span className="portfolio-hierarchy__project-meta">{assetCount} asset{assetCount === 1 ? '' : 's'}</span>
                      <span className="portfolio-hierarchy__project-handle" aria-hidden="true">
                        <GripVertical size={16} />
                      </span>
                    </button>

                    {expanded ? (
                      <ul
                        className="portfolio-hierarchy__asset-list"
                        role="group"
                        onDragOver={event => handleProjectDragOver(project.slug, event)}
                        onDrop={event => handleProjectDrop(project.slug, event)}
                      >
                        {assetCount === 0 ? (
                          <li className="portfolio-hierarchy__asset-empty">
                            <p>No assets captured yet. Drag files from another project to start.</p>
                          </li>
                        ) : (
                          project.assets.map(asset => {
                            const Icon = determineAssetIcon(asset)
                            const indicatorActive =
                              dropHint?.type === 'asset' &&
                              dropHint.projectSlug === project.slug &&
                              dropHint.assetId === asset.id
                            const indicatorPosition = indicatorActive ? dropHint.position : null

                            return (
                              <li
                                key={asset.id}
                                className={`portfolio-hierarchy__asset${indicatorPosition ? ` portfolio-hierarchy__asset--drop-${indicatorPosition}` : ''}`}
                                draggable
                                onDragStart={event => handleAssetDragStart(project.slug, asset.id, event)}
                                onDragEnd={handleDragEnd}
                                onDragOver={event => handleAssetDragOver(project.slug, asset.id, event)}
                                onDrop={event => handleAssetDrop(project.slug, asset.id, event)}
                              >
                                <span className="portfolio-hierarchy__asset-icon" aria-hidden="true">
                                  <Icon size={14} />
                                </span>
                                <span className="portfolio-hierarchy__asset-name" title={asset.name}>
                                  {asset.name}
                                </span>
                                <span className="portfolio-hierarchy__asset-meta">{formatAssetSize(asset.size)}</span>
                              </li>
                            )
                          })
                        )}
                        <li
                          className="portfolio-hierarchy__asset-dropzone"
                          onDragOver={event => handleProjectDragOver(project.slug, event)}
                          onDrop={event => handleAssetListDrop(project.slug, event)}
                        >
                          Drop here to add to {project.title || project.slug}
                        </li>
                      </ul>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
