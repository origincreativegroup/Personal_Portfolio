import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IntakeForm from '../intake/IntakeForm'
import { ProjectMeta } from '../intake/schema'
import { saveProject, listProjects } from '../utils/fileStore'
import SavedProjectsList from '../components/SavedProjectsList'

export default function IntakePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectMeta[]>(() => listProjects())

  const handleComplete = (meta: ProjectMeta) => {
    saveProject(meta)
    setProjects(listProjects())
    navigate(`/editor/${meta.slug}`)
  }

  return (
    <div className="intake-page">
      <section className="intake-page__panel intake-page__panel--form" id="new-project">
        <IntakeForm onComplete={handleComplete} />
      </section>
      <aside className="intake-page__panel intake-page__panel--saved" id="saved-projects">
        <SavedProjectsList projects={projects} />
      </aside>
    </div>
  )
}
