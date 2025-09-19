import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2, RefreshCw, Save } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import GrapesJSEditor from '../components/GrapesJSEditor'
import type { GrapesEditor } from '../types/grapes'
import type { PortfolioDocument } from '../utils/portfolioTemplates'
import { buildPortfolioTemplate, createPortfolioBlocks } from '../utils/portfolioTemplates'
import { loadPortfolioDocument, savePortfolioDocument } from '../utils/portfolioStorage'
import { listProjects } from '../utils/storageManager'
import type { ProjectMeta } from '../intake/schema'

type StatusMessage = { type: 'success' | 'error'; message: string }

type StoredPortfolioDocument = NonNullable<ReturnType<typeof loadPortfolioDocument>>

const PortfolioEditorPage: React.FC = () => {
  const navigate = useNavigate()
  const editorRef = useRef<GrapesEditor | null>(null)

  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [initialDoc, setInitialDoc] = useState<PortfolioDocument | null>(null)
  const [templateDoc, setTemplateDoc] = useState<PortfolioDocument | null>(null)
  const [document, setDocument] = useState<PortfolioDocument | null>(null)
  const [storedDoc, setStoredDoc] = useState<StoredPortfolioDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)

  const refreshProjects = useCallback(async () => {
    setIsLoading(true)
    try {
      const loaded = await listProjects()
      setProjects(loaded)
      const template = buildPortfolioTemplate(loaded)
      const saved = loadPortfolioDocument()
      const initial = saved ? { html: saved.html, css: saved.css } : template
      setTemplateDoc(template)
      setInitialDoc(initial)
      setDocument(initial)
      setStoredDoc(saved ?? null)
    } catch (error) {
      console.error('Failed to load projects for portfolio editor', error)
      setStatus({ type: 'error', message: 'Unable to load projects. Ensure projects are saved locally before editing the portfolio.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshProjects()
  }, [refreshProjects])

  useEffect(() => {
    if (!status) {
      return
    }
    const timeout = window.setTimeout(() => setStatus(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [status])

  const blocks = useMemo(() => createPortfolioBlocks(projects), [projects])

  const editorKey = useMemo(() => {
    if (!initialDoc) {
      return 'portfolio-editor'
    }
    return `portfolio-editor-${initialDoc.html.length}-${initialDoc.css.length}`
  }, [initialDoc])

  const handleEditorReady = useCallback((editor: GrapesEditor) => {
    editorRef.current = editor
  }, [])

  const handleEditorChange = useCallback((doc: PortfolioDocument) => {
    setDocument(doc)
  }, [])

  const handleSave = useCallback(() => {
    if (!document) {
      return
    }
    setIsSaving(true)
    try {
      savePortfolioDocument(document)
      setStoredDoc({ html: document.html, css: document.css, updatedAt: new Date().toISOString() })
      setStatus({ type: 'success', message: 'Portfolio saved locally.' })
    } catch (error) {
      console.error('Failed to save portfolio document', error)
      setStatus({ type: 'error', message: 'Save failed. Ensure your browser allows local storage.' })
    } finally {
      setIsSaving(false)
    }
  }, [document])

  const handleReset = useCallback(() => {
    if (!templateDoc) {
      return
    }
    if (editorRef.current) {
      editorRef.current.setComponents(templateDoc.html)
      editorRef.current.setStyle(templateDoc.css)
    }
    setDocument(templateDoc)
    setStatus({ type: 'success', message: 'Portfolio reset to the generated template.' })
  }, [templateDoc])

  const projectStats = useMemo(() => {
    const total = projects.length
    const withCaseStudy = projects.filter(project => Boolean(project.caseStudyHtml)).length
    return { total, withCaseStudy }
  }, [projects])

  const caseStudyList = useMemo(() => (
    <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl">
      {projects.length === 0 ? (
        <li className="p-4 text-sm text-gray-500">No local projects found yet. Create a project to start building your portfolio.</li>
      ) : (
        projects.map(project => (
          <li key={project.slug} className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">{project.title}</span>
              <span className={`text-xs font-medium uppercase tracking-[0.18em] ${
                project.caseStudyHtml ? 'text-emerald-600' : 'text-orange-600'
              }`}>
                {project.caseStudyHtml ? 'Case study ready' : 'Needs narrative'}
              </span>
            </div>
            <p className="text-sm text-gray-500">{project.summary || project.problem || 'Add a summary to this project.'}</p>
          </li>
        ))
      )}
    </ul>
  ), [projects])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </button>
              <div>
                <h1 className="text-xl font-semibold">Portfolio editor</h1>
                <p className="text-sm text-gray-500">
                  Arrange case studies into a shareable portfolio layout and publish when ready.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                View live portfolio
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                disabled={!templateDoc}
              >
                <RefreshCw className="h-4 w-4" />
                Reset layout
              </button>
              <button
                type="button"
                onClick={refreshProjects}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh projects
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                disabled={isSaving || !document}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save portfolio
              </button>
            </div>
          </div>
          {status && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                status.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 lg:py-10">
        {isLoading || !initialDoc ? (
          <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading portfolio editor…
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <GrapesJSEditor
                key={editorKey}
                initialHtml={initialDoc.html}
                initialCss={initialDoc.css}
                blocks={blocks}
                onChange={handleEditorChange}
                onEditorReady={handleEditorReady}
                height="calc(100vh - 240px)"
              />
            </section>
            <aside className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Portfolio health</h2>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Projects</p>
                    <p className="text-xl font-semibold text-gray-800">{projectStats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Case studies ready</p>
                    <p className="text-xl font-semibold text-gray-800">{projectStats.withCaseStudy}</p>
                  </div>
                </div>
                {storedDoc && (
                  <p className="text-xs text-gray-500">
                    Last saved {new Date(storedDoc.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Case studies</h3>
                {caseStudyList}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

export default PortfolioEditorPage
