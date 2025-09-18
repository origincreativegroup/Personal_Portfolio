import React, { useState } from 'react'
import { ProjectMeta, newProject, defaultTags } from './schema'

type Props = { onComplete(meta: ProjectMeta): void }

export default function IntakeForm({ onComplete }: Props) {
  const [title, setTitle] = useState("")
  const [problem, setProblem] = useState("")
  const [solution, setSolution] = useState("")
  const [outcomes, setOutcomes] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const meta = newProject(title)
    meta.problem = problem.trim()
    meta.solution = solution.trim()
    meta.outcomes = outcomes.trim()
    meta.tags = tags
    onComplete(meta)
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Project Intake</h1>
      <input className="border p-2 w-full" placeholder="Project Title"
             value={title} onChange={(e)=>setTitle(e.target.value)} required />
      <textarea className="border p-2 w-full" rows={3}
        placeholder="Problem identified…" value={problem}
        onChange={e=>setProblem(e.target.value)} />
      <textarea className="border p-2 w-full" rows={3}
        placeholder="Solution shipped…" value={solution}
        onChange={e=>setSolution(e.target.value)} />
      <textarea className="border p-2 w-full" rows={3}
        placeholder="Outcomes / impact (numbers win)…" value={outcomes}
        onChange={e=>setOutcomes(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {defaultTags.map(t => (
          <button type="button" key={t}
            onClick={()=>toggleTag(t)}
            className={`px-3 py-1 rounded-full border ${tags.includes(t) ? 'bg-black text-white' : 'bg-white'}`}>
            {t}
          </button>
        ))}
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Create Project</button>
    </form>
  )
}
