import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Image,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button, Input } from '../components/ui'
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading editor…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Case study editor</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shape a concise narrative, manage assets, and preview the final layout.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Last updated {formatDate(project.updatedAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Hero & summary</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Set the hook for the case study and tune the key metadata.</p>

            <div className="mt-6 space-y-4">
              <Input
                label="Project title"
                value={project.title}
                onChange={event => setProject(previous => (previous ? { ...previous, title: event.target.value } : previous))}
                fullWidth
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Portfolio summary
                <textarea
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  rows={3}
                  placeholder="A concise one-liner to describe the project."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hero narrative
                <textarea
                  value={overview}
                  onChange={event => setOverview(event.target.value)}
                  rows={3}
                  placeholder="Set the tone for the story with a short paragraph."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
                <textarea
                  value={tagsInput}
                  onChange={event => setTagsInput(event.target.value)}
                  rows={2}
                  placeholder="product strategy, data visualisation, design systems"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
            </div>
          </article>

          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Narrative detail</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">These sections drive the AI narrative and portfolio export.</p>

            <div className="mt-6 space-y-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Challenge
                <textarea
                  value={problem}
                  onChange={event => {
                    setProblem(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, challenge: event.target.value } : previous))
                  }}
                  rows={3}
                  placeholder="What was the problem or opportunity?"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Approach (one point per line)
                <textarea
                  value={approachText}
                  onChange={event => {
                    setApproachText(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, approach: multilineToList(event.target.value) } : previous))
                  }}
                  rows={4}
                  placeholder={'Discovery workshops\nCustomer journey mapping\nIterative prototyping'}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Impact (one metric or story per line)
                <textarea
                  value={resultsText}
                  onChange={event => {
                    setResultsText(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, results: multilineToList(event.target.value) } : previous))
                  }}
                  rows={4}
                  placeholder={'30% uplift in activation\nShipped cross-team design system'}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Solution summary
                <textarea
                  value={solution}
                  onChange={event => setSolution(event.target.value)}
                  rows={3}
                  placeholder="How did you design, build, or facilitate the outcome?"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outcomes & metrics
                <textarea
                  value={outcomes}
                  onChange={event => setOutcomes(event.target.value)}
                  rows={3}
                  placeholder="Key numbers, qualitative wins, or momentum unlocked."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Learnings
                <textarea
                  value={learnings}
                  onChange={event => {
                    setLearnings(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, learnings: event.target.value } : previous))
                  }}
                  rows={3}
                  placeholder="Key lessons or reflections to carry into the next project."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Call to action
                <textarea
                  value={cta}
                  onChange={event => {
                    setCta(event.target.value)
                    setCaseStudy(previous => (previous ? { ...previous, callToAction: event.target.value } : previous))
                  }}
                  rows={2}
                  placeholder="Let’s shape the next release together."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
            </div>
          </article>

        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Assets</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Select a hero image and keep supporting visuals close at hand.</p>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-indigo-500">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAssetUpload} />
              <Image className="h-6 w-6" />
              <span>Drop imagery or <span className="underline">browse</span></span>
            </label>

            {assets.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm">
                {assets.map(asset => (
                  <li
                    key={asset.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{asset.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {asset.mimeType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">No assets yet. Upload hero imagery or screenshots to enhance the case study.</p>
            )}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Live preview</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Updated as you type. Export-ready HTML & CSS are saved locally.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-900/80 p-4 shadow-inner dark:border-gray-700">
              <div
                className="max-h-[420px] overflow-y-auto rounded-xl bg-black/60 text-sm"
                dangerouslySetInnerHTML={{ __html: previewMarkup }}
              />
            </div>
          </section>

          {statusMessage && (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {statusMessage}
              </p>
            </section>
          )}
        </aside>
      </main>
    </div>
  )
}

export default NewEditorPage
