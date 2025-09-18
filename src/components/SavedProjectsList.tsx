import React from 'react'
import { Link } from 'react-router-dom'
import type { ProjectMeta } from '../intake/schema'

type Props = {
  projects: ProjectMeta[]
}

export default function SavedProjectsList({ projects }: Props) {
  return (
    <section className="saved-projects">
      <div className="saved-projects__heading">
        <h2>Local projects</h2>
        <p>Pull any project back into the workspace.</p>
      </div>

      {projects.length === 0 ? (
        <div className="saved-projects__empty">
          <p>You haven&apos;t captured anything yet.</p>
          <p className="saved-projects__empty-sub">Start a new project using the form and it will show up here.</p>
        </div>
      ) : (
        <ul className="saved-projects__list">
          {projects.map(project => (
            <li key={project.slug} className="saved-projects__item">
              <div className="saved-projects__item-body">
                <h3>{project.title}</h3>
                {project.problem && <p>{project.problem}</p>}
                <dl className="saved-projects__meta">
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(project.createdAt).toLocaleDateString()}</dd>
                  </div>
                  {project.tags.length > 0 && (
                    <div>
                      <dt>Tags</dt>
                      <dd>{project.tags.join(', ')}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <Link to={`/editor/${project.slug}`} className="button button--ghost">Open</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
