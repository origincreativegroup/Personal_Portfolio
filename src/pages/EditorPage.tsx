import React from 'react'
import { useParams } from 'react-router-dom'
import { loadProject } from '../utils/fileStore'
import PortfolioEditor from '../components/portfolio-editor'

export default function EditorPage() {
  const { slug } = useParams()
  const meta = loadProject(slug!)
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">{meta?.title}</h1>
      <p className="text-sm opacity-70">{meta?.problem}</p>
      {/* Render your visual editor */}
      <PortfolioEditor />
    </div>
  )
}
