import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Save, RefreshCcw } from 'lucide-react'
import { useProject, useUpdateProject } from '../hooks/useProjects'

const NewEditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project, isLoading } = useProject(projectId)
  const updateProject = useUpdateProject()
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    category: '',
    template: '',
    color: '#5a3cf4',
  })

  useEffect(() => {
    if (project) {
      setDraft({
        name: project.name,
        description: project.description ?? '',
        category: project.category ?? '',
        template: project.template ?? '',
        color: project.color ?? '#5a3cf4',
      })
    }
  }, [project])

  if (!projectId) {
    return <div className="text-sm text-gray-500">No project selected.</div>
  }

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading project…
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await updateProject.mutateAsync({
      id: project.id,
      version: project.version,
      summary: draft.description,
      name: draft.name,
      description: draft.description,
      category: draft.category,
      template: draft.template,
      color: draft.color,
    })
  }

  const applyServerVersion = () => {
    const latest = updateProject.conflict?.latest?.project
    if (latest) {
      setDraft({
        name: latest.name,
        description: latest.description ?? '',
        category: latest.category ?? '',
        template: latest.template ?? '',
        color: latest.color ?? '#5a3cf4',
      })
    }
    updateProject.resetConflict()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Editing {project.name}</h1>
          <p className="text-sm text-gray-600">Version {project.version} · Updated {new Date(project.updatedAt).toLocaleString()}</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={updateProject.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          <Save size={16} /> {updateProject.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </header>

      {updateProject.conflict && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">A newer revision exists</h2>
              <p className="mt-1 text-sm">Reload the latest server version to merge changes or try saving again.</p>
            </div>
            <button
              onClick={applyServerVersion}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
            >
              <RefreshCcw size={14} /> Use latest
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="project-name"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-700">Narrative</label>
            <textarea
              id="project-description"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              rows={10}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="project-category" className="block text-sm font-medium text-gray-700">Category</label>
            <input
              id="project-category"
              value={draft.category}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
          <div>
            <label htmlFor="project-template" className="block text-sm font-medium text-gray-700">Template</label>
            <input
              id="project-template"
              value={draft.template}
              onChange={(event) => setDraft((prev) => ({ ...prev, template: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
          <div>
            <label htmlFor="project-color" className="block text-sm font-medium text-gray-700">Color</label>
            <input
              id="project-color"
              type="color"
              value={draft.color}
              onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-gray-200"
            />
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewEditorPage
