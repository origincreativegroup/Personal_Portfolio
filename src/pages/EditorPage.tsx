import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProjectFileExplorer from '../components/ProjectFileExplorer'
import { loadProject, saveProject } from '../utils/fileStore'
import type { ProjectAsset, ProjectMeta } from '../intake/schema'

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

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`
}

const MAX_INLINE_ASSET_SIZE = 5 * 1024 * 1024

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
  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [isDirty, setIsDirty] = useState(false)
  const [formFeedback, setFormFeedback] = useState<Feedback | null>(null)
  const [assetFeedback, setAssetFeedback] = useState<Feedback | null>(null)
  const assetInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setIsLoading(true)
    if (!slug) {
      setProject(null)
      setIsLoading(false)
      return
    }

    const meta = loadProject(slug)
    setProject(meta)
    setIsLoading(false)
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

  const handleSave = (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!project) {
      return
    }

    const tags = parseList(formState.tags)
    const technologies = parseList(formState.technologies)
    const timestamp = new Date().toISOString()

    const updatedProject: ProjectMeta = {
      ...project,
      title: formState.title.trim() || project.title,
      problem: formState.problem.trim(),
      solution: formState.solution.trim(),
      outcomes: formState.outcomes.trim(),
      tags,
      technologies: technologies.length > 0 ? technologies : undefined,
      updatedAt: timestamp,
    }

    try {
      saveProject(updatedProject)
      setProject(updatedProject)
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
      if (file.size > MAX_INLINE_ASSET_SIZE) {
        skipped.push(`${file.name} (${formatBytes(file.size)})`)
        continue
      }

      try {
        const dataUrl = await readFileAsDataUrl(file)
        additions.push({
          id: createAssetId(),
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          addedAt: new Date().toISOString(),
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

    const timestamp = new Date().toISOString()
    const updatedProject: ProjectMeta = {
      ...project,
      assets: [...project.assets, ...additions],
      updatedAt: timestamp,
    }

    saveProject(updatedProject)
    setProject(updatedProject)

    setAssetFeedback({
      type: skipped.length > 0 ? 'info' : 'success',
      message:
        skipped.length > 0
          ? `Added ${additions.length} asset${additions.length === 1 ? '' : 's'}, skipped ${skipped.length}.`
          : `Added ${additions.length} asset${additions.length === 1 ? '' : 's'}.`,
    })
  }

  const handleAssetRemove = (assetId: string) => {
    if (!project) {
      return
    }

    const updatedAssets = project.assets.filter(asset => asset.id !== assetId)
    const timestamp = new Date().toISOString()
    const updatedProject: ProjectMeta = {
      ...project,
      assets: updatedAssets,
      updatedAt: timestamp,
    }

    saveProject(updatedProject)
    setProject(updatedProject)
    setAssetFeedback({ type: 'success', message: 'Asset removed from project.' })
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

  const assetLimitCopy = `Uploads are stored locally (max ${formatBytes(MAX_INLINE_ASSET_SIZE)} per file).`

  return (
    <div className="editor-page">
      <header className="editor-page__header">
        <div>
          <p className="editor-page__eyebrow">Project workspace</p>
          <h1>{project.title}</h1>
        </div>
        <Link to="/intake" className="button button--ghost">Switch project</Link>
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
          <div className="editor-page__card-header">
            <div>
              <h2>Project assets</h2>
              <p className="editor-page__card-subtitle">Drop in supporting files, briefs, or exports.</p>
            </div>
            <button type="button" className="button button--primary button--small" onClick={() => assetInputRef.current?.click()}>
              Upload files
            </button>
            <input
              ref={assetInputRef}
              type="file"
              className="editor-page__file-input"
              multiple
              onChange={event => handleAssetUpload(event.target.files)}
            />
          </div>

          <p className="editor-page__card-helper">{assetLimitCopy}</p>

          {assetFeedback && (
            <div className={`editor-feedback editor-feedback--${assetFeedback.type}`}>
              {assetFeedback.message}
            </div>
          )}

          {project.assets.length === 0 ? (
            <div className="editor-assets__empty">
              <p>No assets yet. Upload renders, documents, or media to keep everything together.</p>
            </div>
          ) : (
            <ul className="editor-assets__list">
              {project.assets.map(asset => {
                const isImage = asset.mimeType.startsWith('image/')
                return (
                  <li key={asset.id} className="editor-assets__item">
                    <div className="editor-assets__preview">
                      {isImage ? (
                        <img src={asset.dataUrl} alt={asset.name} />
                      ) : (
                        <span className="editor-assets__icon">{asset.mimeType.split('/')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="editor-assets__meta">
                      <strong>{asset.name}</strong>
                      <span>
                        {formatBytes(asset.size)} • Added{' '}
                        {new Date(asset.addedAt).toLocaleDateString()} 
                      </span>
                    </div>
                    <div className="editor-assets__actions">
                      <a href={asset.dataUrl} download={asset.name} className="button button--ghost button--small">
                        Download
                      </a>
                      <button
                        type="button"
                        className="button button--ghost button--danger button--small"
                        onClick={() => handleAssetRemove(asset.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="editor-page__card editor-page__card--files">
          <ProjectFileExplorer projectSlug={slug} projectTitle={project.title} />
        </section>

        <section className="editor-page__card editor-page__card--placeholder">
          <h2>Portfolio editor</h2>
          <p>The visual editor is in progress. For now, organise your files above and keep iterating on the narrative.</p>
        </section>
      </div>
    </div>
  )
}
