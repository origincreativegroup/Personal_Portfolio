import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Layers,
  Loader2,
  Save,
} from 'lucide-react'
import { Button, Input } from '../components/ui'
import type { ProjectMeta } from '../intake/schema'
import {
  buildPortfolioTemplate,
  createDefaultPortfolioSettings,
  type PortfolioSettings,
} from '../utils/portfolioTemplates'
import { loadPortfolioDocument, savePortfolioDocument } from '../utils/portfolioStorage'
import { listProjects } from '../utils/storageManager'
import { useApp } from '../contexts/AppContext'

const PortfolioEditorPage: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useApp()

  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [settings, setSettings] = useState<PortfolioSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const loadedProjects = await listProjects()
        const storedDocument = loadPortfolioDocument()
        const initialSettings = storedDocument?.settings
          ? storedDocument.settings
          : createDefaultPortfolioSettings(loadedProjects)

        const filteredSelection = initialSettings.featuredProjectSlugs.filter(slug =>
          loadedProjects.some(project => project.slug === slug),
        )
        const fallbackProjects = loadedProjects
          .filter(project => !filteredSelection.includes(project.slug))
          .slice(0, Math.max(0, 4 - filteredSelection.length))
        const mergedSelection = [...filteredSelection, ...fallbackProjects.map(project => project.slug)]

        setProjects(loadedProjects)
        setSettings({ ...initialSettings, featuredProjectSlugs: mergedSelection })
        setLastSavedAt(storedDocument?.updatedAt ?? null)
      } catch (error) {
        console.error('Failed to load portfolio editor', error)
        setStatusMessage('Unable to load portfolio projects. Create a project first from the dashboard.')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  const selectedProjects = useMemo(() => {
    if (!settings) {
      return []
    }
    return settings.featuredProjectSlugs
      .map(slug => projects.find(project => project.slug === slug))
      .filter((project): project is ProjectMeta => Boolean(project))
  }, [projects, settings])

  const availableProjects = useMemo(() => {
    const selected = new Set(settings?.featuredProjectSlugs ?? [])
    return projects.filter(project => !selected.has(project.slug))
  }, [projects, settings])

  const previewMarkup = useMemo(() => {
    if (!settings) {
      return ''
    }
    const doc = buildPortfolioTemplate(projects, settings)
    return `<style>${doc.css}</style>${doc.html}`
  }, [projects, settings])

  const handleUpdateSetting = <K extends keyof PortfolioSettings>(key: K, value: PortfolioSettings[K]) => {
    setSettings(previous => (previous ? { ...previous, [key]: value } : previous))
  }

  const handleToggleProject = (slug: string) => {
    setSettings(previous => {
      if (!previous) {
        return previous
      }
      const isSelected = previous.featuredProjectSlugs.includes(slug)
      const nextSelection = isSelected
        ? previous.featuredProjectSlugs.filter(entry => entry !== slug)
        : [...previous.featuredProjectSlugs, slug]
      return { ...previous, featuredProjectSlugs: nextSelection }
    })
  }

  const handleMoveProject = (slug: string, direction: 'up' | 'down') => {
    setSettings(previous => {
      if (!previous) {
        return previous
      }
      const index = previous.featuredProjectSlugs.indexOf(slug)
      if (index === -1) {
        return previous
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= previous.featuredProjectSlugs.length) {
        return previous
      }
      const nextSelection = [...previous.featuredProjectSlugs]
      const [removed] = nextSelection.splice(index, 1)
      nextSelection.splice(targetIndex, 0, removed)
      return { ...previous, featuredProjectSlugs: nextSelection }
    })
  }

  const handleSave = async () => {
    if (!settings) {
      return
    }
    try {
      const document = buildPortfolioTemplate(projects, settings)
      savePortfolioDocument(document)
      setLastSavedAt(new Date().toISOString())
      setStatusMessage('Portfolio layout saved locally.')
      addNotification('success', 'Portfolio layout saved locally.')
    } catch (error) {
      console.error('Failed to save portfolio document', error)
      setStatusMessage('Unable to save portfolio. Check local storage availability.')
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing portfolio editor…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Portfolio editor</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Curate your case studies into a publish-ready layout.</p>
              {lastSavedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-500">Last saved {new Date(lastSavedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button as={Link} to="/portfolio" variant="ghost" leftIcon={<Layers className="h-4 w-4" />}>
              View generated portfolio
            </Button>
            <Button variant="primary" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
              Save layout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Hero and framing</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Set the voice for the top of your portfolio.</p>

            <div className="mt-6 space-y-4">
              <Input
                label="Portfolio title"
                value={settings.title}
                onChange={event => handleUpdateSetting('title', event.target.value)}
                fullWidth
              />
              <Input
                label="Subtitle"
                value={settings.subtitle}
                onChange={event => handleUpdateSetting('subtitle', event.target.value)}
                fullWidth
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Introduction
                <textarea
                  value={settings.introduction}
                  onChange={event => handleUpdateSetting('introduction', event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <Input
                label="Section heading"
                value={settings.highlightHeading ?? ''}
                onChange={event => handleUpdateSetting('highlightHeading', event.target.value)}
                placeholder="Selected projects"
                fullWidth
              />
              <Input
                label="Contact email"
                value={settings.contactEmail ?? ''}
                onChange={event => handleUpdateSetting('contactEmail', event.target.value)}
                placeholder="you@example.com"
                fullWidth
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Call to action
                <textarea
                  value={settings.callToAction ?? ''}
                  onChange={event => handleUpdateSetting('callToAction', event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Let’s collaborate on the next launch."
                />
              </label>
            </div>
          </article>

          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Selected case studies</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Reorder to control how projects appear.</p>

            {selectedProjects.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">Pick a few projects from the list to build your showcase.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {selectedProjects.map(project => (
                  <li
                    key={project.slug}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.title}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {project.summary || project.solution || project.problem || 'Add a summary in the case study editor.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ArrowUp className="h-4 w-4" />}
                        onClick={() => handleMoveProject(project.slug, 'up')}
                      >
                        Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ArrowDown className="h-4 w-4" />}
                        onClick={() => handleMoveProject(project.slug, 'down')}
                      >
                        Down
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleProject(project.slug)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Available projects</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Tap any project to add it to the featured list. Already selected projects stay highlighted above.
            </p>

            {availableProjects.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">All projects are already featured.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {availableProjects.map(project => (
                  <li key={project.slug}>
                    <button
                      type="button"
                      onClick={() => handleToggleProject(project.slug)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-100"
                    >
                      <p className="font-medium">{project.title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {project.summary || project.solution || 'Craft the case study to add more context.'}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">Live preview</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Refresh to regenerate the layout from your current settings.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-slate-900/80 p-4 shadow-inner dark:border-gray-700">
              <div
                className="max-h-[520px] overflow-y-auto rounded-xl bg-black/50 text-sm"
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

export default PortfolioEditorPage
