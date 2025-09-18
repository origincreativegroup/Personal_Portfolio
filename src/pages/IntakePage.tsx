import React from 'react'
import { useNavigate } from 'react-router-dom'
import IntakeForm from '../intake/IntakeForm'
import { ProjectMeta } from '../intake/schema'
import { saveProject } from '../utils/fileStore'

export default function IntakePage() {
  const nav = useNavigate()
  const handleComplete = (meta: ProjectMeta) => {
    saveProject(meta)               // persist to localStorage
    nav(`/editor/${meta.slug}`)     // jump to editor
  }
  return <IntakeForm onComplete={handleComplete} />
}
