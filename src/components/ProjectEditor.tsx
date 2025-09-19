import React, { useState, useRef } from 'react'
import { 
  Eye, 
  Download, 
  Layout, 
  Image, 
  Type, 
  Link2, 
  Grid, 
  Move,
  Trash2,
  Plus,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Video
} from 'lucide-react'
import type { ProjectMeta, ProjectAsset } from '../intake/schema'

export type LayoutBlock = {
  id: string
  type: 'hero' | 'text' | 'image' | 'gallery' | 'video' | 'link' | 'metrics' | 'spacer'
  content: any
  order: number
  settings: {
    width?: 'full' | 'half' | 'third' | 'two-thirds'
    alignment?: 'left' | 'center' | 'right'
    padding?: 'none' | 'small' | 'medium' | 'large'
    backgroundColor?: string
  }
}

type ProjectEditorProps = {
  project: ProjectMeta
  onUpdateProject: (updates: Partial<ProjectMeta>) => Promise<void>
}

type ViewMode = 'desktop' | 'tablet' | 'mobile'

const defaultBlockSettings = {
  width: 'full' as const,
  alignment: 'left' as const,
  padding: 'medium' as const,
  backgroundColor: 'transparent'
}

export default function ProjectEditor({ project, onUpdateProject }: ProjectEditorProps) {
  const [blocks, setBlocks] = useState<LayoutBlock[]>(() => {
    // Initialize with default blocks based on project data
    const initialBlocks: LayoutBlock[] = []
    
    // Hero block
    if (project.cover) {
      const heroAsset = project.assets.find(a => a.id === project.cover)
      if (heroAsset) {
        initialBlocks.push({
          id: 'hero-1',
          type: 'hero',
          content: {
            title: project.title,
            subtitle: project.summary,
            imageUrl: heroAsset.dataUrl,
            imageAlt: heroAsset.description || project.title
          },
          order: 0,
          settings: { ...defaultBlockSettings, width: 'full' }
        })
      }
    }
    
    // Problem statement
    if (project.problem) {
      initialBlocks.push({
        id: 'text-problem',
        type: 'text',
        content: {
          title: 'The Problem',
          text: project.problem,
          style: 'section'
        },
        order: 1,
        settings: defaultBlockSettings
      })
    }
    
    // Solution
    if (project.solution) {
      initialBlocks.push({
        id: 'text-solution',
        type: 'text',
        content: {
          title: 'The Solution',
          text: project.solution,
          style: 'section'
        },
        order: 2,
        settings: defaultBlockSettings
      })
    }
    
    // Gallery of remaining assets
    const galleryAssets = project.assets.filter(a => a.id !== project.cover)
    if (galleryAssets.length > 0) {
      initialBlocks.push({
        id: 'gallery-1',
        type: 'gallery',
        content: {
          title: 'Project Gallery',
          images: galleryAssets.map(asset => ({
            url: asset.dataUrl,
            alt: asset.description || asset.name,
            caption: asset.description
          }))
        },
        order: 3,
        settings: defaultBlockSettings
      })
    }
    
    // Outcomes
    if (project.outcomes) {
      initialBlocks.push({
        id: 'text-outcomes',
        type: 'text',
        content: {
          title: 'Outcomes & Impact',
          text: project.outcomes,
          style: 'section'
        },
        order: 4,
        settings: defaultBlockSettings
      })
    }
    
    // Metrics
    if (project.metrics && (project.metrics.sales || project.metrics.engagement || project.metrics.other)) {
      initialBlocks.push({
        id: 'metrics-1',
        type: 'metrics',
        content: {
          title: 'Key Metrics',
          metrics: [
            project.metrics.sales && { label: 'Sales Impact', value: project.metrics.sales },
            project.metrics.engagement && { label: 'Engagement', value: project.metrics.engagement },
            project.metrics.other && { label: 'Additional Impact', value: project.metrics.other }
          ].filter(Boolean)
        },
        order: 5,
        settings: defaultBlockSettings
      })
    }
    
    // Links
    if (project.links && project.links.length > 0) {
      initialBlocks.push({
        id: 'links-1',
        type: 'link',
        content: {
          title: 'Project Links',
          links: project.links
        },
        order: 6,
        settings: defaultBlockSettings
      })
    }
    
    return initialBlocks
  })
  
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [showPreview, setShowPreview] = useState(false)
  const draggedBlock = useRef<string | null>(null)

  const addBlock = (type: LayoutBlock['type']) => {
    const newBlock: LayoutBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      order: blocks.length,
      settings: defaultBlockSettings
    }
    setBlocks([...blocks, newBlock])
    setSelectedBlock(newBlock.id)
  }

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId))
    if (selectedBlock === blockId) {
      setSelectedBlock(null)
    }
  }

  const updateBlock = (blockId: string, updates: Partial<LayoutBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ))
  }

  const reorderBlocks = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(fromIndex, 1)
    newBlocks.splice(toIndex, 0, movedBlock)
    
    // Update order values
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index
    }))
    
    setBlocks(reorderedBlocks)
  }

  const exportAsHTML = () => {
    const html = generateHTML(blocks, project)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.slug}-portfolio.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  return (
    <div className="project-editor">
      <div className="project-editor__toolbar">
        <div className="project-editor__view-controls">
          <button
            className={`project-editor__view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewMode('desktop')}
          >
            <Monitor size={16} />
            Desktop
          </button>
          <button
            className={`project-editor__view-btn ${viewMode === 'tablet' ? 'active' : ''}`}
            onClick={() => setViewMode('tablet')}
          >
            <Tablet size={16} />
            Tablet
          </button>
          <button
            className={`project-editor__view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone size={16} />
            Mobile
          </button>
        </div>
        
        <div className="project-editor__actions">
          <button
            className="button button--ghost"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={16} />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            className="button button--primary"
            onClick={exportAsHTML}
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
              <h3>Add Blocks</h3>
              <div className="project-editor__block-buttons">
                <BlockButton icon={Layout} label="Hero" onClick={() => addBlock('hero')} />
                <BlockButton icon={Type} label="Text" onClick={() => addBlock('text')} />
                <BlockButton icon={Image} label="Image" onClick={() => addBlock('image')} />
                <BlockButton icon={Grid} label="Gallery" onClick={() => addBlock('gallery')} />
                <BlockButton icon={Video} label="Video" onClick={() => addBlock('video')} />
                <BlockButton icon={Link2} label="Links" onClick={() => addBlock('link')} />
                <BlockButton icon={Settings} label="Metrics" onClick={() => addBlock('metrics')} />
              </div>
            </div>
            
            {selectedBlock && (
              <BlockSettings
                block={blocks.find(b => b.id === selectedBlock)!}
                onUpdate={(updates) => updateBlock(selectedBlock, updates)}
                assets={project.assets}
              />
            )}
          </div>
        )}

        <div className={`project-editor__canvas project-editor__canvas--${viewMode} ${showPreview ? 'project-editor__canvas--preview' : ''}`}>
          {sortedBlocks.map((block, index) => (
            <BlockRenderer
              key={block.id}
              block={block}
              isSelected={selectedBlock === block.id}
              isPreview={showPreview}
              onClick={() => !showPreview && setSelectedBlock(block.id)}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={index > 0 ? () => reorderBlocks(index, index - 1) : undefined}
              onMoveDown={index < sortedBlocks.length - 1 ? () => reorderBlocks(index, index + 1) : undefined}
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

function BlockButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button className="project-editor__block-btn" onClick={onClick}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  )
}

function BlockRenderer({ 
  block, 
  isSelected, 
  isPreview, 
  onClick, 
  onDelete, 
  onMoveUp, 
  onMoveDown 
}: { 
  block: LayoutBlock
  isSelected: boolean
  isPreview: boolean
  onClick: () => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const blockClass = `project-block project-block--${block.type} project-block--${block.settings.width} project-block--align-${block.settings.alignment} project-block--padding-${block.settings.padding} ${isSelected ? 'project-block--selected' : ''}`

  return (
    <div 
      className={blockClass}
      onClick={onClick}
      style={{ backgroundColor: block.settings.backgroundColor }}
    >
      {!isPreview && (
        <div className="project-block__controls">
          {onMoveUp && (
            <button className="project-block__control" onClick={(e) => { e.stopPropagation(); onMoveUp() }}>
              ↑
            </button>
          )}
          {onMoveDown && (
            <button className="project-block__control" onClick={(e) => { e.stopPropagation(); onMoveDown() }}>
              ↓
            </button>
          )}
          <button className="project-block__control project-block__control--delete" onClick={(e) => { e.stopPropagation(); onDelete() }}>
            <Trash2 size={14} />
          </button>
        </div>
      )}
      
      <BlockContent block={block} isPreview={isPreview} />
    </div>
  )
}

function BlockContent({ block, isPreview }: { block: LayoutBlock, isPreview: boolean }) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="block-hero">
          {block.content.imageUrl && (
            <img src={block.content.imageUrl} alt={block.content.imageAlt} className="block-hero__image" />
          )}
          <div className="block-hero__content">
            <h1>{block.content.title}</h1>
            {block.content.subtitle && <p className="block-hero__subtitle">{block.content.subtitle}</p>}
          </div>
        </div>
      )
    
    case 'text':
      return (
        <div className="block-text">
          {block.content.title && <h2>{block.content.title}</h2>}
          <div className="block-text__content">
            {block.content.text.split('\n').map((paragraph: string, i: number) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      )
    
    case 'image':
      return (
        <div className="block-image">
          {block.content.imageUrl ? (
            <img src={block.content.imageUrl} alt={block.content.alt} />
          ) : (
            <div className="block-image__placeholder">
              <Image size={48} />
              <p>Select an image</p>
            </div>
          )}
          {block.content.caption && <p className="block-image__caption">{block.content.caption}</p>}
        </div>
      )
    
    case 'gallery':
      return (
        <div className="block-gallery">
          {block.content.title && <h2>{block.content.title}</h2>}
          <div className="block-gallery__grid">
            {block.content.images.map((img: any, i: number) => (
              <div key={i} className="block-gallery__item">
                <img src={img.url} alt={img.alt} />
                {img.caption && <p className="block-gallery__caption">{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )

    case 'video':
      return (
        <div className="block-video">
          {block.content.videoUrl ? (
            <video
              controls={block.content.controls ?? true}
              autoPlay={block.content.autoplay ?? false}
              loop={block.content.loop ?? false}
              muted={block.content.muted ?? false}
              playsInline
              poster={block.content.posterUrl ?? undefined}
            >
              <source src={block.content.videoUrl} type={block.content.mimeType ?? undefined} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="block-video__placeholder">
              <Video size={48} />
              <p>Select a video</p>
            </div>
          )}
          {block.content.caption && <p className="block-video__caption">{block.content.caption}</p>}
        </div>
      )

    case 'metrics':
      return (
        <div className="block-metrics">
          {block.content.title && <h2>{block.content.title}</h2>}
          <div className="block-metrics__grid">
            {block.content.metrics.map((metric: any, i: number) => (
              <div key={i} className="block-metrics__item">
                <div className="block-metrics__value">{metric.value}</div>
                <div className="block-metrics__label">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'link':
      return (
        <div className="block-links">
          {block.content.title && <h2>{block.content.title}</h2>}
          <div className="block-links__list">
            {block.content.links.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block-links__item">
                <Link2 size={16} />
                {link.label || link.url}
              </a>
            ))}
          </div>
        </div>
      )
    
    default:
      return <div>Unknown block type</div>
  }
}

function BlockSettings({ 
  block, 
  onUpdate, 
  assets 
}: { 
  block: LayoutBlock
  onUpdate: (updates: Partial<LayoutBlock>) => void
  assets: ProjectAsset[]
}) {
  return (
    <div className="project-editor__settings">
      <h3>Block Settings</h3>
      
      <div className="setting-group">
        <label>Width</label>
        <select 
          value={block.settings.width} 
          onChange={(e) => onUpdate({ settings: { ...block.settings, width: e.target.value as any } })}
        >
          <option value="full">Full Width</option>
          <option value="two-thirds">Two Thirds</option>
          <option value="half">Half Width</option>
          <option value="third">One Third</option>
        </select>
      </div>
      
      <div className="setting-group">
        <label>Alignment</label>
        <select 
          value={block.settings.alignment} 
          onChange={(e) => onUpdate({ settings: { ...block.settings, alignment: e.target.value as any } })}
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
          onChange={(e) => onUpdate({ settings: { ...block.settings, padding: e.target.value as any } })}
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Block-specific settings */}
      {block.type === 'image' && (
        <div className="setting-group">
          <label>Select Image</label>
          <select
            value={block.content.assetId || ''}
            onChange={(e) => {
              const asset = assets.find(a => a.id === e.target.value)
              onUpdate({
                content: {
                  ...block.content,
                  assetId: e.target.value,
                  imageUrl: asset?.dataUrl,
                  alt: asset?.description || asset?.name
                }
              })
            }}
          >
            <option value="">Select an image...</option>
            {assets.filter(a => a.mimeType.startsWith('image/')).map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
        </div>
      )}

      {block.type === 'video' && (
        <>
          <div className="setting-group">
            <label>Select Video</label>
            <select
              value={block.content.assetId || ''}
              onChange={(event) => {
                const asset = assets.find(a => a.id === event.target.value)
                onUpdate({
                  content: {
                    ...block.content,
                    assetId: event.target.value || null,
                    videoUrl: asset?.dataUrl ?? null,
                    posterUrl: asset?.thumbnailUrl ?? null,
                    mimeType: asset?.mimeType ?? null,
                  }
                })
              }}
            >
              <option value="">Select a video...</option>
              {assets.filter(a => a.mimeType.startsWith('video/')).map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </div>

          <div className="setting-group setting-group--toggles">
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={block.content.controls ?? true}
                onChange={(event) => onUpdate({ content: { ...block.content, controls: event.target.checked } })}
              />
              Show controls
            </label>
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={block.content.autoplay ?? false}
                onChange={(event) => onUpdate({ content: { ...block.content, autoplay: event.target.checked } })}
              />
              Autoplay
            </label>
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={block.content.loop ?? false}
                onChange={(event) => onUpdate({ content: { ...block.content, loop: event.target.checked } })}
              />
              Loop playback
            </label>
            <label className="setting-group__checkbox">
              <input
                type="checkbox"
                checked={block.content.muted ?? false}
                onChange={(event) => onUpdate({ content: { ...block.content, muted: event.target.checked } })}
              />
              Mute audio
            </label>
          </div>

          <div className="setting-group">
            <label>Caption</label>
            <textarea
              value={block.content.caption ?? ''}
              onChange={(event) => onUpdate({ content: { ...block.content, caption: event.target.value } })}
              placeholder="Describe the video context"
            />
          </div>
        </>
      )}
    </div>
  )
}

function getDefaultContent(type: LayoutBlock['type']) {
  switch (type) {
    case 'hero':
      return { title: 'Project Title', subtitle: 'Project subtitle', imageUrl: null, imageAlt: '' }
    case 'text':
      return { title: 'Section Title', text: 'Add your content here...', style: 'section' }
    case 'image':
      return { imageUrl: null, alt: '', caption: '' }
    case 'gallery':
      return { title: 'Gallery', images: [] }
    case 'video':
      return {
        assetId: null,
        videoUrl: null,
        posterUrl: null,
        caption: '',
        controls: true,
        autoplay: false,
        loop: false,
        muted: false,
        mimeType: null,
      }
    case 'metrics':
      return { title: 'Metrics', metrics: [] }
    case 'link':
      return { title: 'Links', links: [] }
    default:
      return {}
  }
}

function generateHTML(blocks: LayoutBlock[], project: ProjectMeta): string {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)
  
  const blockHTML = sortedBlocks.map(block => {
    const blockClass = `block block--${block.type} block--${block.settings.width} block--align-${block.settings.alignment} block--padding-${block.settings.padding}`
    const style = block.settings.backgroundColor !== 'transparent' ? `background-color: ${block.settings.backgroundColor};` : ''
    
    let content = ''
    switch (block.type) {
      case 'hero':
        content = `
          <div class="block-hero">
            ${block.content.imageUrl ? `<img src="${block.content.imageUrl}" alt="${block.content.imageAlt}" class="block-hero__image">` : ''}
            <div class="block-hero__content">
              <h1>${block.content.title}</h1>
              ${block.content.subtitle ? `<p class="block-hero__subtitle">${block.content.subtitle}</p>` : ''}
            </div>
          </div>
        `
        break
      case 'text':
        content = `
          <div class="block-text">
            ${block.content.title ? `<h2>${block.content.title}</h2>` : ''}
            <div class="block-text__content">
              ${block.content.text.split('\n').map((p: string) => `<p>${p}</p>`).join('')}
            </div>
          </div>
        `
        break
      case 'video': {
        const attributes = [
          block.content.controls === false ? '' : 'controls',
          block.content.autoplay ? 'autoplay' : '',
          block.content.loop ? 'loop' : '',
          block.content.muted ? 'muted' : '',
          block.content.posterUrl ? `poster="${block.content.posterUrl}"` : '',
          'playsinline'
        ].filter(Boolean).join(' ')
        const sourceType = block.content.mimeType ? ` type="${block.content.mimeType}"` : ''
        content = `
          <div class="block-video">
            ${block.content.videoUrl ? `
              <video ${attributes}>
                <source src="${block.content.videoUrl}"${sourceType} />
                Your browser does not support the video tag.
              </video>
            ` : `
              <div class="block-video__placeholder">Video placeholder</div>
            `}
            ${block.content.caption ? `<p class="block-video__caption">${block.content.caption}</p>` : ''}
          </div>
        `
        break
      }
      // Add other block types...
    }
    
    return `<div class="${blockClass}" style="${style}">${content}</div>`
  }).join('\n')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title} - Portfolio</title>
  <style>
    /* Basic portfolio styles */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; line-height: 1.6; }
    .block { margin-bottom: 2rem; }
    .block--full { width: 100%; }
    .block--half { width: 50%; }
    .block--align-center { text-align: center; }
    .block-hero { position: relative; }
    .block-hero__image { width: 100%; height: 400px; object-fit: cover; }
    .block-hero__content { padding: 2rem; }
    .block-text__content p { margin-bottom: 1rem; }
    .block-video { text-align: center; }
    .block-video video { width: 100%; max-height: 420px; border-radius: 12px; background: #111827; }
    .block-video__caption { margin-top: 0.75rem; font-size: 0.9rem; color: #4b5563; font-style: italic; }
    /* Add more styles as needed */
  </style>
</head>
<body>
  ${blockHTML}
</body>
</html>
  `.trim()
}