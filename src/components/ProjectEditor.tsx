import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Download,
  Eye,
  Grid,
  Image as ImageIcon,
  Layout,
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
    const html = generateHTML(blocks, project, project.assets)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${project.slug}-portfolio.html`
    link.click()
    URL.revokeObjectURL(url)
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

          <button type="button" className="button button--ghost" onClick={exportAsHTML}>
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

function generateHTML(blocks: ProjectLayoutBlock[], project: ProjectMeta, assets: ProjectAsset[]): string {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

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
            return `
              <div class="block-hero">
                ${asset ? `<img src="${asset.dataUrl}" alt="${asset.description ?? asset.name ?? project.title}" class="block-hero__image" />` : ''}
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
            return `
              <div class="block-image">
                ${asset ? `<img src="${asset.dataUrl}" alt="${content.alt ?? asset.description ?? asset.name}" />` : ''}
                ${content.caption ? `<p class="block-image__caption">${content.caption}</p>` : ''}
              </div>
            `
          }
          case 'gallery': {
            const content = block.content as GalleryBlockContent
            const items = content.items
              .map(item => {
                const asset = getAssetById(assets, item.assetId)
                if (!asset) {
                  return ''
                }
                return `
                  <div class="block-gallery__item">
                    <img src="${asset.dataUrl}" alt="${asset.description ?? asset.name}" />
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
                ${asset ? `
                  <video ${attributes}>
                    <source src="${asset.dataUrl}" type="${asset.mimeType}" />
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
