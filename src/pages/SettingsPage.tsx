import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const SettingsPage: React.FC = () => {
  const { user, workspaces, createWorkspace } = useAuth()
  const [form, setForm] = useState({ name: '', slug: '' })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsCreating(true)
    try {
      await createWorkspace({
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
      })
      setForm({ name: '', slug: '' })
    } catch (err) {
      console.error('Workspace creation failed', err)
      setError('Unable to create workspace. Choose a different slug or try again later.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Name</dt>
            <dd className="text-sm text-gray-900">{user?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
            <dd className="text-sm text-gray-900">{user?.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Workspaces</h2>
            <p className="text-sm text-gray-600">You belong to {workspaces.length} workspace(s).</p>
          </div>
        </div>
        <ul className="mt-6 divide-y divide-gray-200">
          {workspaces.map((workspace) => (
            <li key={workspace.id} className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{workspace.name}</p>
                  <p className="text-xs text-gray-500">Role: {workspace.role.toLowerCase()}</p>
                </div>
                <span className="text-xs text-gray-400">{workspace.slug ?? 'No slug'}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Create a workspace</h2>
        <p className="text-sm text-gray-600">Separate client teams or departments into dedicated spaces.</p>
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="workspace-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="workspace-slug" className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              id="workspace-slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="acme-design"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
            <p className="mt-1 text-xs text-gray-500">Optional, must be URL friendly.</p>
          </div>
          {error && <div className="sm:col-span-2 text-sm text-red-600">{error}</div>}
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isCreating || !form.name.trim()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {isCreating ? 'Creating…' : 'Create workspace'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default SettingsPage
