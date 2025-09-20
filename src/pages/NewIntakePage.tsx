import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  FolderPlus,
  ImagePlus,
  Sparkles,
} from 'lucide-react'
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
    .split(/[,\n]+/)
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
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Project intake</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Capture the essentials so your case study practically writes itself.
              </p>
            </div>
          </div>
          <Button as={Link} to="/portfolio" variant="outline" leftIcon={<Sparkles className="h-4 w-4" />}>
            Portfolio
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Project overview</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Give the project a name and a short framing statement.
            </p>

            <div className="mt-6 space-y-4">
              <Input
                label="Project title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="e.g. Nova analytics platform redesign"
                required
                fullWidth
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Summary
                <textarea
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  placeholder="One or two sentences that set the scene for the work."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Narrative hooks</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              These answers become the backbone of your AI generated case study.
            </p>

            <div className="mt-6 space-y-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                What was the challenge?
                <textarea
                  value={problem}
                  onChange={event => setProblem(event.target.value)}
                  rows={3}
                  placeholder="Describe the friction, business goal, or customer problem."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                How did you approach it?
                <textarea
                  value={solution}
                  onChange={event => setSolution(event.target.value)}
                  rows={3}
                  placeholder="Outline key moves, collaboration patterns, or design decisions."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                What happened as a result?
                <textarea
                  value={outcomes}
                  onChange={event => setOutcomes(event.target.value)}
                  rows={3}
                  placeholder="Metrics, qualitative feedback, or momentum the project unlocked."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
                <textarea
                  value={tags}
                  onChange={event => setTags(event.target.value)}
                  rows={2}
                  placeholder="Separate with commas or new lines – e.g. product strategy, analytics, design systems"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Reference material</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Upload hero images, process shots, or supporting files. You can manage these later in the case study editor.
            </p>

            <div className="mt-6 space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-indigo-500">
                <input type="file" accept="image/*,.pdf,.doc,.docx" multiple className="hidden" onChange={handleAssetUpload} />
                <ImagePlus className="h-6 w-6" />
                <span>
                  Drop files here or <span className="underline">browse</span>
                </span>
              </label>

              {assets.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {assets.map(asset => (
                    <li key={asset.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800/80">
                      <span className="truncate">
                        {asset.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="text-xs text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-indigo-200 bg-indigo-50/80 p-6 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white p-2 shadow-sm dark:bg-indigo-900/80">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">AI narrative boost</h2>
                <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80">
                  Keep this enabled to pre-fill the case study editor with an AI generated narrative.
                </p>
                <label className="inline-flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-100">
                  <input
                    type="checkbox"
                    checked={autoNarrative}
                    onChange={event => setAutoNarrative(event.target.checked)}
                    className="h-4 w-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500"
                  />
                  Auto-generate a narrative draft after saving
                </label>
              </div>
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Data is stored locally in your browser. Export anytime from the dashboard.
            </p>
            <div className="flex items-center gap-2">
              <Button as={Link} to="/dashboard" variant="ghost">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<FolderPlus className="h-4 w-4" />}
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
