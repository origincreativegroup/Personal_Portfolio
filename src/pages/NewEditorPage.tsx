import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Image,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button, Input } from '../components/ui'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import type { CaseStudyContent, ProjectAsset, ProjectMeta } from '../intake/schema'
import { newProject } from '../intake/schema'
import { loadProject, saveProject } from '../utils/storageManager'
import { buildCaseStudyDocument, buildDefaultCaseStudyContent } from '../utils/simpleCaseStudy'
import { generateCaseStudyNarrative } from '../utils/aiNarrative'
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
      })
    }
    reader.onerror = () => reject(new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })

const listToMultiline = (items: string[]): string => items.join('\n')

const multilineToList = (value: string): string[] =>
  value
    .split(/\r?\n+/)
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)

const listToTags = (items: string[]): string => items.join(', ')

const parseTags = (value: string): string[] =>
  value
    .split(/[,\n]+/)
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)

const formatDate = (value?: string) => {
  if (!value) {
    return 'Just saved'
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }
  return new Date(parsed).toLocaleString()
}

const NewEditorPage: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { addNotification } = useApp()

  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [caseStudy, setCaseStudy] = useState<CaseStudyContent | null>(null)
  const [summary, setSummary] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [outcomes, setOutcomes] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [approachText, setApproachText] = useState('')
  const [resultsText, setResultsText] = useState('')
  const [learnings, setLearnings] = useState('')
  const [overview, setOverview] = useState('')
  const [cta, setCta] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [assets, setAssets] = useState<ProjectAsset[]>([])

  useEffect(() => {
    const load = async () => {
      if (!projectId) {
        return
      }
      const existing = await loadProject(projectId)
      if (existing) {
        setProject(existing)
      } else {
        const created = newProject(projectId)
        created.slug = projectId
        created.title = projectId
        setProject(created)
      }
    }
    void load()
  }, [projectId])

  useEffect(() => {
    if (!project) {
      return
    }
    const content = project.caseStudyContent ?? buildDefaultCaseStudyContent(project)
    setCaseStudy(content)
    setSummary(project.summary ?? content.overview ?? '')
    setOverview(content.overview ?? project.summary ?? '')
    setProblem(project.problem ?? '')
    setSolution(project.solution ?? '')
    setOutcomes(project.outcomes ?? '')
    setTagsInput(listToTags(project.tags ?? []))
    setApproachText(listToMultiline(content.approach))
    setResultsText(listToMultiline(content.results))
    setLearnings(content.learnings ?? '')
    setCta(content.callToAction ?? '')
    setAssets(project.assets ?? [])
  }, [project])

  const previewMarkup = useMemo(() => {
    if (!project || !caseStudy) {
      return ''
    }
    const next: ProjectMeta = {
      ...project,
      summary,
      problem,
      solution,
      outcomes,
      tags: parseTags(tagsInput),
      assets,
    }
    const doc = buildCaseStudyDocument(next, {
      overview,
      challenge: problem,
      approach: multilineToList(approachText),
      results: multilineToList(resultsText),
      learnings,
      callToAction: cta || undefined,
    })
    return `<style>${doc.css}</style>${doc.html}`
  }, [project, caseStudy, summary, problem, solution, outcomes, tagsInput, assets, overview, approachText, resultsText, learnings, cta])

  const handleAssetUpload: React.ChangeEventHandler<HTMLInputElement> = async event => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }
    try {
      const uploaded = await Promise.all(files.map(createAssetFromFile))
      setAssets(previous => [...previous, ...uploaded])
      setStatusMessage(`Added ${uploaded.length} asset${uploaded.length === 1 ? '' : 's'}.`)
    } catch (error) {
      console.error('Failed to process asset', error)
      setStatusMessage('Unable to read one of the files.')
    }
  }

  const handleRemoveAsset = (assetId: string) => {
    setAssets(previous => previous.filter(asset => asset.id !== assetId))
  }

  const handleSetHero = (assetId: string) => {
    setAssets(previous =>
      previous.map(asset => ({
        ...asset,
        isHeroImage: asset.id === assetId,
      })),
    )
  }

  const handleGenerateNarrative = async () => {
    if (!project || !caseStudy) {
      return
    }
    setIsGenerating(true)
    try {
      const caseStudyForGeneration: CaseStudyContent = {
        overview,
        challenge: caseStudy.challenge,
        approach: multilineToList(approachText),
        results: multilineToList(resultsText),
        learnings,
        callToAction: cta || undefined,
      }
      const snapshot: ProjectMeta = {
        ...project,
        summary,
        problem,
        solution,
        outcomes,
        tags: parseTags(tagsInput),
        assets,
        caseStudyContent: caseStudyForGeneration,
      }
      const generated = await generateCaseStudyNarrative(snapshot, caseStudyForGeneration)
      setCaseStudy(generated)
      setOverview(generated.overview)
      setApproachText(listToMultiline(generated.approach))
      setResultsText(listToMultiline(generated.results))
      setLearnings(generated.learnings)
      setProblem(generated.challenge)
      setCta(generated.callToAction ?? '')
      setStatusMessage('AI narrative updated. Review and tweak before saving.')
    } catch (error) {
      console.error('Narrative generation failed', error)
      setStatusMessage(error instanceof Error ? error.message : 'Unable to generate narrative right now.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleResetTemplate = () => {
    if (!project) {
      return
    }
    const defaults = buildDefaultCaseStudyContent({ ...project, summary, problem, solution, outcomes, tags: parseTags(tagsInput), assets })
    setCaseStudy(defaults)
    setOverview(defaults.overview)
    setApproachText(listToMultiline(defaults.approach))
    setResultsText(listToMultiline(defaults.results))
    setLearnings(defaults.learnings)
    setProblem(defaults.challenge)
    setCta(defaults.callToAction ?? '')
    setStatusMessage('Case study sections reset to starter copy.')
  }

  const handleSave = async () => {
    if (!project) {
      return
    }
    setIsSaving(true)
    try {
      const updatedCaseStudy: CaseStudyContent = {
        overview,
        challenge: problem,
        approach: multilineToList(approachText),
        results: multilineToList(resultsText),
        learnings,
        callToAction: cta || undefined,
      }
      const nextProject: ProjectMeta = {
        ...project,
        summary: summary || undefined,
        problem,
        solution,
        outcomes,
        tags: parseTags(tagsInput),
        assets,
        updatedAt: new Date().toISOString(),
        caseStudyContent: updatedCaseStudy,
      }
      const doc = buildCaseStudyDocument(nextProject, updatedCaseStudy)
      nextProject.caseStudyHtml = doc.html
      nextProject.caseStudyCss = doc.css
      await saveProject(nextProject)
      setProject(nextProject)
      setCaseStudy(updatedCaseStudy)
      setStatusMessage('Case study saved locally.')
      addNotification('success', 'Case study saved locally.')
    } catch (error) {
      console.error('Failed to save case study', error)
      setStatusMessage('Save failed. Ensure storage is available and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!project || !caseStudy) {
    return (
      <div className="app-page">
        <main
          className="app-page__body"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
        >
          <LoadingSpinner size="lg" text="Loading editor…" centered />
        </main>
      </div>
    )
  }

  return (
    <div className="app-page editor-page">
      <header className="app-page__header">
        <div className="app-page__header-inner" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Dashboard
            </Button>
            <div>
              <h1 className="section-title" style={{ marginBottom: '0.35rem' }}>Case study editor</h1>
              <p className="section-subtitle">
                Shape a concise narrative, manage assets, and preview the final layout.
              </p>
              <p className="form-control__helper">Last updated {formatDate(project.updatedAt)}</p>
            </div>
          </div>
          <div className="button-row">
            <Button
              variant="ghost"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={handleResetTemplate}
            >
              Reset template
            </Button>
            <Button
              variant="outline"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={handleGenerateNarrative}
              loading={isGenerating}
            >
              Generate narrative
            </Button>
            <Button
              variant="primary"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleSave}
              loading={isSaving}
            >
              Save case study
            </Button>
          </div>
        </div>
      </header>

      <main className="app-page__body editor-layout">
        <section className="editor-grid">
          <article className="surface editor-card">
            <h2 className="section-title">Hero & summary</h2>
            <p className="section-subtitle">Set the hook for the case study and tune the key metadata.</p>

            <div className="form-grid">
              <Input
                label="Project title"
                value={project.title}
                onChange={event => setProject(previous => (previous ? { ...previous, title: event.target.value } : previous))}
                fullWidth
              />
              <label className="form-control">
                <span className="form-control__label">Portfolio summary</span>
                <textarea
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  rows={3}
                  placeholder="A concise one-liner to describe the project."
                  className="form-control__textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Hero narrative</span>
                <textarea
                  value={overview}
                  onChange={event => setOverview(event.target.value)}
                  rows={3}
                  placeholder="Set the tone for the story with a short paragraph."
                  className="form-control__textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Tags</span>
                <textarea
                  value={tagsInput}
                  onChange={event => setTagsInput(event.target.value)}
                  rows={2}
                  placeholder="product strategy, data visualisation, design systems"
                  className="form-control__textarea"
                />
              </label>
            </div>
          </article>

          <article className="surface editor-card">
            <h2 className="section-title">Narrative detail</h2>
            <p className="section-subtitle">These sections drive the AI narrative and portfolio export.</p>

            <div className="form-grid">
              <label className="form-control">
                <span className="form-control__label">Challenge</span>
                <textarea
                  value={problem}
                  onChange={event => {
                    setProblem(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, challenge: event.target.value } : previous))
                  }}
                  rows={3}
                  placeholder="What was the problem or opportunity?"
                  className="form-control__textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Approach (one point per line)</span>
                <textarea
                  value={approachText}
                  onChange={event => {
                    setApproachText(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, approach: multilineToList(event.target.value) } : previous))
                  }}
                  rows={4}
                  placeholder={'Discovery workshops\nCustomer journey mapping\nIterative prototyping'}
                  className="form-control__textarea editor-textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Impact (one metric or story per line)</span>
                <textarea
                  value={resultsText}
                  onChange={event => {
                    setResultsText(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, results: multilineToList(event.target.value) } : previous))
                  }}
                  rows={4}
                  placeholder={'30% uplift in activation\nShipped cross-team design system'}
                  className="form-control__textarea editor-textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Solution summary</span>
                <textarea
                  value={solution}
                  onChange={event => setSolution(event.target.value)}
                  rows={3}
                  placeholder="How did you design, build, or facilitate the outcome?"
                  className="form-control__textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Outcomes &amp; metrics</span>
                <textarea
                  value={outcomes}
                  onChange={event => setOutcomes(event.target.value)}
                  rows={3}
                  placeholder="Key numbers, qualitative wins, or momentum unlocked."
                  className="form-control__textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Learnings</span>
                <textarea
                  value={learnings}
                  onChange={event => {
                    setLearnings(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, learnings: event.target.value } : previous))
                  }}
                  rows={3}
                  placeholder="Key lessons or reflections to carry into the next project."
                  className="form-control__textarea"
                />
              </label>
              <label className="form-control">
                <span className="form-control__label">Call to action</span>
                <textarea
                  value={cta}
                  onChange={event => {
                    setCta(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, callToAction: event.target.value } : previous))
                  }}
                  rows={2}
                  placeholder="Let’s shape the next release together."
                  className="form-control__textarea"
                />
              </label>
            </div>
          </article>

        </section>

        <aside className="editor-sidebar">
          <section className="surface">
            <h2 className="section-title">Assets</h2>
            <p className="section-subtitle">Select a hero image and keep supporting visuals close at hand.</p>

            <label className="upload-dropzone" style={{ marginTop: '1rem' }}>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleAssetUpload} />
              <Image className="h-6 w-6" />
              <span>Drop imagery or <strong>browse</strong></span>
            </label>

            {assets.length > 0 ? (
              <ul className="asset-list" style={{ marginTop: '1rem' }}>
                {assets.map(asset => (
                  <li key={asset.id} className="asset-list__item">
                    <div className="asset-list__meta">
                      <span className="asset-list__name">{asset.name}</span>
                      <span className="asset-list__type">{asset.mimeType}</span>
                    </div>
                    <div className="button-row">
                      <Button
                        variant={asset.isHeroImage ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleSetHero(asset.id)}
                      >
                        {asset.isHeroImage ? 'Hero image' : 'Set hero'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleRemoveAsset(asset.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="form-control__helper" style={{ marginTop: '1rem' }}>
                No assets yet. Upload hero imagery or screenshots to enhance the case study.
              </p>
            )}
          </section>

          <section className="surface preview-panel">
            <h2 className="section-title">Live preview</h2>
            <p className="section-subtitle">Updated as you type. Export-ready HTML &amp; CSS are saved locally.</p>
            <div className="preview-panel__frame">
              <div dangerouslySetInnerHTML={{ __html: previewMarkup }} />
            </div>
          </section>

          {statusMessage ? (
            <section className="status-banner">
              <CheckCircle2 width={16} height={16} />
              {statusMessage}
            </section>
          ) : null}
        </aside>
      </main>
    </div>
  )
}

export default NewEditorPage
