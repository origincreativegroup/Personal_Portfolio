import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateProject } from '../hooks/useProjects'

const templates = [
  { id: 'custom', name: 'Custom project', description: 'Start from scratch with a blank project.' },
  { id: 'case-study', name: 'Case study', description: 'Highlight problem, solution, and outcomes.' },
  { id: 'product-launch', name: 'Product launch', description: 'Capture milestones and launch metrics.' },
]

const colors = ['#5a3cf4', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9']

const NewIntakePage: React.FC = () => {
  const navigate = useNavigate()
  const createProject = useCreateProject()
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    template: 'custom',
    color: '#5a3cf4',
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const result = await createProject.mutateAsync({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      template: form.template,
      color: form.color,
    })

    navigate(`/editor/${result.project.id}`)
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Create a new project</h1>
        <p className="mt-1 text-sm text-gray-600">Projects are automatically shared with collaborators in this workspace.</p>
        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project title</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
                placeholder="Design system refresh"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Summary</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                placeholder="Describe the project goals, the challenge, and the outcome."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <input
                id="category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder="UX Case Study"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <span className="block text-sm font-medium text-gray-700">Template</span>
              <div className="mt-3 space-y-2">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => setForm((prev) => ({ ...prev, template: template.id }))}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      form.template === template.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <span className="font-medium">{template.name}</span>
                    <span className="block text-xs text-gray-500">{template.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700">Color</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, color }))}
                    className={`h-9 w-9 rounded-full border-2 ${
                      form.color === color ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Project color ${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProject.isPending || !form.name.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {createProject.isPending ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewIntakePage
