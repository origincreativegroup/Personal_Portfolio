import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { buildPortfolioTemplate } from '../utils/portfolioTemplates'
import { loadPortfolioDocument } from '../utils/portfolioStorage'
import { listProjects } from '../utils/storageManager'
import type { ProjectMeta } from '../intake/schema'

type PortfolioViewDocument = { html: string; css: string }

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [document, setDocument] = useState<PortfolioViewDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const loadedProjects = await listProjects()
        setProjects(loadedProjects)
        const saved = loadPortfolioDocument()
        if (saved) {
          setDocument({ html: saved.html, css: saved.css })
        } else {
          const generated = buildPortfolioTemplate(loadedProjects)
          setDocument(generated)
        }
      } catch (err) {
        console.error('Failed to load portfolio view', err)
        setError('Unable to load portfolio content. Ensure projects are available locally.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const markup = useMemo(() => {
    if (!document) {
      return ''
    }
    return `<style>${document.css}</style>${document.html}`
  }, [document])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">Portfolio</h1>
              <p className="text-sm text-slate-400">A generated view of your saved projects and case studies.</p>
            </div>
          </div>
          <Link
            to="/portfolio/editor"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-600"
          >
            <Pencil className="h-4 w-4" />
            Edit portfolio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {isLoading ? (
          <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing portfolio…
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-400 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : document ? (
          <div
            className="portfolio-render rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl"
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
            No portfolio content yet. Create a project and craft a case study to populate this page.
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            Tip: Start by creating a project from the dashboard. The editor will generate a starter case study for you.
          </div>
        )}
      </main>
    </div>
  )
}

export default PortfolioPage
