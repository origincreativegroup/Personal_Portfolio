import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2, RefreshCw, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import GrapesJSEditor from '../components/GrapesJSEditor'
import type { GrapesEditor } from '../types/grapes'
import type { CaseStudyDocument } from '../utils/caseStudyTemplates'
import { buildCaseStudyTemplate, createCaseStudyBlocks } from '../utils/caseStudyTemplates'
import { loadProject, saveProject } from '../utils/storageManager'
import type { ProjectMeta } from '../intake/schema'
import { newProject, projectRoleLabels } from '../intake/schema'

const formatTitleFromSlug = (slug: string): string =>
  slug
    .split(/[-_]+/)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

const joinList = (values?: string[]): string =>
  values && values.length > 0 ? values.join(', ') : 'Add details in project settings'

type StatusMessage = { type: 'success' | 'error'; message: string }

const buildInitialDocument = (project: ProjectMeta): { initial: CaseStudyDocument; template: CaseStudyDocument } => {
  const template = buildCaseStudyTemplate(project)
  const initial: CaseStudyDocument = {
    html: project.caseStudyHtml ?? template.html,
    css: project.caseStudyCss ?? template.css,
  }
  return { initial, template }
}

const NewEditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const editorRef = useRef<GrapesEditor | null>(null)

  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [initialDoc, setInitialDoc] = useState<CaseStudyDocument | null>(null)
  const [caseStudyDoc, setCaseStudyDoc] = useState<CaseStudyDocument | null>(null)
  const [templateDoc, setTemplateDoc] = useState<CaseStudyDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)

  const loadProjectData = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false)
      setProject(null)
      return
    }

    setIsLoading(true)
    try {
      let existing = await loadProject(projectId)
      if (!existing) {
        const title = formatTitleFromSlug(projectId)
        const created = newProject(title)
        created.slug = projectId
        created.title = title
        const { template } = buildInitialDocument(created)
        created.caseStudyHtml = template.html
        created.caseStudyCss = template.css
        await saveProject(created)
        existing = created
      }

      const { initial, template } = buildInitialDocument(existing)
      setProject(existing)
      setInitialDoc(initial)
      setCaseStudyDoc(initial)
      setTemplateDoc(template)
    } catch (error) {
      console.error('Failed to load project for editor', error)
      setStatus({ type: 'error', message: 'Unable to load project data. Return to the dashboard and try again.' })
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadProjectData()
  }, [loadProjectData])

  useEffect(() => {
    if (!status) {
      return
    }
    const timeout = window.setTimeout(() => setStatus(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [status])

  const blocks = useMemo(() => (project ? createCaseStudyBlocks(project) : []), [project])

  const handleEditorReady = useCallback((editor: GrapesEditor) => {
    editorRef.current = editor
  }, [])

  const handleEditorChange = useCallback((doc: CaseStudyDocument) => {
    setCaseStudyDoc(doc)
  }, [])

  const handleReset = useCallback(() => {
    if (!templateDoc) {
      return
    }
    if (editorRef.current) {
      editorRef.current.setComponents(templateDoc.html)
      editorRef.current.setStyle(templateDoc.css)
    }
    setCaseStudyDoc(templateDoc)
    setStatus({ type: 'success', message: 'Case study reset to the starter template.' })
  }, [templateDoc])

  const handleSave = useCallback(async () => {
    if (!project || !caseStudyDoc) {
      return
    }
    setIsSaving(true)
    try {
      const updated: ProjectMeta = {
        ...project,
        caseStudyHtml: caseStudyDoc.html,
        caseStudyCss: caseStudyDoc.css,
        updatedAt: new Date().toISOString(),
      }
      await saveProject(updated)
      setProject(updated)
      setStatus({ type: 'success', message: 'Case study saved locally.' })
    } catch (error) {
      console.error('Failed to save case study', error)
      setStatus({ type: 'error', message: 'Save failed. Check storage quota or try again.' })
    } finally {
      setIsSaving(false)
    }
  }, [caseStudyDoc, project])

  const previewMarkup = useMemo(() => {
    if (!caseStudyDoc) {
      return ''
    }
    return `<style>${caseStudyDoc.css}</style>${caseStudyDoc.html}`
  }, [caseStudyDoc])

  const handleBack = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </button>
              <div>
                <h1 className="text-xl font-semibold">Case study editor</h1>
                <p className="text-sm text-gray-500">
                  Craft a narrative for <span className="font-medium text-gray-700">{project?.title ?? 'your project'}</span> using the visual builder.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                View portfolio
              </Link>
              <Link
                to="/portfolio/editor"
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
              >
                Portfolio editor
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                disabled={!templateDoc}
              >
                <RefreshCw className="h-4 w-4" />
                Reset template
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                disabled={isSaving || !caseStudyDoc}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save case study
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
        {isLoading || !project || !initialDoc ? (
          <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading editor…
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <GrapesJSEditor
                key={project.slug}
                initialHtml={initialDoc.html}
                initialCss={initialDoc.css}
                blocks={blocks}
                onChange={handleEditorChange}
                onEditorReady={handleEditorReady}
                height="calc(100vh - 240px)"
              />
            </section>
            <aside className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Live preview</h2>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  {caseStudyDoc ? (
                    <div
                      className="case-study-preview max-h-[60vh] overflow-y-auto rounded-lg bg-white p-4"
                      dangerouslySetInnerHTML={{ __html: previewMarkup }}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">Begin editing to see the rendered case study.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Project details</h3>
                <dl className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Project</dt>
                    <dd className="text-right font-medium text-gray-700">{project.title}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Role</dt>
                    <dd className="text-right text-gray-700">{projectRoleLabels[project.role] ?? project.role}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Summary</dt>
                    <dd className="mt-1 text-gray-700">{project.summary || 'Add a summary in the project dashboard.'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Tags</dt>
                    <dd className="mt-1 text-gray-700">{joinList(project.tags)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Technologies</dt>
                    <dd className="mt-1 text-gray-700">{joinList(project.technologies)}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

export default NewEditorPage
