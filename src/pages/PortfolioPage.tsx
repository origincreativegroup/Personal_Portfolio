import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { buildPortfolioTemplate } from '../utils/portfolioTemplates'
import { loadPortfolioDocument } from '../utils/portfolioStorage'
import { listProjects } from '../utils/storageManager'
import type { ProjectMeta } from '../intake/schema'
import LoadingSpinner from '../components/ui/LoadingSpinner'

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
        if (saved?.settings) {
          const regenerated = buildPortfolioTemplate(loadedProjects, saved.settings)
          setDocument({ html: regenerated.html, css: regenerated.css })
        } else if (saved) {
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
    <div className="portfolio-view">
      <header className="portfolio-view__header">
        <div className="portfolio-view__header-inner">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn--outline"
            >
              <ArrowLeft width={16} height={16} />
              Dashboard
            </button>
            <div>
              <h1 className="section-title" style={{ color: '#fff' }}>Portfolio</h1>
              <p className="section-subtitle" style={{ color: 'rgba(226,232,240,0.7)' }}>
                A generated view of your saved projects and case studies.
              </p>
            </div>
          </div>
          <Link
            to="/portfolio/editor"
            className="btn btn--primary"
          >
            <Pencil width={16} height={16} />
            Edit portfolio
          </Link>
        </div>
      </header>

      <main className="portfolio-view__body">
        {isLoading ? (
          <LoadingSpinner size="lg" text="Preparing portfolio…" centered />
        ) : error ? (
          <div className="portfolio-view__error">
            {error}
          </div>
        ) : document ? (
          <div className="portfolio-view__panel" dangerouslySetInnerHTML={{ __html: markup }} />
        ) : (
          <div className="portfolio-view__empty">
            No portfolio content yet. Create a project and craft a case study to populate this page.
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="portfolio-view__empty" style={{ marginTop: '1.5rem' }}>
            Tip: Start by creating a project from the dashboard. The editor will generate a starter case study for you.
          </div>
        )}
      </main>
    </div>
  )
}

export default PortfolioPage
