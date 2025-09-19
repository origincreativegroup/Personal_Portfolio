import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProjectMeta } from '../intake/schema'
import { deleteProject } from '../utils/fileStore'

type Props = {
  projects: ProjectMeta[]
  onProjectDeleted?: () => void
}

export default function SavedProjectsList({ projects, onProjectDeleted }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [projectToDelete, setProjectToDelete] = useState<ProjectMeta | null>(null)

  const handleDeleteClick = (project: ProjectMeta) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
    setDeleteConfirmText('')
  }

  const handleDeleteConfirm = () => {
    if (!projectToDelete || deleteConfirmText !== 'DELETE') {
      return
    }

    try {
      deleteProject(projectToDelete.slug)
      setShowDeleteModal(false)
      setProjectToDelete(null)
      setDeleteConfirmText('')
      onProjectDeleted?.()
    } catch (error) {
      console.error('Failed to delete project', error)
    }
  }

  const closeModal = () => {
    setShowDeleteModal(false)
    setProjectToDelete(null)
    setDeleteConfirmText('')
  }
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
              <div className="saved-projects__item-actions">
                <Link to={`/editor/${project.slug}`} className="button button--primary button--small">Open</Link>
                <button 
                  type="button" 
                  className="button button--ghost button--small button--danger"
                  onClick={() => handleDeleteClick(project)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showDeleteModal && projectToDelete && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Delete Project</h2>
              <button 
                type="button" 
                className="modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p>
                <strong>This action cannot be undone.</strong>
              </p>
              <p>
                This will permanently delete "{projectToDelete.title}" and all associated assets.
              </p>
              <p>
                To confirm deletion, type <strong>DELETE</strong> in the field below:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="modal__input"
                autoFocus
              />
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
