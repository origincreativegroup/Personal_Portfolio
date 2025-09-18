import React, { useState } from 'react'
import { ProjectMeta, newProject, defaultTags } from './schema'

type Props = { onComplete(meta: ProjectMeta): void }

export default function IntakeForm({ onComplete }: Props) {
  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [outcomes, setOutcomes] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const meta = newProject(title.trim())
    meta.problem = problem.trim()
    meta.solution = solution.trim()
    meta.outcomes = outcomes.trim()
    meta.tags = tags
    onComplete(meta)
  }

  return (
    <form onSubmit={submit} className="intake-form" autoComplete="off">
      <div className="intake-form__heading">
        <h1>Project intake</h1>
        <p>Capture the essentials so we can build the story later.</p>
      </div>

      <div className="intake-form__grid">
        <label className="intake-form__field">
          <span>Project title</span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Acme 2025 Launch"
          />
        </label>

        <label className="intake-form__field">
          <span>Problem identified</span>
          <textarea
            rows={3}
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="What wasn&apos;t working before you got involved?"
          />
        </label>

        <label className="intake-form__field">
          <span>Solution shipped</span>
          <textarea
            rows={3}
            value={solution}
            onChange={e => setSolution(e.target.value)}
            placeholder="What did you design, build or deliver?"
          />
        </label>

        <label className="intake-form__field">
          <span>Outcomes / impact</span>
          <textarea
            rows={3}
            value={outcomes}
            onChange={e => setOutcomes(e.target.value)}
            placeholder="Wins, metrics, reaction — the proof that it mattered."
          />
        </label>
      </div>

      <fieldset className="intake-form__tags">
        <legend>Tag it so you can find it later</legend>
        <div className="intake-form__tag-grid">
          {defaultTags.map(t => {
            const isActive = tags.includes(t)
            return (
              <button
                type="button"
                key={t}
                onClick={() => toggleTag(t)}
                className={`intake-tag${isActive ? ' intake-tag--active' : ''}`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="intake-form__actions">
        <button type="submit" className="button button--primary">Create project</button>
      </div>
    </form>
  )
}
