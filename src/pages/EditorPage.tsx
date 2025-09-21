import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import EnhancedAssetManager from '../components/EnhancedAssetManager'
import ProjectEditor from '../components/ProjectEditor'
import { loadProject, saveProject, deleteProject } from '../utils/storageManager'
import type {
  GalleryBlockContent,
  HeroBlockContent,
  ImageBlockContent,
  ProjectAsset,
  ProjectLayoutBlock,
  ProjectMeta,
  VideoBlockContent,
} from '../intake/schema'
import { generateVideoThumbnail } from '../utils/videoThumbnails'

type FormState = {
  title: string
  problem: string
  solution: string
  outcomes: string
  tags: string
  technologies: string
}

type Feedback = { type: 'success' | 'error' | 'info'; message: string }

const initialFormState: FormState = {
  title: '',
  problem: '',
  solution: '',
  outcomes: '',
  tags: '',
  technologies: '',
}

const parseList = (value: string) =>
  value
    .split(/[;,\n]+/)
    .map(entry => entry.trim())
    .filter(Boolean)

const createAssetId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`

type LayoutUpdateResult = { layout: ProjectLayoutBlock[] | undefined; changed: boolean }

const detachAssetFromLayout = (
  layout: ProjectLayoutBlock[] | undefined,
  assetId: string,
): LayoutUpdateResult => {
  if (!layout || layout.length === 0) {
    return { layout, changed: false }
  }

  let mutated = false

  const cleaned = layout.map(block => {
    switch (block.type) {
      case 'hero': {
        const heroContent = block.content as HeroBlockContent
        if (heroContent.assetId === assetId) {
          mutated = true
          return { ...block, content: { ...heroContent, assetId: null } }
        }
        return block
      }
      case 'image': {
        const imageContent = block.content as ImageBlockContent
        if (imageContent.assetId === assetId) {
          mutated = true
          return { ...block, content: { ...imageContent, assetId: null } }
        }
        return block
      }
      case 'video': {
        const videoContent = block.content as VideoBlockContent
        if (videoContent.assetId === assetId) {
          mutated = true
          return { ...block, content: { ...videoContent, assetId: null } }
        }
        return block
      }
      case 'gallery': {
        const galleryContent = block.content as GalleryBlockContent
        const items = galleryContent.items.filter(item => item.assetId !== assetId)
        if (items.length !== galleryContent.items.length) {
          mutated = true
          return { ...block, content: { ...galleryContent, items } }
        }
        return block
      }
      default:
        return block
    }
  })

  const filtered = cleaned.filter(block =>
    block.type !== 'gallery' || ((block.content as GalleryBlockContent).items?.length ?? 0) > 0,
  )

  return {
    layout: filtered,
    changed: mutated || filtered.length !== layout.length,
  }
}

// Remove size limits - allow unlimited asset uploads

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Unsupported file type'))
      }
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file'))
    }
    reader.readAsDataURL(file)
  })

export default function EditorPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [isDirty, setIsDirty] = useState(false)
  const [formFeedback, setFormFeedback] = useState<Feedback | null>(null)
  const [assetFeedback, setAssetFeedback] = useState<Feedback | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const assetInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true)
      if (!slug) {
        setProject(null)
        setIsLoading(false)
        return
      }

      try {
        const meta = await loadProject(slug)
        setProject(meta)
      } catch (error) {
        console.error('Failed to load project:', error)
        setProject(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProjectData()
  }, [slug])

  useEffect(() => {
    if (!project) {
      setFormState(initialFormState)
      setIsDirty(false)
      return
    }

    setFormState({
      title: project.title,
      problem: project.problem,
      solution: project.solution,
      outcomes: project.outcomes,
      tags: project.tags.join(', '),
      technologies: project.technologies?.join(', ') ?? '',
    })
    setIsDirty(false)
  }, [project?.slug, project?.updatedAt])

  useEffect(() => {
    if (!formFeedback) {
      return
    }

    const timeout = window.setTimeout(() => setFormFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [formFeedback])

  useEffect(() => {
    if (!assetFeedback) {
      return
    }

    const timeout = window.setTimeout(() => setAssetFeedback(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [assetFeedback])

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState(previous => ({
      ...previous,
      [field]: value,
    }))
    setIsDirty(true)
  }

  const handleProjectUpdate = async (updates: Partial<ProjectMeta>) => {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const updatedProject: ProjectMeta = {
      ...project,
      ...updates,
      updatedAt: timestamp,
    }

    try {
      await saveProject(updatedProject)
      setProject(updatedProject)
    } catch (error) {
      console.error('Unable to update project', error)
      throw error
    }
  }

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!project) {
      return
    }

    const tags = parseList(formState.tags)
    const technologies = parseList(formState.technologies)
    try {
      await handleProjectUpdate({
        title: formState.title.trim() || project.title,
        problem: formState.problem.trim(),
        solution: formState.solution.trim(),
        outcomes: formState.outcomes.trim(),
        tags,
        technologies: technologies.length > 0 ? technologies : undefined,
      })
      setIsDirty(false)
      setFormFeedback({ type: 'success', message: 'Project details updated.' })
    } catch (error) {
      console.error('Unable to save project', error)
      setFormFeedback({ type: 'error', message: 'Something went wrong while saving changes.' })
    }
  }

  const handleAssetUpload = async (fileList: FileList | null) => {
    if (!project || !fileList || fileList.length === 0) {
      return
    }

    const files = Array.from(fileList)
    const skipped: string[] = []
    const additions: ProjectAsset[] = []

    for (const file of files) {
      // No size restrictions - allow all files

      try {
        const dataUrl = await readFileAsDataUrl(file)
        let thumbnailUrl: string | null = null

        if (file.type.startsWith('video/')) {
          try {
            thumbnailUrl = await generateVideoThumbnail(file)
          } catch (error) {
            console.warn('Unable to generate thumbnail for video asset', error)
          }
        }

        additions.push({
          id: createAssetId(),
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          addedAt: new Date().toISOString(),
          thumbnailUrl: thumbnailUrl ?? null,
        })
      } catch (error) {
        console.error('Unable to read uploaded file', error)
        skipped.push(`${file.name} (failed to read)`)
      }
    }

    if (assetInputRef.current) {
      assetInputRef.current.value = ''
    }

    if (additions.length === 0) {
      setAssetFeedback({
        type: 'error',
        message: skipped.length > 0 ? `Unable to add files: ${skipped.join(', ')}` : 'No files were added.',
      })
      return
    }

    await handleProjectUpdate({
      assets: [...project.assets, ...additions],
    })

    setAssetFeedback({
      type: skipped.length > 0 ? 'info' : 'success',
      message:
        skipped.length > 0
          ? `Added ${additions.length} asset${additions.length === 1 ? '' : 's'}, skipped ${skipped.length}.`
          : `Added ${additions.length} asset${additions.length === 1 ? '' : 's'}.`,
    })
  }

  const handleAssetRemove = async (assetId: string) => {
    if (!project) {
      return
    }

    const updatedAssets = project.assets.filter(asset => asset.id !== assetId)
    const { layout: nextLayout, changed } = detachAssetFromLayout(project.layout, assetId)

    const updates: Partial<ProjectMeta> = {
      assets: updatedAssets,
    }

    if (changed) {
      updates.layout = nextLayout
    }

    if (project.cover === assetId) {
      updates.cover = undefined
    }

    await handleProjectUpdate(updates)
    setAssetFeedback({ type: 'success', message: 'Asset removed from project.' })
  }

  const handleAssetUpdate = async (assetId: string, updates: Partial<ProjectAsset>) => {
    if (!project) {
      return
    }

    const updatedAssets = project.assets.map(asset =>
      asset.id === assetId ? { ...asset, ...updates } : asset,
    )

    await handleProjectUpdate({ assets: updatedAssets })
    setAssetFeedback({ type: 'success', message: 'Asset details updated.' })
  }

  const handleAssetReorder = async (assetId: string, direction: 'up' | 'down') => {
    if (!project) {
      return
    }

    const index = project.assets.findIndex(asset => asset.id === assetId)
    if (index === -1) {
      return
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= project.assets.length) {
      return
    }

    const reordered = [...project.assets]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    await handleProjectUpdate({ assets: reordered })
    setAssetFeedback({ type: 'success', message: 'Asset order updated.' })
  }

  const handleDeleteProject = async () => {
    if (!project || !slug) {
      return
    }

    if (deleteConfirmText !== 'DELETE') {
      return
    }

    try {
      await deleteProject(slug)
      navigate('/intake')
    } catch (error) {
      console.error('Failed to delete project', error)
      setFormFeedback({ type: 'error', message: 'Failed to delete project. Please try again.' })
      setShowDeleteModal(false)
    }
  }

  const assetCount = project?.assets.length ?? 0
  const lastUpdated = project?.updatedAt ? new Date(project.updatedAt).toLocaleString() : null

  if (!slug) {
    return (
      <div className="editor-page">
        <p>Missing project identifier.</p>
        <Link to="/intake" className="button button--ghost">Return to intake</Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="editor-page">
        <div className="editor-page__card">
          <p>Loading project…</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="editor-page">
        <div className="editor-page__card">
          <h2>Project not found</h2>
          <p>We couldn&apos;t find anything saved for <strong>{slug}</strong>.</p>
          <Link to="/intake" className="button button--primary">Back to intake</Link>
        </div>
      </div>
    )
  }

  const assetLimitCopy = `Uploads are stored locally with no size restrictions.`

  return (
    <div className="editor-page">
      <header className="editor-page__header">
        <div>
          <p className="editor-page__eyebrow">Project workspace</p>
          <h1>{project.title}</h1>
        </div>
        <div className="editor-page__header-actions">
          <Link to="/intake" className="button button--ghost">Switch project</Link>
          <button 
            type="button" 
            className="button button--ghost button--danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete project
          </button>
        </div>
      </header>

      <div className="editor-page__grid">
        <section className="editor-page__card editor-page__card--form">
          <div className="editor-page__card-header">
            <div>
              <h2>Edit project details</h2>
              <p className="editor-page__card-subtitle">Keep the narrative and metadata up to date.</p>
            </div>
            {lastUpdated && <span className="editor-page__meta-text">Last updated {lastUpdated}</span>}
          </div>

          {formFeedback && (
            <div className={`editor-feedback editor-feedback--${formFeedback.type}`}>
              {formFeedback.message}
            </div>
          )}

          <form className="editor-form" onSubmit={handleSave}>
            <label className="editor-form__field">
              <span>Project title</span>
              <input
                type="text"
                value={formState.title}
                onChange={event => handleFieldChange('title', event.target.value)}
                className="editor-form__input"
                placeholder="Design system refresh"
              />
            </label>

            <label className="editor-form__field">
              <span>Problem</span>
              <textarea
                value={formState.problem}
                onChange={event => handleFieldChange('problem', event.target.value)}
                className="editor-form__textarea"
                rows={3}
                placeholder="What challenge did this project address?"
              />
            </label>

            <label className="editor-form__field">
              <span>Solution</span>
              <textarea
                value={formState.solution}
                onChange={event => handleFieldChange('solution', event.target.value)}
                className="editor-form__textarea"
                rows={3}
                placeholder="Summarise the approach and key decisions."
              />
            </label>

            <label className="editor-form__field">
              <span>Outcomes</span>
              <textarea
                value={formState.outcomes}
                onChange={event => handleFieldChange('outcomes', event.target.value)}
                className="editor-form__textarea"
                rows={3}
                placeholder="Highlight measurable impact or learnings."
              />
            </label>

            <label className="editor-form__field">
              <span>Tags</span>
              <input
                type="text"
                value={formState.tags}
                onChange={event => handleFieldChange('tags', event.target.value)}
                className="editor-form__input"
                placeholder="branding, ui design, automation"
              />
              <small>Separate tags with commas, semicolons, or line breaks.</small>
            </label>

            <label className="editor-form__field">
              <span>Technologies</span>
              <input
                type="text"
                value={formState.technologies}
                onChange={event => handleFieldChange('technologies', event.target.value)}
                className="editor-form__input"
                placeholder="React, Prisma, Figma"
              />
              <small>Optional. These help when generating case studies.</small>
            </label>

            <div className="editor-form__actions">
              <button type="submit" className="button button--primary" disabled={!isDirty}>
                Save changes
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  if (project) {
                    setFormState({
                      title: project.title,
                      problem: project.problem,
                      solution: project.solution,
                      outcomes: project.outcomes,
                      tags: project.tags.join(', '),
                      technologies: project.technologies?.join(', ') ?? '',
                    })
                    setIsDirty(false)
                  }
                }}
                disabled={!isDirty}
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="editor-page__card">
          <h2>Quick summary</h2>
          <dl className="editor-page__summary">
            <div>
              <dt>Problem</dt>
              <dd>{project.problem || '—'}</dd>
            </div>
            <div>
              <dt>Solution</dt>
              <dd>{project.solution || '—'}</dd>
            </div>
            <div>
              <dt>Outcomes</dt>
              <dd>{project.outcomes || '—'}</dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd>{project.tags.length > 0 ? project.tags.join(', ') : '—'}</dd>
            </div>
            <div>
              <dt>Technologies</dt>
              <dd>{project.technologies?.length ? project.technologies.join(', ') : '—'}</dd>
            </div>
            <div>
              <dt>Assets</dt>
              <dd>{assetCount}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(project.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </section>

        <section className="editor-page__card editor-page__card--assets">
          {assetFeedback && (
            <div className={`editor-feedback editor-feedback--${assetFeedback.type}`}>
              {assetFeedback.message}
            </div>
          )}

          <EnhancedAssetManager
            assets={project.assets}
            heroAssetId={project.cover}
            onAssetUpdate={handleAssetUpdate}
            onAssetRemove={handleAssetRemove}
            onAssetReorder={handleAssetReorder}
            onHeroSelect={(assetId) => handleProjectUpdate({ cover: assetId || undefined })}
            onAssetUpload={handleAssetUpload}
            isDarkMode={false}
          />

          <input
            ref={assetInputRef}
            type="file"
            className="editor-page__file-input"
            multiple
            onChange={event => handleAssetUpload(event.target.files)}
          />
        </section>


        <section className="editor-page__card editor-page__card--editor">
          <ProjectEditor project={project} onUpdateProject={handleProjectUpdate} />
        </section>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Delete Project</h2>
              <button 
                type="button" 
                className="modal__close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p>
                <strong>This action cannot be undone.</strong>
              </p>
              <p>
                This will permanently delete "{project.title}" and all associated assets.
              </p>
              <p>
                To confirm deletion, type <strong>DELETE</strong> in the field below:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="modal__input"
                autoFocus
              />
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={handleDeleteProject}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
