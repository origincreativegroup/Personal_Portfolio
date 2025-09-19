import React, { useState } from 'react'
import { Folder, Plus, Trash2, Loader2, Pencil, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects'
import { useAuth } from '../context/AuthContext'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, workspaces } = useAuth()
  const { data: projects = [], isLoading } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [showNewProject, setShowNewProject] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    color: '#5a3cf4',
  })

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    await createProject.mutateAsync({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      color: form.color,
    })
    setShowNewProject(false)
    setForm({ name: '', description: '', category: '', color: '#5a3cf4' })
  }

  const handleDelete = async (projectId: string) => {
    if (confirm('Delete this project for everyone in the workspace?')) {
      await deleteProject.mutateAsync(projectId)
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name ?? user?.email}</h2>
          <p className="text-sm text-gray-600">You have access to {workspaces.length} workspace(s).</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
        >
          <Plus size={16} /> New project
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-purple-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-600">Active projects</span>
            <Folder className="h-5 w-5 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{projects.length}</p>
          <p className="text-xs text-gray-500">Across all collaborative workspaces</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
          <span className="text-sm font-medium text-blue-600">Collaborators</span>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{workspaces.length}</p>
          <p className="text-xs text-gray-500">Workspace memberships</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
          <span className="text-sm font-medium text-emerald-600">Last update</span>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {projects[0]?.updatedAt ? new Date(projects[0].updatedAt).toLocaleDateString() : '—'}
          </p>
          <p className="text-xs text-gray-500">Most recent project activity</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
          <button
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-200 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50"
          >
            <Plus size={16} /> Create
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Folder className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No projects yet. Create one to get started.</p>
            </div>
          ) : (
            projects.map((project) => (
              <article key={project.id} className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <button
                      onClick={() => navigate(`/editor/${project.id}`)}
                      className="text-left text-lg font-semibold text-gray-900 hover:text-purple-600"
                    >
                      {project.name}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {project.description ? project.description : 'No description added yet.'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Updated {new Date(project.updatedAt).toLocaleString()} · Version {project.version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => navigate(`/analysis?projectId=${project.id}`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Share2 size={14} /> Analyze
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {showNewProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Create a project</h2>
            <p className="text-sm text-gray-600">All collaborators in the workspace will see this project.</p>
            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="project-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder="Mobile redesign"
                  required
                />
              </div>
              <div>
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="project-description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder="What makes this project special?"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {createProject.isPending ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
