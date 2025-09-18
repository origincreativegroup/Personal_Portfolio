import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadProject } from '../utils/fileStore'
import ProjectFileExplorer from '../components/ProjectFileExplorer'

export default function EditorPage() {
  const { slug } = useParams()

  if (!slug) {
    return (
      <div className="editor-page">
        <p>Missing project identifier.</p>
        <Link to="/intake" className="button button--ghost">Return to intake</Link>
      </div>
    )
  }

  const meta = loadProject(slug)

  if (!meta) {
    return (
      <div className="editor-page">
        <div className="editor-page__card">
          <h2>Project not found</h2>
          <p>We couldn&apos;t find anything saved for <strong>{slug}</strong>.</p>
          <Link to="/intake" className="button button--primary">Back to intake</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-page">
      <header className="editor-page__header">
        <div>
          <p className="editor-page__eyebrow">Project workspace</p>
          <h1>{meta.title}</h1>
        </div>
        <Link to="/intake" className="button button--ghost">Switch project</Link>
      </header>

      <div className="editor-page__grid">
        <section className="editor-page__card">
          <h2>Quick summary</h2>
          <dl className="editor-page__summary">
            <div>
              <dt>Problem</dt>
              <dd>{meta.problem || '—'}</dd>
            </div>
            <div>
              <dt>Solution</dt>
              <dd>{meta.solution || '—'}</dd>
            </div>
            <div>
              <dt>Outcomes</dt>
              <dd>{meta.outcomes || '—'}</dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd>{meta.tags.length > 0 ? meta.tags.join(', ') : '—'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(meta.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </section>

        <section className="editor-page__card editor-page__card--files">
          <ProjectFileExplorer projectSlug={slug} projectTitle={meta.title} />
        </section>

        <section className="editor-page__card editor-page__card--placeholder">
          <h2>Portfolio editor</h2>
          <p>The visual editor is in progress. For now, organise your files above and keep iterating on the narrative.</p>
        </section>
      </div>
    </div>
  )
}
