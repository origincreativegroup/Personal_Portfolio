import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FolderPlus, ImagePlus, Sparkles } from 'lucide-react'
import { Button, Input } from '../components/ui'
import type { ProjectAsset, ProjectMeta } from '../intake/schema'
import { newProject } from '../intake/schema'
import { saveProject } from '../utils/storageManager'
import { buildDefaultCaseStudyContent } from '../utils/simpleCaseStudy'
import { useApp } from '../contexts/AppContext'

const createAssetFromFile = (file: File): Promise<ProjectAsset> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => {
      const result = event.target?.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'))
        return
      }
      resolve({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: result,
        addedAt: new Date().toISOString(),
        description: '',
      })
    }
    reader.onerror = () => reject(new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })

const normaliseListInput = (value: string): string[] =>
  value
    .split(/[\n,]+/)
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)

const NewIntakePage: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useApp()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [outcomes, setOutcomes] = useState('')
  const [tags, setTags] = useState('')
  const [autoNarrative, setAutoNarrative] = useState(true)
  const [assets, setAssets] = useState<ProjectAsset[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(() => title.trim().length > 0, [title])

  const handleAssetUpload: React.ChangeEventHandler<HTMLInputElement> = async event => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }
    try {
      const uploaded = await Promise.all(files.map(createAssetFromFile))
      setAssets(previous => [...previous, ...uploaded])
      addNotification('success', `Added ${uploaded.length} asset${uploaded.length === 1 ? '' : 's'}.`)
    } catch (error) {
      console.error('Asset upload failed', error)
      addNotification('error', 'Unable to read one of the files.')
    }
  }

  const handleRemoveAsset = (assetId: string) => {
    setAssets(previous => previous.filter(asset => asset.id !== assetId))
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async event => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    try {
      const project: ProjectMeta = {
        ...newProject(title.trim()),
        summary: summary.trim() || undefined,
        problem: problem.trim(),
        solution: solution.trim(),
        outcomes: outcomes.trim(),
        tags: normaliseListInput(tags),
        autoGenerateNarrative: autoNarrative,
        assets,
      }
      project.caseStudyContent = buildDefaultCaseStudyContent(project)
      project.caseStudyContent.overview = project.summary ?? ''

      await saveProject(project)
      addNotification('success', 'Project saved locally. Time to craft the case study!')
      navigate(`/editor/${project.slug}`)
    } catch (error) {
      console.error('Failed to create project', error)
      addNotification('error', 'Unable to save the project to local storage.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-page intake-page">
      <header className="app-page__header">
        <div className="app-page__header-inner intake-header">
          <div className="intake-header__meta">
            <Button as={Link} to="/dashboard" variant="outline" leftIcon={<ArrowLeft width={16} height={16} />}>
              Dashboard
            </Button>
            <div>
              <h1 className="section-title">Project intake</h1>
              <p className="section-subtitle">
                Capture the essentials so your case study practically writes itself.
              </p>
            </div>
          </div>
          <Button as={Link} to="/portfolio" variant="ghost" leftIcon={<Sparkles width={18} height={18} />}>
            Portfolio
          </Button>
        </div>
      </header>

      <main className="app-page__body">
        <form className="intake-body" onSubmit={handleSubmit}>
          <section className="surface">
            <h2 className="section-title">Project overview</h2>
            <p className="section-subtitle">Give the project a name and a short framing statement.</p>

            <div className="form-grid">
              <Input
                label="Project title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="e.g. Nova analytics platform redesign"
                required
                fullWidth
              />
              <label className="form-control form-control--full">
                <span className="form-control__label">Summary</span>
                <textarea
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  placeholder="One or two sentences that set the scene for the work."
                  rows={3}
                  className="form-control__textarea"
                />
              </label>
            </div>
          </section>

          <section className="surface">
            <h2 className="section-title">Narrative hooks</h2>
            <p className="section-subtitle">These answers become the backbone of your AI generated case study.</p>

            <div className="form-grid">
              <label className="form-control">
                <span className="form-control__label">What was the challenge?</span>
                <textarea
                  value={problem}
                  onChange={event => setProblem(event.target.value)}
                  rows={3}
                  required
                  placeholder="Describe the friction, business goal, or customer problem."
                  className="form-control__textarea"
                />
              </label>

              <label className="form-control">
                <span className="form-control__label">How did you approach it?</span>
                <textarea
                  value={solution}
                  onChange={event => setSolution(event.target.value)}
                  rows={3}
                  required
                  placeholder="Outline key moves, collaboration patterns, or design decisions."
                  className="form-control__textarea"
                />
              </label>

              <label className="form-control">
                <span className="form-control__label">What happened as a result?</span>
                <textarea
                  value={outcomes}
                  onChange={event => setOutcomes(event.target.value)}
                  rows={3}
                  required
                  placeholder="Metrics, qualitative feedback, or momentum the project unlocked."
                  className="form-control__textarea"
                />
              </label>

              <label className="form-control">
                <span className="form-control__label">Tags</span>
                <textarea
                  value={tags}
                  onChange={event => setTags(event.target.value)}
                  rows={2}
                  placeholder="Separate with commas or new lines – e.g. product strategy, analytics, design systems"
                  className="form-control__textarea"
                />
              </label>
            </div>
          </section>

          <section className="surface">
            <h2 className="section-title">Reference material</h2>
            <p className="section-subtitle">
              Upload hero images, process shots, or supporting files. You can manage these later in the case study editor.
            </p>

            <div className="form-grid">
              <label className="upload-dropzone">
                <input type="file" accept="image/*,.pdf,.doc,.docx" multiple className="sr-only" onChange={handleAssetUpload} />
                <ImagePlus width={24} height={24} />
                <span>Drop files here or <strong>browse</strong></span>
              </label>

              {assets.length > 0 ? (
                <ul className="asset-list">
                  {assets.map(asset => (
                    <li key={asset.id} className="asset-list__item">
                      <div className="asset-list__meta">
                        <span className="asset-list__name">{asset.name}</span>
                        <span className="asset-list__type">{asset.mimeType}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAsset(asset.id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="form-control__helper">No assets yet. Add imagery or supporting files to enrich the case study.</p>
              )}
            </div>
          </section>

          <section className="surface surface--tinted">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="btn__icon" style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}>
                <Sparkles width={20} height={20} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>AI narrative boost</h2>
                <p className="section-subtitle">
                  Keep this enabled to pre-fill the case study editor with an AI generated narrative.
                </p>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={autoNarrative}
                    onChange={event => setAutoNarrative(event.target.checked)}
                  />
                  Auto-generate a narrative draft after saving
                </label>
              </div>
            </div>
          </section>

          <footer className="intake-actions">
            <p className="intake-actions__note">
              <CheckCircle2 width={16} height={16} /> Data is stored locally in your browser. Export anytime from the dashboard.
            </p>
            <div className="button-row">
              <Button as={Link} to="/dashboard" variant="ghost">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<FolderPlus width={18} height={18} />}
                disabled={!canSubmit}
                loading={isSubmitting}
              >
                Save project
              </Button>
            </div>
          </footer>
        </form>
      </main>
    </div>
  )
}

export default NewIntakePage
