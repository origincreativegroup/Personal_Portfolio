import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Archive,
  Download,
  Eye,
  Grid,
  Image as ImageIcon,
  Layout,
  FileText,
  Link2,
  Monitor,
  Plus,
  Settings,
  Smartphone,
  Tablet,
  Trash2,
  Type,
  Video,
} from 'lucide-react'
import type {
  GalleryBlockContent,
  HeroBlockContent,
  ImageBlockContent,
  LinkBlockContent,
  MetricsBlockContent,
  ProjectAsset,
  ProjectBlockSettings,
  ProjectLayoutBlock,
  ProjectLink,
  ProjectMeta,
  TextBlockContent,
  VideoBlockContent,
} from '../intake/schema'
import { projectRoleLabels, projectStatusLabels } from '../intake/schema'

type ProjectEditorProps = {
  project: ProjectMeta
  onUpdateProject: (updates: Partial<ProjectMeta>) => Promise<void>
}

type ViewMode = 'desktop' | 'tablet' | 'mobile'

type SaveState = { type: 'success' | 'error' | 'info'; message: string } | null

const DEFAULT_SETTINGS: Required<ProjectBlockSettings> = {
  width: 'full',
  alignment: 'left',
  padding: 'medium',
  backgroundColor: 'transparent',
}

const TEXT_STYLE_OPTIONS: Array<{ value: TextBlockContent['style']; label: string }> = [
  { value: 'section', label: 'Section heading' },
  { value: 'body', label: 'Body copy' },
  { value: 'quote', label: 'Quote' },
]

const LINK_TYPE_OPTIONS: Array<{ value: ProjectLink['type']; label: string }> = [
  { value: 'website', label: 'Website' },
  { value: 'demo', label: 'Live demo' },
  { value: 'github', label: 'Repository' },
  { value: 'behance', label: 'Behance' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Other' },
]

const ensureSettings = (settings?: ProjectBlockSettings): Required<ProjectBlockSettings> => ({
  width: settings?.width ?? DEFAULT_SETTINGS.width,
  alignment: settings?.alignment ?? DEFAULT_SETTINGS.alignment,
  padding: settings?.padding ?? DEFAULT_SETTINGS.padding,
  backgroundColor: settings?.backgroundColor ?? DEFAULT_SETTINGS.backgroundColor,
})

const getAssetById = (assets: ProjectAsset[], id?: string | null) =>
  (id ? assets.find(asset => asset.id === id) ?? null : null)

const generateDefaultLayout = (project: ProjectMeta): ProjectLayoutBlock[] => {
  const blocks: ProjectLayoutBlock[] = []
  let order = 0

  const imageAssets = project.assets.filter(asset => asset.mimeType.startsWith('image/'))
  const videoAssets = project.assets.filter(asset => asset.mimeType.startsWith('video/'))

  const heroAsset =
    (project.cover && imageAssets.find(asset => asset.id === project.cover)) ||
    imageAssets[0]

  if (heroAsset) {
    const content: HeroBlockContent = {
      title: project.title,
      subtitle: project.summary ?? project.problem ?? undefined,
      assetId: heroAsset.id,
    }

    blocks.push({
      id: `hero-${heroAsset.id}`,
      type: 'hero',
      order: order++,
      settings: { ...DEFAULT_SETTINGS, width: 'full' },
      content,
    })
  }

  if (project.problem) {
    const content: TextBlockContent = {
      title: 'The Problem',
      text: project.problem,
      style: 'section',
    }

    blocks.push({
      id: 'problem-block',
      type: 'text',
      order: order++,
      settings: DEFAULT_SETTINGS,
      content,
    })
  }

  if (project.solution) {
    const content: TextBlockContent = {
      title: 'The Solution',
      text: project.solution,
      style: 'section',
    }

    blocks.push({
      id: 'solution-block',
      type: 'text',
      order: order++,
      settings: DEFAULT_SETTINGS,
      content,
    })
  }

  const galleryImages = imageAssets.filter(asset => asset.id !== heroAsset?.id)
  if (galleryImages.length > 0) {
    const content: GalleryBlockContent = {
      title: 'Project Gallery',
      items: galleryImages.map(asset => ({
        assetId: asset.id,
        caption: asset.description ?? '',
      })),
    }

    blocks.push({
      id: 'gallery-block',
      type: 'gallery',
      order: order++,
      settings: DEFAULT_SETTINGS,
      content,
    })
  }

  if (videoAssets.length > 0) {
    const primaryVideo = videoAssets[0]
    const content: VideoBlockContent = {
      assetId: primaryVideo.id,
      caption: primaryVideo.description ?? '',
      controls: true,
      autoplay: false,
      loop: false,
      muted: false,
    }

    blocks.push({
      id: `video-${primaryVideo.id}`,
      type: 'video',
      order: order++,
      settings: DEFAULT_SETTINGS,
      content,
    })
  }

  if (project.outcomes) {
    const content: TextBlockContent = {
      title: 'Outcomes & Impact',
      text: project.outcomes,
      style: 'section',
    }

    blocks.push({
      id: 'outcomes-block',
      type: 'text',
      order: order++,
      settings: DEFAULT_SETTINGS,
      content,
    })
  }

  const metrics: MetricsBlockContent['metrics'] = []
  if (project.metrics?.sales) {
    metrics.push({ label: 'Sales Impact', value: project.metrics.sales })
  }
  if (project.metrics?.engagement) {
    metrics.push({ label: 'Engagement', value: project.metrics.engagement })
  }
  if (project.metrics?.other) {
    metrics.push({ label: 'Additional Impact', value: project.metrics.other })
  }

  if (metrics.length > 0) {
    blocks.push({
      id: 'metrics-block',
      type: 'metrics',
      order: order++,
      settings: DEFAULT_SETTINGS,
      content: {
        title: 'Key Metrics',
        metrics,
      },
    })
  }

  if (project.links && project.links.length > 0) {
    const content: LinkBlockContent = {
      title: 'Project Links',
      links: project.links,
    }

    blocks.push({
      id: 'links-block',
      type: 'link',
      order: order++,
      settings: DEFAULT_SETTINGS,
      content,
    })
  }

  if (blocks.length === 0) {
    blocks.push({
      id: 'text-intro',
      type: 'text',
      order: 0,
      settings: DEFAULT_SETTINGS,
      content: {
        title: project.title,
        text: 'Start building your story by adding blocks from the sidebar.',
        style: 'section',
      },
    })
  }

  return blocks
}

const normaliseBlocks = (layout: ProjectLayoutBlock[] | undefined, project: ProjectMeta): ProjectLayoutBlock[] => {
  if (!layout || layout.length === 0) {
    return generateDefaultLayout(project)
  }

  return layout
    .map((block, index) => ({
      ...block,
      id: typeof block.id === 'string' ? block.id : `${block.type}-${index}`,
      order: typeof block.order === 'number' ? block.order : index,
      settings: ensureSettings(block.settings),
      content: { ...block.content },
    }))
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({ ...block, order: index })) as ProjectLayoutBlock[]
}

const reconcileBlocksWithAssets = (blocks: ProjectLayoutBlock[], assets: ProjectAsset[]): ProjectLayoutBlock[] => {
  if (blocks.length === 0) {
    return blocks
  }

  const assetIds = new Set(assets.map(asset => asset.id))
  let mutated = false

  const nextBlocks = blocks.map(block => {
    switch (block.type) {
      case 'hero': {
        const assetId = (block.content as HeroBlockContent).assetId ?? null
        if (assetId && !assetIds.has(assetId)) {
          mutated = true
          return { ...block, content: { ...block.content, assetId: null } as HeroBlockContent }
        }
        return block
      }
      case 'image': {
        const assetId = (block.content as ImageBlockContent).assetId ?? null
        if (assetId && !assetIds.has(assetId)) {
          mutated = true
          return { ...block, content: { ...block.content, assetId: null } as ImageBlockContent }
        }
        return block
      }
      case 'video': {
        const assetId = (block.content as VideoBlockContent).assetId ?? null
        if (assetId && !assetIds.has(assetId)) {
          mutated = true
          return { ...block, content: { ...block.content, assetId: null } as VideoBlockContent }
        }
        return block
      }
      case 'gallery': {
        const gallery = block.content as GalleryBlockContent
        const items = gallery.items.filter(item => !item.assetId || assetIds.has(item.assetId))
        if (items.length !== gallery.items.length) {
          mutated = true
          return { ...block, content: { ...gallery, items } }
        }
        return block
      }
      default:
        return block
    }
  })

  const filtered = nextBlocks.filter(block =>
    block.type !== 'gallery' || (block.content as GalleryBlockContent).items.length > 0,
  )

  return mutated || filtered.length !== blocks.length ? filtered : blocks
}

