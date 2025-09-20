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
    <div className="app-page">
      <header className="app-page__header">
        <div className="app-page__header-inner" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Dashboard
            </Button>
            <div>
              <h1 className="section-title">Portfolio editor</h1>
              <p className="section-subtitle">Curate your case studies into a publish-ready layout.</p>
              {lastSavedAt && (
                <p className="form-control__helper">Last saved {new Date(lastSavedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="button-row">
            <Button as={Link} to="/portfolio" variant="ghost" leftIcon={<Layers className="h-4 w-4" />}>
              View generated portfolio
            </Button>
            <Button variant="primary" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
              Save layout
            </Button>
          </div>
        </div>
      </header>

      <main className="app-page__body portfolio-editor-grid">
        <section className="editor-grid">
          <article className="surface editor-card">
            <h2 className="section-title">Hero and framing</h2>
            <p className="section-subtitle">Set the voice for the top of your portfolio.</p>

            <div className="form-grid">
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
              <label className="form-control">
                <span className="form-control__label">Introduction</span>
                <textarea
                  value={settings.introduction}
                  onChange={event => handleUpdateSetting('introduction', event.target.value)}
                  rows={4}
                  className="form-control__textarea"
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
              <label className="form-control">
                <span className="form-control__label">Call to action</span>
                <textarea
                  value={settings.callToAction ?? ''}
                  onChange={event => handleUpdateSetting('callToAction', event.target.value)}
                  rows={2}
                  className="form-control__textarea"
                  placeholder="Let’s collaborate on the next launch."
                />
              </label>
            </div>
          </article>

          <article className="surface editor-card">
            <h2 className="section-title">Selected case studies</h2>
            <p className="section-subtitle">Reorder to control how projects appear.</p>

            {selectedProjects.length === 0 ? (
              <p className="form-control__helper">Pick a few projects from the list to build your showcase.</p>
            ) : (
              <ul className="project-selection__list" style={{ marginTop: '1rem' }}>
                {selectedProjects.map(project => (
                  <li key={project.slug} className="project-selection__item">
                    <div className="project-selection__meta" style={{ color: 'inherit' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{project.title}</p>
                      <p className="project-selection__meta">
                        {project.summary || project.solution || project.problem || 'Add a summary in the case study editor.'}
                      </p>
                    </div>
                    <div className="project-selection__actions">
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
                      <Button variant="ghost" size="sm" onClick={() => handleToggleProject(project.slug)}>
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="surface editor-card">
            <h2 className="section-title">Available projects</h2>
            <p className="section-subtitle">
              Tap any project to add it to the featured list. Already selected projects stay highlighted above.
            </p>

            {availableProjects.length === 0 ? (
              <p className="form-control__helper">All projects are already featured.</p>
            ) : (
              <ul className="project-selection__list" style={{ marginTop: '1rem' }}>
                {availableProjects.map(project => (
                  <li key={project.slug}>
                    <button
                      type="button"
                      onClick={() => handleToggleProject(project.slug)}
                      className="project-selection__item"
                    >
                      <p style={{ margin: 0, fontWeight: 600 }}>{project.title}</p>
                      <p className="project-selection__meta">
                        {project.summary || project.solution || 'Craft the case study to add more context.'}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <aside className="portfolio-editor-sidebar">

          {statusMessage ? (
            <section className="status-banner">
              <CheckCircle2 width={16} height={16} />
              {statusMessage}
            </section>
          ) : null}
        </aside>

        {/* Live Preview - Full Width Section at Bottom */}
        <section className="surface preview-panel preview-panel--full-width">
          <h2 className="section-title">Live preview</h2>
          <p className="section-subtitle">Refresh to regenerate the layout from your current settings.</p>
          <div className="preview-panel__frame">
            <div dangerouslySetInnerHTML={{ __html: previewMarkup }} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default PortfolioEditorPage