const createBlock = (
  type: ProjectLayoutBlock['type'],
  order: number,
  project: ProjectMeta,
): ProjectLayoutBlock => {
  switch (type) {
    case 'hero': {
      const imageAssets = project.assets.filter(asset => asset.mimeType.startsWith('image/'))
      const heroAsset =
        (project.cover && imageAssets.find(asset => asset.id === project.cover)) || imageAssets[0] || null

      const content: HeroBlockContent = {
        title: project.title,
        subtitle: project.summary ?? undefined,
        assetId: heroAsset?.id ?? null,
      }

      return {
        id: `hero-${Date.now()}`,
        type: 'hero',
        order,
        settings: { ...DEFAULT_SETTINGS, width: 'full' },
        content,
      }
    }
    case 'text':
      return {
        id: `text-${Date.now()}`,
        type: 'text',
        order,
        settings: DEFAULT_SETTINGS,
        content: {
          title: 'Section Title',
          text: 'Add your content here…',
          style: 'section',
        },
      }
    case 'image': {
      const imageAssets = project.assets.filter(asset => asset.mimeType.startsWith('image/'))
      const defaultAsset = imageAssets[0] ?? null
      const content: ImageBlockContent = {
        assetId: defaultAsset?.id ?? null,
        alt: defaultAsset?.description ?? defaultAsset?.name,
        caption: defaultAsset?.description ?? '',
      }
      return {
        id: `image-${Date.now()}`,
        type: 'image',
        order,
        settings: DEFAULT_SETTINGS,
        content,
      }
    }
    case 'gallery': {
      const imageAssets = project.assets.filter(asset => asset.mimeType.startsWith('image/'))
      const content: GalleryBlockContent = {
        title: 'Gallery',
        items: imageAssets.map(asset => ({ assetId: asset.id, caption: asset.description ?? '' })),
      }
      return {
        id: `gallery-${Date.now()}`,
        type: 'gallery',
        order,
        settings: DEFAULT_SETTINGS,
        content,
      }
    }
    case 'video': {
      const videoAssets = project.assets.filter(asset => asset.mimeType.startsWith('video/'))
      const asset = videoAssets[0] ?? null
      const content: VideoBlockContent = {
        assetId: asset?.id ?? null,
        caption: asset?.description ?? '',
        controls: true,
        autoplay: false,
        loop: false,
        muted: false,
      }
      return {
        id: `video-${Date.now()}`,
        type: 'video',
        order,
        settings: DEFAULT_SETTINGS,
        content,
      }
    }
    case 'metrics': {
      const metrics: MetricsBlockContent = {
        title: 'Metrics',
        metrics: project.metrics
          ? [
              project.metrics.sales && { label: 'Sales Impact', value: project.metrics.sales },
              project.metrics.engagement && { label: 'Engagement', value: project.metrics.engagement },
              project.metrics.other && { label: 'Additional Impact', value: project.metrics.other },
            ].filter(Boolean) as Array<{ label: string; value: string }>
          : [],
      }
      return {
        id: `metrics-${Date.now()}`,
        type: 'metrics',
        order,
        settings: DEFAULT_SETTINGS,
        content: metrics,
      }
    }
    case 'link': {
      const content: LinkBlockContent = {
        title: 'Project Links',
        links: project.links && project.links.length > 0
          ? project.links
          : [{ type: 'website', url: '', label: '' }],
      }
      return {
        id: `link-${Date.now()}`,
        type: 'link',
        order,
        settings: DEFAULT_SETTINGS,
        content,
      }
    }
    default:
      return {
        id: `text-${Date.now()}`,
        type: 'text',
        order,
        settings: DEFAULT_SETTINGS,
        content: {
          title: 'Section Title',
          text: 'Add your content here…',
          style: 'section',
        },
      }
  }
}
export default function ProjectEditor({ project, onUpdateProject }: ProjectEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [showPreview, setShowPreview] = useState(false)
  const [blocks, setBlocks] = useState<ProjectLayoutBlock[]>(() => normaliseBlocks(project.layout, project))
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    () => normaliseBlocks(project.layout, project)[0]?.id ?? null,
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>(null)
  const [exportState, setExportState] = useState<SaveState>(null)
  const [isExporting, setIsExporting] = useState(false)
  const layoutSignature = useRef(JSON.stringify(project.layout ?? []))

  useEffect(() => {
    const signature = JSON.stringify(project.layout ?? [])
    if (signature !== layoutSignature.current) {
      const initial = normaliseBlocks(project.layout, project)
      setBlocks(initial)
      setSelectedBlockId(initial[0]?.id ?? null)
      setHasChanges(false)
      layoutSignature.current = signature
      return
    }

    setBlocks(current => reconcileBlocksWithAssets(current, project.assets))
  }, [project.layout, project.assets, project.slug, project.cover, project.title, project.summary])

  useEffect(() => {
    if (!selectedBlockId && blocks.length > 0) {
      setSelectedBlockId(blocks[0].id)
      return
    }

    if (selectedBlockId && !blocks.some(block => block.id === selectedBlockId)) {
      setSelectedBlockId(blocks[0]?.id ?? null)
    }
  }, [blocks, selectedBlockId])

  useEffect(() => {
    if (!saveState) {
      return
    }

    const timeout = window.setTimeout(() => setSaveState(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [saveState])

  useEffect(() => {
    if (!exportState) {
      return
    }

    const timeout = window.setTimeout(() => setExportState(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [exportState])

  const selectedBlock = useMemo(
    () => blocks.find(block => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  )

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.order - b.order),
    [blocks],
  )

  const handleAddBlock = (type: ProjectLayoutBlock['type']) => {
    setBlocks(current => {
      const next = [...current]
      const newBlock = createBlock(type, next.length, project)
      next.push(newBlock)
      setSelectedBlockId(newBlock.id)
      return next
    })
    setHasChanges(true)
  }

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(current => {
      const filtered = current.filter(block => block.id !== blockId)
      return filtered.map((block, index) => ({ ...block, order: index }))
    })
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null)
    }
    setHasChanges(true)
  }

  const handleUpdateBlock = (blockId: string, updates: Partial<ProjectLayoutBlock>) => {
    setBlocks(current => {
      const mapped = current.map(block =>
        block.id === blockId
          ? {
              ...block,
              ...updates,
              settings: ensureSettings(updates.settings ?? block.settings),
              content: updates.content ? { ...block.content, ...updates.content } : block.content,
            }
          : block,
      )
      return mapped as ProjectLayoutBlock[]
    })
    setHasChanges(true)
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setBlocks(current => {
      if (toIndex < 0 || toIndex >= current.length) {
        return current
      }
      const reordered = [...current]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, moved)
      return reordered.map((block, index) => ({ ...block, order: index }))
    })
    setHasChanges(true)
  }

  const handleResetLayout = () => {
    const initial = normaliseBlocks(project.layout, project)
    setBlocks(initial)
    setSelectedBlockId(initial[0]?.id ?? null)
    setHasChanges(false)
  }

  const handleSaveLayout = async () => {
    if (isSaving || blocks.length === 0) {
      return
    }

    setIsSaving(true)
    const sorted = [...blocks].sort((a, b) => a.order - b.order).map((block, index) => ({
      ...block,
      order: index,
      settings: ensureSettings(block.settings),
    }))

    const heroBlock = sorted.find(block => block.type === 'hero')
    const updates: Partial<ProjectMeta> = {
      layout: sorted,
    }

    if (heroBlock) {
      updates.cover = (heroBlock.content as HeroBlockContent).assetId ?? undefined
    }

    try {
      await onUpdateProject(updates)
      layoutSignature.current = JSON.stringify(sorted)
      setHasChanges(false)
      setSaveState({ type: 'success', message: 'Layout saved.' })
    } catch (error) {
      console.error('Failed to save layout', error)
      setSaveState({ type: 'error', message: 'Unable to save layout changes.' })
    } finally {
      setIsSaving(false)
    }
  }

  const exportAsHTML = () => {
    try {
      const html = generateHTML(blocks, project, project.assets)
      const blob = new Blob([html], { type: 'text/html' })
      downloadBlob(blob, `${project.slug || 'project'}-portfolio.html`)
      setExportState({ type: 'success', message: 'HTML downloaded.' })
    } catch (error) {
      console.error('Failed to export HTML', error)
      setExportState({ type: 'error', message: 'Unable to export HTML.' })
    }
  }

  const exportAsZip = async () => {
    if (isExporting) {
      return
    }

    setIsExporting(true)
    setExportState({ type: 'info', message: 'Preparing ZIP package…' })

    try {
      const blob = await buildProjectZip(blocks, project)
      downloadBlob(blob, `${project.slug || 'project'}-portfolio.zip`)
      setExportState({ type: 'success', message: 'ZIP package downloaded.' })
    } catch (error) {
      console.error('Failed to export ZIP', error)
      setExportState({ type: 'error', message: 'Unable to export ZIP.' })
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsPDF = async () => {
    if (isExporting) {
      return
    }

    setIsExporting(true)
    setExportState({ type: 'info', message: 'Rendering PDF…' })

    try {
      const blob = await buildProjectPdf(blocks, project)
      downloadBlob(blob, `${project.slug || 'project'}-portfolio.pdf`)
      setExportState({ type: 'success', message: 'PDF downloaded.' })
    } catch (error) {
      console.error('Failed to export PDF', error)
      setExportState({ type: 'error', message: 'Unable to export PDF.' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="project-editor">
      <div className="project-editor__toolbar">
        <div className="project-editor__view-controls">
          <button
            type="button"
            className={`project-editor__view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewMode('desktop')}
          >
            <Monitor size={16} />
            Desktop
          </button>
          <button
            type="button"
            className={`project-editor__view-btn ${viewMode === 'tablet' ? 'active' : ''}`}
            onClick={() => setViewMode('tablet')}
          >
            <Tablet size={16} />
            Tablet
          </button>
          <button
            type="button"
            className={`project-editor__view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone size={16} />
            Mobile
          </button>
        </div>

        <div className="project-editor__toolbar-actions">
          {saveState && (
            <span className={`project-editor__status project-editor__status--${saveState.type}`}>
              {saveState.message}
            </span>
          )}
          {!saveState && hasChanges && (
            <span className="project-editor__status project-editor__status--info">Unsaved layout changes</span>
          )}
          {exportState && (
            <span className={`project-editor__status project-editor__status--${exportState.type}`}>
              {exportState.message}
            </span>
          )}

          <button
            type="button"
            className="button button--ghost"
            onClick={() => setShowPreview(previous => !previous)}
          >
            <Eye size={16} />
            {showPreview ? 'Return to editor' : 'Preview layout'}
          </button>

          <button
            type="button"
            className="button button--ghost"
            onClick={handleResetLayout}
            disabled={isSaving || !hasChanges}
          >
            Reset
          </button>

          <button
            type="button"
            className="button button--primary"
            onClick={handleSaveLayout}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? 'Saving…' : 'Save layout'}
          </button>

          <button
            type="button"
            className="button button--ghost"
            onClick={exportAsZip}
            disabled={isExporting}
          >
            <Archive size={16} />
            Export ZIP
          </button>

          <button
            type="button"
            className="button button--ghost"
            onClick={exportAsPDF}
            disabled={isExporting}
          >
            <FileText size={16} />
            Export PDF
          </button>

          <button
            type="button"
            className="button button--ghost"
            onClick={exportAsHTML}
            disabled={isExporting}
          >
            <Download size={16} />
            Export HTML
          </button>
        </div>
      </div>

      <div className="project-editor__layout">
        {!showPreview && (
          <div className="project-editor__sidebar">
            <div className="project-editor__block-library">
              <h3>Add blocks</h3>
              <div className="project-editor__block-buttons">
                <BlockButton icon={Layout} label="Hero" onClick={() => handleAddBlock('hero')} />
                <BlockButton icon={Type} label="Text" onClick={() => handleAddBlock('text')} />
                <BlockButton icon={ImageIcon} label="Image" onClick={() => handleAddBlock('image')} />
                <BlockButton icon={Grid} label="Gallery" onClick={() => handleAddBlock('gallery')} />
                <BlockButton icon={Video} label="Video" onClick={() => handleAddBlock('video')} />
                <BlockButton icon={Settings} label="Metrics" onClick={() => handleAddBlock('metrics')} />
                <BlockButton icon={Link2} label="Links" onClick={() => handleAddBlock('link')} />
              </div>
            </div>

            {selectedBlock && (
              <BlockSettings
                block={selectedBlock}
                assets={project.assets}
                onUpdate={updates => handleUpdateBlock(selectedBlock.id, updates)}
              />
            )}
          </div>
        )}

        <div
          className={`project-editor__canvas project-editor__canvas--${viewMode} ${
            showPreview ? 'project-editor__canvas--preview' : ''
          }`}
        >
          {sortedBlocks.map((block, index) => (
            <BlockRenderer
              key={block.id}
              block={block}
              project={project}
              assets={project.assets}
              isSelected={!showPreview && selectedBlockId === block.id}
              isPreview={showPreview}
              onClick={() => !showPreview && setSelectedBlockId(block.id)}
              onDelete={() => handleDeleteBlock(block.id)}
              onMoveUp={index > 0 ? () => handleReorder(index, index - 1) : undefined}
              onMoveDown={index < sortedBlocks.length - 1 ? () => handleReorder(index, index + 1) : undefined}
            />
          ))}

          {!showPreview && sortedBlocks.length === 0 && (
            <div className="project-editor__empty">
              <p>Start building your project by adding blocks from the sidebar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type BlockButtonProps = {
  icon: typeof Layout
  label: string
  onClick: () => void
}

function BlockButton({ icon: Icon, label, onClick }: BlockButtonProps) {
  return (
    <button type="button" className="project-editor__block-btn" onClick={onClick}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  )
}

type BlockRendererProps = {
  block: ProjectLayoutBlock
  project: ProjectMeta
  assets: ProjectAsset[]
  isSelected: boolean
  isPreview: boolean
  onClick: () => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

function BlockRenderer({
  block,
  project,
  assets,
  isSelected,
  isPreview,
  onClick,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockRendererProps) {
  const blockClass = `project-block project-block--${block.type} project-block--${block.settings.width} project-block--align-${
    block.settings.alignment
  } project-block--padding-${block.settings.padding} ${isSelected ? 'project-block--selected' : ''}`

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    onDelete()
  }

  const handleMoveUp = (event: React.MouseEvent) => {
    event.stopPropagation()
    onMoveUp?.()
  }

  const handleMoveDown = (event: React.MouseEvent) => {
    event.stopPropagation()
    onMoveDown?.()
  }

  return (
    <div className={blockClass} onClick={onClick} style={{ backgroundColor: block.settings.backgroundColor }}>
      {!isPreview && (
        <div className="project-block__controls">
          {onMoveUp && (
            <button type="button" className="project-block__control" onClick={handleMoveUp}>
              ↑
            </button>
          )}
          {onMoveDown && (
            <button type="button" className="project-block__control" onClick={handleMoveDown}>
              ↓
            </button>
          )}
          <button
            type="button"
            className="project-block__control project-block__control--delete"
            onClick={handleDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <BlockContent block={block} project={project} assets={assets} />
    </div>
  )
}

type BlockContentProps = {
  block: ProjectLayoutBlock
  project: ProjectMeta
  assets: ProjectAsset[]
}

function BlockContent({ block, project, assets }: BlockContentProps) {
  switch (block.type) {
    case 'hero': {
      const heroContent = block.content as HeroBlockContent
      const asset = getAssetById(assets, heroContent.assetId)

      return (
        <div className="block-hero">
          {asset ? (
            <img
              src={asset.dataUrl}
              alt={asset.description ?? asset.name ?? project.title}
              className="block-hero__image"
            />
          ) : (
            <div className="block-image__placeholder">
              <ImageIcon size={48} />
              <p>Select an image for your hero section</p>
            </div>
          )}
          <div className="block-hero__content">
            <h1>{heroContent.title || project.title}</h1>
            {heroContent.subtitle && <p className="block-hero__subtitle">{heroContent.subtitle}</p>}
          </div>
        </div>
      )
    }
    case 'text': {
      const textContent = block.content as TextBlockContent
      const paragraphs = textContent.text ? textContent.text.split('\n') : []
      return (
        <div className="block-text">
          {textContent.title && <h2>{textContent.title}</h2>}
          <div className="block-text__content">
            {paragraphs.length > 0
              ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              : <p>Add narrative copy to bring this section to life.</p>}
          </div>
        </div>
      )
    }
    case 'image': {
      const imageContent = block.content as ImageBlockContent
      const asset = getAssetById(assets, imageContent.assetId)
      return (
        <div className="block-image">
          {asset ? (
            <img src={asset.dataUrl} alt={imageContent.alt ?? asset.description ?? asset.name} />
          ) : (
            <div className="block-image__placeholder">
              <ImageIcon size={48} />
              <p>Select an image asset to show here.</p>
            </div>
          )}
          {imageContent.caption && <p className="block-image__caption">{imageContent.caption}</p>}
        </div>
      )
    }
    case 'gallery': {
      const galleryContent = block.content as GalleryBlockContent
      return (
        <div className="block-gallery">
          {galleryContent.title && <h2>{galleryContent.title}</h2>}
          {galleryContent.items.length === 0 ? (
            <div className="project-editor__empty-option">
              <AlertCircle size={16} />
              <span>Add images from your asset library to populate this gallery.</span>
            </div>
          ) : (
            <div className="block-gallery__grid">
              {galleryContent.items.map((item, index) => {
                const asset = getAssetById(assets, item.assetId)
                return (
                  <div key={item.assetId ?? index} className="block-gallery__item">
                    {asset ? (
                      <img src={asset.dataUrl} alt={asset.description ?? asset.name} />
                    ) : (
                      <div className="block-image__placeholder">
                        <ImageIcon size={32} />
                        <p>Missing asset</p>
                      </div>
                    )}
                    {item.caption && <p className="block-gallery__caption">{item.caption}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }
    case 'video': {
      const videoContent = block.content as VideoBlockContent
      const asset = getAssetById(assets, videoContent.assetId)
      return (
        <div className="block-video">
          {asset ? (
            <video
              controls={videoContent.controls ?? true}
              autoPlay={videoContent.autoplay ?? false}
              loop={videoContent.loop ?? false}
              muted={videoContent.muted ?? false}
              playsInline
              poster={asset.thumbnailUrl ?? undefined}
            >
              <source src={asset.dataUrl} type={asset.mimeType} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="block-video__placeholder">
              <Video size={48} />
              <p>Select a video asset to play here.</p>
            </div>
          )}
          {videoContent.caption && <p className="block-video__caption">{videoContent.caption}</p>}
        </div>
      )
    }
    case 'metrics': {
      const metricsContent = block.content as MetricsBlockContent
      return (
        <div className="block-metrics">
          {metricsContent.title && <h2>{metricsContent.title}</h2>}
          {metricsContent.metrics.length === 0 ? (
            <div className="project-editor__empty-option">
              <AlertCircle size={16} />
              <span>Add metrics to highlight the impact of your work.</span>
            </div>
          ) : (
            <div className="block-metrics__grid">
              {metricsContent.metrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`} className="block-metrics__item">
                  <div className="block-metrics__value">{metric.value}</div>
                  <div className="block-metrics__label">{metric.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    case 'link': {
      const linkContent = block.content as LinkBlockContent
      return (
        <div className="block-links">
          {linkContent.title && <h2>{linkContent.title}</h2>}
          {linkContent.links.length === 0 ? (
            <div className="project-editor__empty-option">
              <AlertCircle size={16} />
              <span>Add project links to help visitors explore more.</span>
            </div>
          ) : (
            <div className="block-links__list">
              {linkContent.links.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block-links__item"
                >
                  <Link2 size={16} />
                  {link.label || link.url}
                </a>
              ))}
            </div>
          )}
        </div>
      )
    }
    default:
      return <div>Unsupported block type</div>
  }
}

type BlockSettingsProps = {
  block: ProjectLayoutBlock
  assets: ProjectAsset[]
  onUpdate: (updates: Partial<ProjectLayoutBlock>) => void
}

function BlockSettings({ block, assets, onUpdate }: BlockSettingsProps) {
  const imageAssets = useMemo(
    () => assets.filter(asset => asset.mimeType.startsWith('image/')),
    [assets],
  )
  const videoAssets = useMemo(
    () => assets.filter(asset => asset.mimeType.startsWith('video/')),
    [assets],
  )

  const [gallerySelection, setGallerySelection] = useState('')

  useEffect(() => {
    setGallerySelection('')
  }, [block.id])

  return (
    <div className="project-editor__settings">
      <h3>Block settings</h3>

      <div className="setting-group">
        <label>Width</label>
        <select
          value={block.settings.width}
          onChange={event =>
            onUpdate({ settings: { ...block.settings, width: event.target.value as ProjectBlockSettings['width'] } })
          }
        >
          <option value="full">Full width</option>
          <option value="two-thirds">Two thirds</option>
          <option value="half">Half</option>
          <option value="third">One third</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Alignment</label>
        <select
          value={block.settings.alignment}
          onChange={event =>
            onUpdate({ settings: { ...block.settings, alignment: event.target.value as ProjectBlockSettings['alignment'] } })
          }
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Padding</label>
        <select
          value={block.settings.padding}
          onChange={event =>
            onUpdate({ settings: { ...block.settings, padding: event.target.value as ProjectBlockSettings['padding'] } })
          }
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {block.type === 'hero' && (
        <>
          <div className="setting-group">
            <label>Headline</label>
            <input
              value={(block.content as HeroBlockContent).title ?? ''}
              onChange={event => onUpdate({ content: { ...block.content, title: event.target.value } })}
            />
          </div>

          <div className="setting-group">
            <label>Subheading</label>
            <textarea
              value={(block.content as HeroBlockContent).subtitle ?? ''}
              onChange={event => onUpdate({ content: { ...block.content, subtitle: event.target.value } })}
              placeholder="Summarise the project in one or two sentences"
            />
          </div>

          <div className="setting-group">
            <label>Hero image</label>
            <select
              value={(block.content as HeroBlockContent).assetId ?? ''}
              onChange={event =>
                onUpdate({
                  content: { ...block.content, assetId: event.target.value ? event.target.value : null },
                })
              }
            >
              <option value="">Select an image…</option>
              {imageAssets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
            {imageAssets.length === 0 && (
              <p className="project-editor__helper">Upload image assets to select a hero visual.</p>
            )}
          </div>
        </>
      )}

      {block.type === 'text' && (
        <>
          <div className="setting-group">
            <label>Title</label>
            <input
              value={(block.content as TextBlockContent).title ?? ''}
              onChange={event => onUpdate({ content: { ...block.content, title: event.target.value } })}
            />
          </div>

          <div className="setting-group">
            <label>Copy</label>
            <textarea
              value={(block.content as TextBlockContent).text}
              onChange={event => onUpdate({ content: { ...block.content, text: event.target.value } })}
              placeholder="Tell the story behind this section"
            />
          </div>

          <div className="setting-group">
            <label>Style</label>
            <select
              value={(block.content as TextBlockContent).style ?? 'section'}
              onChange={event =>
                onUpdate({ content: { ...block.content, style: event.target.value as TextBlockContent['style'] } })
              }
            >
              {TEXT_STYLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value ?? 'section'}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {block.type === 'image' && (
        <>
          <div className="setting-group">
            <label>Image asset</label>
            <select
              value={(block.content as ImageBlockContent).assetId ?? ''}
              onChange={event =>
                onUpdate({ content: { ...block.content, assetId: event.target.value || null } })
              }
            >
              <option value="">Select an image…</option>
              {imageAssets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
            {imageAssets.length === 0 && (
              <p className="project-editor__helper">Upload images to showcase visuals inside this block.</p>
            )}
          </div>

          <div className="setting-group">
            <label>Alt text</label>
            <input
              value={(block.content as ImageBlockContent).alt ?? ''}
              onChange={event => onUpdate({ content: { ...block.content, alt: event.target.value } })}
              placeholder="Describe the image for accessibility"
            />
          </div>

          <div className="setting-group">
            <label>Caption</label>
            <textarea
              value={(block.content as ImageBlockContent).caption ?? ''}
              onChange={event => onUpdate({ content: { ...block.content, caption: event.target.value } })}
              placeholder="Add context or credit information"
            />
          </div>
        </>
      )}

      {block.type === 'gallery' && (
        <>
          <div className="setting-group">
            <label>Gallery title</label>
            <input
              value={(block.content as GalleryBlockContent).title ?? ''}
              onChange={event => onUpdate({ content: { ...block.content, title: event.target.value } })}
            />
          </div>

          <div className="setting-group">
            <label>Add image from assets</label>
            <div className="project-editor__inline-field">
              <select
                value={gallerySelection}
                onChange={event => setGallerySelection(event.target.value)}
              >
                <option value="">Select an image…</option>
                {imageAssets.map(asset => (
                  <option
                    key={asset.id}
                    value={asset.id}
                    disabled={(block.content as GalleryBlockContent).items.some(item => item.assetId === asset.id)}
                  >
                    {asset.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => {
                  if (!gallerySelection) {
                    return
                  }
                  const gallery = block.content as GalleryBlockContent
                  onUpdate({
                    content: {
                      ...gallery,
                      items: [...gallery.items, { assetId: gallerySelection, caption: '' }],
                    },
                  })
                  setGallerySelection('')
                }}
                disabled={!gallerySelection}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            {imageAssets.length === 0 && (
              <p className="project-editor__helper">Upload images to populate this gallery.</p>
            )}
          </div>

          <div className="project-editor__gallery-editor">
            {(block.content as GalleryBlockContent).items.length === 0 ? (
              <p className="project-editor__empty-option">No gallery items selected yet.</p>
            ) : (
              (block.content as GalleryBlockContent).items.map((item, index) => {
                const asset = getAssetById(assets, item.assetId)
                return (
                  <div key={item.assetId ?? index} className="project-editor__gallery-item">
                    <div className="project-editor__gallery-thumb">
                      {asset ? (
                        <img src={asset.thumbnailUrl ?? asset.dataUrl} alt={asset.description ?? asset.name} />
                      ) : (
                        <div className="project-editor__gallery-thumb--empty">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div className="project-editor__gallery-fields">
                      <span className="project-editor__gallery-name">{asset?.name ?? 'Missing asset'}</span>
                      <textarea
                        value={item.caption ?? ''}
                        placeholder="Add a caption or credit"
                        onChange={event => {
                          const gallery = block.content as GalleryBlockContent
                          const nextItems = [...gallery.items]
                          nextItems[index] = { ...nextItems[index], caption: event.target.value }
                          onUpdate({ content: { ...gallery, items: nextItems } })
                        }}
                      />
                      <button
                        type="button"
                        className="button button--ghost button--danger"
                        onClick={() => {
                          const gallery = block.content as GalleryBlockContent
                          const nextItems = gallery.items.filter((_, itemIndex) => itemIndex !== index)
                          onUpdate({ content: { ...gallery, items: nextItems } })
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {block.type === 'video' && (
        <>
          <div className="setting-group">
            <label>Video asset</label>
            <select
              value={(block.content as VideoBlockContent).assetId ?? ''}
              onChange={event =>
                onUpdate({ content: { ...block.content, assetId: event.target.value || null } })
              }
            >
              <option value="">Select a video…</option>
              {videoAssets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
            {videoAssets.length === 0 && (
              <p className="project-editor__helper">Upload video assets to showcase motion work.</p>
            )}
          </div>

          <div className="setting-group setting-group--toggles">
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={(block.content as VideoBlockContent).controls ?? true}
                onChange={event => onUpdate({ content: { ...block.content, controls: event.target.checked } })}
              />
              Show controls
            </label>
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={(block.content as VideoBlockContent).autoplay ?? false}
                onChange={event => onUpdate({ content: { ...block.content, autoplay: event.target.checked } })}
              />
              Autoplay
            </label>
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={(block.content as VideoBlockContent).loop ?? false}
                onChange={event => onUpdate({ content: { ...block.content, loop: event.target.checked } })}
              />
              Loop playback
            </label>
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={(block.content as VideoBlockContent).muted ?? false}
                onChange={event => onUpdate({ content: { ...block.content, muted: event.target.checked } })}
              />
              Mute audio
            </label>
          </div>

          <div className="setting-group">
            <label>Caption</label>
            <textarea
              value={(block.content as VideoBlockContent).caption ?? ''}
              onChange={event => onUpdate({ content: { ...block.content, caption: event.target.value } })}
              placeholder="Describe the video context"
            />
          </div>
        </>
      )}

      {block.type === 'metrics' && (
        <div className="setting-group">
          <label>Metrics</label>
          <div className="project-editor__metrics-list">
            {(block.content as MetricsBlockContent).metrics.map((metric, index) => (
              <div key={`${metric.label}-${index}`} className="project-editor__metrics-item">
                <input
                  value={metric.label}
                  placeholder="Label"
                  onChange={event => {
                    const metricsBlock = block.content as MetricsBlockContent
                    const nextMetrics = [...metricsBlock.metrics]
                    nextMetrics[index] = { ...nextMetrics[index], label: event.target.value }
                    onUpdate({ content: { ...metricsBlock, metrics: nextMetrics } })
                  }}
                />
                <input
                  value={metric.value}
                  placeholder="Value"
                  onChange={event => {
                    const metricsBlock = block.content as MetricsBlockContent
                    const nextMetrics = [...metricsBlock.metrics]
                    nextMetrics[index] = { ...nextMetrics[index], value: event.target.value }
                    onUpdate({ content: { ...metricsBlock, metrics: nextMetrics } })
                  }}
                />
                <button
                  type="button"
                  className="button button--ghost button--danger"
                  onClick={() => {
                    const metricsBlock = block.content as MetricsBlockContent
                    const nextMetrics = metricsBlock.metrics.filter((_, itemIndex) => itemIndex !== index)
                    onUpdate({ content: { ...metricsBlock, metrics: nextMetrics } })
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => {
                const metricsBlock = block.content as MetricsBlockContent
                onUpdate({
                  content: {
                    ...metricsBlock,
                    metrics: [...metricsBlock.metrics, { label: 'Metric label', value: 'Value' }],
                  },
                })
              }}
            >
              <Plus size={16} />
              Add metric
            </button>
          </div>
        </div>
      )}

      {block.type === 'link' && (
        <div className="setting-group">
          <label>Links</label>
          <div className="project-editor__links-list">
            {(block.content as LinkBlockContent).links.map((link, index) => (
              <div key={`${link.url}-${index}`} className="project-editor__links-item">
                <select
                  value={link.type}
                  onChange={event => {
                    const linkBlock = block.content as LinkBlockContent
                    const nextLinks = [...linkBlock.links]
                    nextLinks[index] = { ...nextLinks[index], type: event.target.value as ProjectLink['type'] }
                    onUpdate({ content: { ...linkBlock, links: nextLinks } })
                  }}
                >
                  {LINK_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={link.label ?? ''}
                  placeholder="Label"
                  onChange={event => {
                    const linkBlock = block.content as LinkBlockContent
                    const nextLinks = [...linkBlock.links]
                    nextLinks[index] = { ...nextLinks[index], label: event.target.value }
                    onUpdate({ content: { ...linkBlock, links: nextLinks } })
                  }}
                />
                <input
                  value={link.url}
                  placeholder="https://example.com"
                  onChange={event => {
                    const linkBlock = block.content as LinkBlockContent
                    const nextLinks = [...linkBlock.links]
                    nextLinks[index] = { ...nextLinks[index], url: event.target.value }
                    onUpdate({ content: { ...linkBlock, links: nextLinks } })
                  }}
                />
                <button
                  type="button"
                  className="button button--ghost button--danger"
                  onClick={() => {
                    const linkBlock = block.content as LinkBlockContent
                    const nextLinks = linkBlock.links.filter((_, itemIndex) => itemIndex !== index)
                    onUpdate({ content: { ...linkBlock, links: nextLinks } })
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => {
                const linkBlock = block.content as LinkBlockContent
                onUpdate({
                  content: {
                    ...linkBlock,
                    links: [...linkBlock.links, { type: 'website', url: '', label: '' }],
                  },
                })
              }}
            >
              <Plus size={16} />
              Add link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type GenerateHtmlOptions = {
  assetPathResolver?: (asset: ProjectAsset) => string
}

function generateHTML(
  blocks: ProjectLayoutBlock[],
  project: ProjectMeta,
  assets: ProjectAsset[],
  options: GenerateHtmlOptions = {},
): string {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  const resolveAssetUrl = (asset: ProjectAsset | null): string | null => {
    if (!asset) {
      return null
    }
    if (options.assetPathResolver) {
      return options.assetPathResolver(asset)
    }
    return asset.dataUrl
  }

  const blockHTML = sortedBlocks
    .map(block => {
      const settings = ensureSettings(block.settings)
      const classes = `block block--${block.type} block--${settings.width} block--align-${settings.alignment} block--padding-${settings.padding}`
      const style = settings.backgroundColor && settings.backgroundColor !== 'transparent'
        ? ` style="background-color: ${settings.backgroundColor};"`
        : ''

      const render = () => {
        switch (block.type) {
          case 'hero': {
            const content = block.content as HeroBlockContent
            const asset = getAssetById(assets, content.assetId)
            const assetUrl = resolveAssetUrl(asset)
            return `
              <div class="block-hero">
                ${assetUrl ? `<img src="${assetUrl}" alt="${asset?.description ?? asset?.name ?? project.title}" class="block-hero__image" />` : ''}
                <div class="block-hero__content">
                  <h1>${content.title || project.title}</h1>
                  ${content.subtitle ? `<p class="block-hero__subtitle">${content.subtitle}</p>` : ''}
                </div>
              </div>
            `
          }
          case 'text': {
            const content = block.content as TextBlockContent
            const paragraphs = content.text
              ? content.text.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')
              : '<p>Add narrative copy to bring this section to life.</p>'
            return `
              <div class="block-text">
                ${content.title ? `<h2>${content.title}</h2>` : ''}
                <div class="block-text__content">${paragraphs}</div>
              </div>
            `
          }
          case 'image': {
            const content = block.content as ImageBlockContent
            const asset = getAssetById(assets, content.assetId)
            const assetUrl = resolveAssetUrl(asset)
            return `
              <div class="block-image">
                ${assetUrl ? `<img src="${assetUrl}" alt="${content.alt ?? asset?.description ?? asset?.name}" />` : ''}
                ${content.caption ? `<p class="block-image__caption">${content.caption}</p>` : ''}
              </div>
            `
          }
          case 'gallery': {
            const content = block.content as GalleryBlockContent
            const items = content.items
              .map(item => {
                const asset = getAssetById(assets, item.assetId)
                const assetUrl = resolveAssetUrl(asset)
                if (!assetUrl) {
                  return ''
                }
                return `
                  <div class="block-gallery__item">
                    <img src="${assetUrl}" alt="${asset?.description ?? asset?.name}" />
                    ${item.caption ? `<p class="block-gallery__caption">${item.caption}</p>` : ''}
                  </div>
                `
              })
              .join('')
            return `
              <div class="block-gallery">
                ${content.title ? `<h2>${content.title}</h2>` : ''}
                <div class="block-gallery__grid">${items}</div>
              </div>
            `
          }
          case 'video': {
            const content = block.content as VideoBlockContent
            const asset = getAssetById(assets, content.assetId)
            const sourceUrl = resolveAssetUrl(asset)
            const attributes = [
              (content.controls ?? true) ? 'controls' : '',
              content.autoplay ? 'autoplay' : '',
              content.loop ? 'loop' : '',
              content.muted ? 'muted' : '',
              'playsinline',
              asset?.thumbnailUrl ? `poster="${asset.thumbnailUrl}"` : '',
            ]
              .filter(Boolean)
              .join(' ')
            return `
              <div class="block-video">
                ${sourceUrl ? `
                  <video ${attributes}>
                    <source src="${sourceUrl}" type="${asset?.mimeType ?? ''}" />
                    Your browser does not support the video tag.
                  </video>
                ` : ''}
                ${content.caption ? `<p class="block-video__caption">${content.caption}</p>` : ''}
              </div>
            `
          }
          case 'metrics': {
            const content = block.content as MetricsBlockContent
            const metrics = content.metrics
              .map(metric => `
                <div class="block-metrics__item">
                  <div class="block-metrics__value">${metric.value}</div>
                  <div class="block-metrics__label">${metric.label}</div>
                </div>
              `)
              .join('')
            return `
              <div class="block-metrics">
                ${content.title ? `<h2>${content.title}</h2>` : ''}
                <div class="block-metrics__grid">${metrics}</div>
              </div>
            `
          }
          case 'link': {
            const content = block.content as LinkBlockContent
            const links = content.links
              .map(link => `
                <a class="block-links__item" href="${link.url}" target="_blank" rel="noopener noreferrer">
                  ${link.label || link.url}
                </a>
              `)
              .join('')
            return `
              <div class="block-links">
                ${content.title ? `<h2>${content.title}</h2>` : ''}
                <div class="block-links__list">${links}</div>
              </div>
            `
          }
          default:
            return ''
        }
      }

      return `<div class="${classes}"${style}>${render()}</div>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.title} - Portfolio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 2rem; line-height: 1.6; background: #f3f4f6; }
    .block { margin-bottom: 2rem; background: #ffffff; border-radius: 12px; padding: 2rem; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15); }
    .block--full { width: 100%; }
    .block--two-thirds { width: 66.666%; }
    .block--half { width: 50%; }
    .block--third { width: 33.333%; }
    .block--align-center { margin-left: auto; margin-right: auto; }
    .block--align-right { margin-left: auto; margin-right: 0; }
    .block-hero { position: relative; overflow: hidden; border-radius: 12px; }
    .block-hero__image { width: 100%; height: 360px; object-fit: cover; }
    .block-hero__content { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem; background: linear-gradient(transparent, rgba(0,0,0,0.75)); color: white; }
    .block-hero__content h1 { margin: 0; font-size: 2.75rem; }
    .block-hero__subtitle { margin: 0.75rem 0 0; font-size: 1.125rem; }
    .block-text h2, .block-gallery h2, .block-metrics h2, .block-links h2 { margin: 0 0 1rem; font-size: 1.75rem; }
    .block-text__content p { margin: 0 0 1rem; color: #374151; }
    .block-image img { max-width: 100%; border-radius: 10px; }
    .block-image__caption { margin-top: 0.75rem; font-size: 0.9rem; color: #6b7280; font-style: italic; }
    .block-video video { width: 100%; border-radius: 12px; background: #111827; }
    .block-video__caption { margin-top: 0.75rem; font-size: 0.9rem; color: #6b7280; }
    .block-gallery__grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .block-gallery__item img { width: 100%; height: 220px; object-fit: cover; border-radius: 10px; }
    .block-gallery__caption { margin-top: 0.5rem; font-size: 0.85rem; color: #6b7280; }
    .block-metrics__grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    .block-metrics__item { background: #f9fafb; padding: 1.5rem; border-radius: 12px; text-align: center; }
    .block-metrics__value { font-size: 2rem; font-weight: 700; color: #2563eb; margin-bottom: 0.5rem; }
    .block-links__list { display: flex; flex-wrap: wrap; gap: 1rem; }
    .block-links__item { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 999px; background: #eff6ff; color: #1d4ed8; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  ${blockHTML}
</body>
</html>`
}

async function buildProjectZip(blocks: ProjectLayoutBlock[], project: ProjectMeta): Promise<Blob> {
  const normalisedBlocks = [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({
      ...block,
      order: index,
      settings: ensureSettings(block.settings),
    }))

  const assetFileMap = buildAssetFileMap(project.assets)
  const assetPathResolver = (asset: ProjectAsset) => `assets/${assetFileMap.get(asset.id) ?? createFallbackAssetName(asset)}`

  const html = generateHTML(normalisedBlocks, project, project.assets, { assetPathResolver })
  const manifest = buildProjectManifest(project, normalisedBlocks, assetFileMap)

  const encoder = new TextEncoder()
  const safeSlug = sanitizeForFileName(project.slug || project.title || 'project') || 'project'

  const entries: ZipEntry[] = [
    { path: `${safeSlug}/index.html`, data: encoder.encode(html) },
    { path: `${safeSlug}/project.json`, data: encoder.encode(JSON.stringify(manifest, null, 2)) },
  ]

  project.assets.forEach((asset, index) => {
    const fileName = assetFileMap.get(asset.id) ?? createFallbackAssetName(asset, index)
    const data = dataUrlToUint8Array(asset.dataUrl)
    entries.push({ path: `${safeSlug}/assets/${fileName}`, data })
  })

  const zipBytes = createZipArchive(entries)
  const buffer = toArrayBuffer(zipBytes)
  return new Blob([buffer], { type: 'application/zip' })
}

async function buildProjectPdf(blocks: ProjectLayoutBlock[], project: ProjectMeta): Promise<Blob> {
  const normalisedBlocks = [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({ ...block, order: index }))

  const pdfBytes = createProjectPdf(project, normalisedBlocks)
  const buffer = toArrayBuffer(pdfBytes)
  return new Blob([buffer], { type: 'application/pdf' })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

type ZipEntry = { path: string; data: Uint8Array }

function createZipArchive(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder()
  const localSegments: Uint8Array[] = []
  const centralSegments: Uint8Array[] = []
  let offset = 0
  const now = new Date()
  const { time: dosTime, date: dosDate } = getDosDateTime(now)

  entries.forEach(entry => {
    const fileNameBytes = encoder.encode(entry.path)
    const data = entry.data
    const crc = crc32(data)

    const localHeader = new Uint8Array(30 + fileNameBytes.length)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, dosTime, true)
    localView.setUint16(12, dosDate, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, data.length, true)
    localView.setUint32(22, data.length, true)
    localView.setUint16(26, fileNameBytes.length, true)
    localView.setUint16(28, 0, true)
    localHeader.set(fileNameBytes, 30)

    localSegments.push(localHeader, data)

    const centralHeader = new Uint8Array(46 + fileNameBytes.length)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 0x0314, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0, true)
    centralView.setUint16(10, 0, true)
    centralView.setUint16(12, dosTime, true)
    centralView.setUint16(14, dosDate, true)
    centralView.setUint32(16, crc, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, fileNameBytes.length, true)
    centralView.setUint16(30, 0, true)
    centralView.setUint16(32, 0, true)
    centralView.setUint16(34, 0, true)
    centralView.setUint16(36, 0, true)
    centralView.setUint32(38, 0, true)
    centralView.setUint32(42, offset, true)
    centralHeader.set(fileNameBytes, 46)

    centralSegments.push(centralHeader)
    offset += localHeader.length + data.length
  })

  const centralSize = centralSegments.reduce((sum, segment) => sum + segment.length, 0)
  const endRecord = new Uint8Array(22)
  const endView = new DataView(endRecord.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true)
  endView.setUint16(6, 0, true)
  endView.setUint16(8, entries.length, true)
  endView.setUint16(10, entries.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)
  endView.setUint16(20, 0, true)

  return concatUint8Arrays([...localSegments, ...centralSegments, endRecord])
}

function getDosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear())
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  return { time: dosTime & 0xffff, date: dosDate & 0xffff }
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let crc = i
    for (let j = 0; j < 8; j += 1) {
      if ((crc & 1) === 1) {
        crc = 0xedb88320 ^ (crc >>> 1)
      } else {
        crc >>>= 1
      }
    }
    table[i] = crc >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i += 1) {
    const byte = data[i]
    const index = (crc ^ byte) & 0xff
    crc = (CRC32_TABLE[index] ^ (crc >>> 8)) >>> 0
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex === -1) {
    return new Uint8Array()
  }
  const meta = dataUrl.slice(0, commaIndex)
  const data = dataUrl.slice(commaIndex + 1)
  if (meta.includes(';base64')) {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  return new TextEncoder().encode(decodeURIComponent(data))
}

function sanitizeForFileName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildAssetFileMap(assets: ProjectAsset[]): Map<string, string> {
  const usedNames = new Map<string, number>()
  const fileMap = new Map<string, string>()

  assets.forEach((asset, index) => {
    const fileName = getAssetFileName(asset, index, usedNames)
    fileMap.set(asset.id, fileName)
  })

  return fileMap
}

function createFallbackAssetName(asset: ProjectAsset, index = 0): string {
  const base = sanitizeForFileName(
    asset.name?.replace(/\.[^.]+$/, '') ?? `${asset.mimeType.split('/')[0] ?? 'asset'}-${index + 1}`,
  )
  const extension = guessAssetExtension(asset)
  if (extension) {
    return `${base || 'asset'}-${index + 1}.${extension}`
  }
  return `${base || 'asset'}-${index + 1}`
}

function getAssetFileName(asset: ProjectAsset, index: number, usedNames: Map<string, number>): string {
  const baseName = sanitizeForFileName(
    asset.name ? asset.name.replace(/\.[^.]+$/, '') : `${asset.mimeType.split('/')[0] ?? 'asset'}-${index + 1}`,
  )
  const extension = guessAssetExtension(asset)
  const base = baseName || `asset-${index + 1}`
  const initial = extension ? `${base}.${extension}` : base

  if (!usedNames.has(initial)) {
    usedNames.set(initial, 1)
    return initial
  }

  let counter = usedNames.get(initial) ?? 1
  counter += 1
  usedNames.set(initial, counter)
  const candidate = extension ? `${base}-${counter}.${extension}` : `${base}-${counter}`
  usedNames.set(candidate, 1)
  return candidate
}

function guessAssetExtension(asset: ProjectAsset): string {
  if (asset.name && asset.name.includes('.')) {
    const ext = asset.name.split('.').pop()
    if (ext) {
      return sanitizeForFileName(ext)
    }
  }
  const slashIndex = asset.mimeType.indexOf('/')
  if (slashIndex >= 0) {
    const subtype = asset.mimeType.slice(slashIndex + 1).split(';')[0]
    return sanitizeForFileName(subtype)
  }
  return ''
}

function buildProjectManifest(
  project: ProjectMeta,
  layout: ProjectLayoutBlock[],
  assetFileMap: Map<string, string>,
) {
  return {
    project: {
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      problem: project.problem,
      solution: project.solution,
      outcomes: project.outcomes,
      tags: project.tags,
      technologies: project.technologies,
      status: project.status,
      role: project.role,
      collaborators: project.collaborators,
      timeframe: project.timeframe,
      links: project.links,
      metrics: project.metrics,
      cover: project.cover,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    layout,
    assets: project.assets.map((asset, index) => ({
      id: asset.id,
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size,
      addedAt: asset.addedAt,
      description: asset.description,
      isHeroImage: asset.isHeroImage,
      thumbnailUrl: asset.thumbnailUrl ?? null,
      file: `assets/${assetFileMap.get(asset.id) ?? createFallbackAssetName(asset, index)}`,
    })),
  }
}

function createProjectPdf(project: ProjectMeta, blocks: ProjectLayoutBlock[]): Uint8Array {
  const lines = buildPdfLines(project, blocks)
  const margin = 54
  const lineHeight = 16
  const pageHeight = 842
  const linesPerPage = Math.max(1, Math.floor((pageHeight - margin * 2) / lineHeight))
  const pages = paginateLines(lines, linesPerPage)
  const encoder = new TextEncoder()

  type PdfObject = { id: number; data: Uint8Array }
  const objects: PdfObject[] = []
  let nextId = 1

  const fontId = nextId++
  const pagesId = nextId++
  const catalogId = nextId++

  const fontObject = buildStandardPdfObject(fontId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', encoder)
  objects.push({ id: fontId, data: fontObject })

  const pageIds: number[] = []

  pages.forEach(pageLines => {
    const contentId = nextId++
    const contentStream = buildPdfContentStream(pageLines, lineHeight, margin)
    const contentObject = buildPdfStreamObject(contentId, contentStream, encoder)
    objects.push({ id: contentId, data: contentObject })

    const pageId = nextId++
    pageIds.push(pageId)
    const pageContent = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`
    const pageObject = buildStandardPdfObject(pageId, pageContent, encoder)
    objects.push({ id: pageId, data: pageObject })
  })

  const kids = pageIds.map(id => `${id} 0 R`).join(' ')
  const pagesObject = buildStandardPdfObject(
    pagesId,
    `<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`,
    encoder,
  )
  objects.push({ id: pagesId, data: pagesObject })

  const catalogObject = buildStandardPdfObject(
    catalogId,
    `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
    encoder,
  )
  objects.push({ id: catalogId, data: catalogObject })

  objects.sort((a, b) => a.id - b.id)

  const header = encoder.encode('%PDF-1.4\n')
  const segments: Uint8Array[] = [header]
  const offsets = new Array<number>(nextId).fill(0)
  let position = header.length

  objects.forEach(object => {
    offsets[object.id] = position
    segments.push(object.data)
    position += object.data.length
  })

  const xrefStart = position
  let xref = `xref\n0 ${nextId}\n0000000000 65535 f \n`
  for (let id = 1; id < nextId; id += 1) {
    const offset = offsets[id] ?? 0
    xref += `${offset.toString().padStart(10, '0')} 00000 n \n`
  }
  const xrefBytes = encoder.encode(xref)

  const trailer = `trailer\n<< /Size ${nextId} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  const trailerBytes = encoder.encode(trailer)

  segments.push(xrefBytes, trailerBytes)
  return concatUint8Arrays(segments)
}

function buildStandardPdfObject(id: number, content: string, encoder: TextEncoder): Uint8Array {
  return encoder.encode(`${id} 0 obj\n${content}\nendobj\n`)
}

function buildPdfStreamObject(id: number, content: string, encoder: TextEncoder): Uint8Array {
  const streamBytes = encoder.encode(content)
  const header = encoder.encode(`${id} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`)
  const footer = encoder.encode('\nendstream\nendobj\n')
  return concatUint8Arrays([header, streamBytes, footer])
}

function buildPdfContentStream(lines: string[], lineHeight: number, margin: number): string {
  const startX = margin
  const startY = 842 - margin
  const commands = ['BT', '/F1 12 Tf', `${lineHeight} TL`, `${startX} ${startY} Td`]

  lines.forEach((line, index) => {
    if (index === 0) {
      commands.push(`(${escapePdfText(line)}) Tj`)
    } else {
      commands.push('T*')
      commands.push(`(${escapePdfText(line)}) Tj`)
    }
  })

  commands.push('ET')
  return commands.join('\n')
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdfLines(project: ProjectMeta, blocks: ProjectLayoutBlock[]): string[] {
  const lines: string[] = []
  const addBlank = () => {
    if (lines.length === 0 || lines[lines.length - 1] === '') {
      return
    }
    lines.push('')
  }

  lines.push(project.title || 'Untitled project')

  if (project.summary) {
    addBlank()
    wrapMultilineText(project.summary).forEach(textLine => lines.push(textLine))
  }

  const statusLabel = projectStatusLabels[project.status] ?? project.status
  const roleLabel = projectRoleLabels[project.role] ?? project.role
  addBlank()
  lines.push(`Status: ${statusLabel} • Role: ${roleLabel}`)

  if (project.tags?.length) {
    lines.push(`Tags: ${project.tags.join(', ')}`)
  }

  if (project.technologies?.length) {
    lines.push(`Technologies: ${project.technologies.join(', ')}`)
  }

  if (project.timeframe) {
    const timeframeParts: string[] = []
    if (project.timeframe.start) timeframeParts.push(`Start ${project.timeframe.start}`)
    if (project.timeframe.end) timeframeParts.push(`End ${project.timeframe.end}`)
    if (project.timeframe.duration) timeframeParts.push(`Duration ${project.timeframe.duration}`)
    if (timeframeParts.length > 0) {
      lines.push(`Timeframe: ${timeframeParts.join(' • ')}`)
    }
  }

  if (project.collaborators?.length) {
    addBlank()
    lines.push('Collaborators:')
    project.collaborators.forEach(collaborator => {
      const details = [collaborator.role, collaborator.company].filter(Boolean).join(', ')
      lines.push(`  - ${collaborator.name}${details ? ` (${details})` : ''}`)
    })
  }

  if (project.links?.length) {
    addBlank()
    lines.push('Links:')
    project.links.forEach(link => {
      lines.push(`  - ${(link.label || link.url)}: ${link.url}`)
    })
  }

  const appendSection = (title: string, content?: string) => {
    if (!content) {
      return
    }
    addBlank()
    lines.push(title)
    wrapMultilineText(content).forEach(textLine => {
      if (textLine === '') {
        lines.push('')
      } else {
        lines.push(`  ${textLine}`)
      }
    })
  }

  appendSection('Problem', project.problem)
  appendSection('Solution', project.solution)
  appendSection('Outcomes', project.outcomes)

  if (project.metrics) {
    const metricLines: string[] = []
    if (project.metrics.sales) metricLines.push(`Sales impact: ${project.metrics.sales}`)
    if (project.metrics.engagement) metricLines.push(`Engagement: ${project.metrics.engagement}`)
    if (project.metrics.other) metricLines.push(`Additional impact: ${project.metrics.other}`)

    if (metricLines.length > 0 || (project.metrics.awards && project.metrics.awards.length > 0)) {
      addBlank()
      lines.push('Impact metrics')
      metricLines.forEach(metric => {
        wrapMultilineText(metric).forEach(textLine => {
          lines.push(textLine ? `  ${textLine}` : '')
        })
      })
      if (project.metrics.awards && project.metrics.awards.length > 0) {
        lines.push('  Awards:')
        project.metrics.awards.forEach(award => {
          lines.push(`    - ${award}`)
        })
      }
    }
  }

  addBlank()
  lines.push('Layout overview')
  const assetMap = new Map(project.assets.map(asset => [asset.id, asset]))

  blocks.forEach((block, blockIndex) => {
    lines.push(`Block ${blockIndex + 1}: ${block.type}`)
    switch (block.type) {
      case 'hero': {
        const content = block.content as HeroBlockContent
        if (content.title) {
          lines.push(`  Title: ${content.title}`)
        }
        if (content.subtitle) {
          wrapMultilineText(content.subtitle).forEach(textLine => {
            lines.push(textLine ? `  ${textLine}` : '')
          })
        }
        if (content.assetId) {
          const asset = assetMap.get(content.assetId)
          lines.push(`  Hero asset: ${asset?.name ?? content.assetId}`)
        }
        break
      }
      case 'text': {
        const content = block.content as TextBlockContent
        if (content.title) {
          lines.push(`  Heading: ${content.title}`)
        }
        wrapMultilineText(content.text).forEach(textLine => {
          lines.push(textLine ? `  ${textLine}` : '')
        })
        break
      }
      case 'image': {
        const content = block.content as ImageBlockContent
        if (content.assetId) {
          const asset = assetMap.get(content.assetId)
          lines.push(`  Image: ${asset?.name ?? content.assetId}`)
        }
        if (content.caption) {
          wrapMultilineText(content.caption).forEach(textLine => {
            lines.push(textLine ? `  ${textLine}` : '')
          })
        }
        break
      }
      case 'gallery': {
        const content = block.content as GalleryBlockContent
        if (content.title) {
          lines.push(`  Title: ${content.title}`)
        }
        content.items.forEach((item, itemIndex) => {
          const asset = item.assetId ? assetMap.get(item.assetId) : null
          const caption = item.caption ? ` — ${item.caption}` : ''
          lines.push(`    • Item ${itemIndex + 1}: ${asset?.name ?? item.assetId ?? 'Unassigned'}${caption}`)
        })
        break
      }
      case 'video': {
        const content = block.content as VideoBlockContent
        if (content.assetId) {
          const asset = assetMap.get(content.assetId)
          lines.push(`  Video: ${asset?.name ?? content.assetId}`)
        }
        if (content.caption) {
          wrapMultilineText(content.caption).forEach(textLine => {
            lines.push(textLine ? `  ${textLine}` : '')
          })
        }
        break
      }
      case 'metrics': {
        const content = block.content as MetricsBlockContent
        if (content.title) {
          lines.push(`  Title: ${content.title}`)
        }
        content.metrics.forEach(metric => {
          lines.push(`  - ${metric.label}: ${metric.value}`)
        })
        break
      }
      case 'link': {
        const content = block.content as LinkBlockContent
        if (content.title) {
          lines.push(`  Title: ${content.title}`)
        }
        content.links.forEach(link => {
          lines.push(`  - ${(link.label || link.url)}: ${link.url}`)
        })
        break
      }
      default:
        break
    }
    addBlank()
  })

  addBlank()
  lines.push(`Assets included: ${project.assets.length}`)
  project.assets.forEach((asset, index) => {
    const sizeKB = asset.size ? ` (${Math.max(1, Math.round(asset.size / 1024))} KB)` : ''
    lines.push(`  ${index + 1}. ${asset.name || asset.id}${sizeKB}`)
  })

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  if (lines.length === 0) {
    lines.push('Portfolio export generated from the editor.')
  }

  return lines
}

function wrapMultilineText(text: string, maxLength = 90): string[] {
  const paragraphs = text.split(/\r?\n/)
  const lines: string[] = []

  paragraphs.forEach((paragraph, index) => {
    const trimmed = paragraph.trim()
    if (trimmed.length === 0) {
      if (lines.length === 0 || lines[lines.length - 1] === '') {
        return
      }
      lines.push('')
      return
    }

    const wrapped = wrapText(trimmed, maxLength)
    wrapped.forEach(line => lines.push(line))
    if (index < paragraphs.length - 1) {
      lines.push('')
    }
  })

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines
}

function wrapText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text]
  }

  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  words.forEach(word => {
    if (!word) {
      return
    }
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxLength) {
      if (current) {
        lines.push(current)
        current = word
      } else {
        chunkWord(word, maxLength).forEach((chunk, index, arr) => {
          if (index === arr.length - 1) {
            current = chunk
          } else {
            lines.push(chunk)
          }
        })
      }
    } else {
      current = candidate
    }
  })

  if (current) {
    lines.push(current)
  }

  return lines
}

function chunkWord(word: string, maxLength: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < word.length; i += maxLength) {
    chunks.push(word.slice(i, i + maxLength))
  }
  return chunks
}

function paginateLines(lines: string[], linesPerPage: number): string[][] {
  if (lines.length === 0) {
    return [['Portfolio export generated from the editor.']]
  }

  const pages: string[][] = []
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage))
  }
  return pages
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const candidate = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  if (candidate instanceof ArrayBuffer) {
    return candidate
  }
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0)
  const result = new Uint8Array(totalLength)
  let pointer = 0
  arrays.forEach(array => {
    result.set(array, pointer)
    pointer += array.length
  })
  return result
}

