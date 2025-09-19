import React, { useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Filter,
  Github,
  Layers,
  Search,
  Sparkles,
  Star,
} from 'lucide-react'

import './AwesomeGoPage.css'
import { awesomeGoEntries, type AwesomeGoEntry, type AwesomeGoStage } from '../data/awesomeGoResources'

type StageFilterValue = 'all' | AwesomeGoStage

const stageLabels: Record<AwesomeGoStage, string> = {
  mature: 'Mature & battle-tested',
  growing: 'Growing adoption',
  emerging: 'Emerging & experimental',
}

const stageFilterOptions: Array<{ value: StageFilterValue; label: string }> = [
  { value: 'all', label: 'All maturity levels' },
  { value: 'mature', label: stageLabels.mature },
  { value: 'growing', label: stageLabels.growing },
  { value: 'emerging', label: stageLabels.emerging },
]

const normalise = (value: string): string => value.trim().toLowerCase()

const formatStars = (value: number): string => value.toLocaleString('en-US')

const StageBadge = ({ stage }: { stage: AwesomeGoStage }) => (
  <span className={`awesome-go-card__stage awesome-go-card__stage--${stage}`}>
    {stageLabels[stage]}
  </span>
)

const buildSearchHaystack = (entry: AwesomeGoEntry): string =>
  [entry.name, entry.description, entry.category, entry.tags.join(' '), entry.features.join(' '), entry.adoption ?? '']
    .join(' ')
    .toLowerCase()

export default function AwesomeGoPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [stageFilter, setStageFilter] = useState<StageFilterValue>('all')

  const categories = useMemo(() => {
    const unique = new Set<string>()
    for (const entry of awesomeGoEntries) {
      unique.add(entry.category)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [])

  const categorySummaries = useMemo(
    () =>
      categories.map(category => ({
        category,
        count: awesomeGoEntries.filter(entry => entry.category === category).length,
      })),
    [categories],
  )

  const stageCounts = useMemo(() => {
    const counts: Record<AwesomeGoStage, number> = {
      mature: 0,
      growing: 0,
      emerging: 0,
    }

    for (const entry of awesomeGoEntries) {
      counts[entry.stage] += 1
    }

    return counts
  }, [])

  const filteredEntries = useMemo(() => {
    const query = normalise(searchQuery)
    const activeCategories = selectedCategories

    return awesomeGoEntries.filter(entry => {
      if (stageFilter !== 'all' && entry.stage !== stageFilter) {
        return false
      }

      if (activeCategories.size > 0 && !activeCategories.has(entry.category)) {
        return false
      }

      if (!query) {
        return true
      }

      return buildSearchHaystack(entry).includes(query)
    })
  }, [searchQuery, selectedCategories, stageFilter])

  const toggleCategory = (category: string) => {
    setSelectedCategories(current => {
      const next = new Set(current)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const resetFilters = () => {
    setSelectedCategories(new Set())
    setStageFilter('all')
    setSearchQuery('')
  }

  return (
    <div className="awesome-go-page">
      <section className="awesome-go-panel">
        <header className="awesome-go-intro">
          <div>
            <p className="awesome-go-intro__eyebrow">Research</p>
            <h1>Awesome Go adoption guide</h1>
          </div>
          <p className="awesome-go-intro__lead">
            Curated highlights from the <a href="https://github.com/avelino/awesome-go">Awesome Go</a> community list
            to help plan production-ready stacks. Explore frameworks, tooling, and observability picks with maturity
            signals.
          </p>
        </header>

        <div className="awesome-go-insights">
          <div className="awesome-go-insight">
            <Sparkles size={20} />
            <div>
              <span>Total libraries</span>
              <strong>{awesomeGoEntries.length}</strong>
            </div>
          </div>
          <div className="awesome-go-insight">
            <Layers size={20} />
            <div>
              <span>Categories covered</span>
              <strong>{categories.length}</strong>
            </div>
          </div>
          <div className="awesome-go-insight">
            <BookOpen size={20} />
            <div>
              <span>Mature picks</span>
              <strong>{stageCounts.mature}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="awesome-go-panel">
        <header className="awesome-go-filters__header">
          <h2>Filter the landscape</h2>
          <button type="button" className="awesome-go-reset" onClick={resetFilters}>
            Reset filters
          </button>
        </header>

        <div className="awesome-go-filters">
          <div className="awesome-go-search">
            <Search size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search by name, description, or capability"
              aria-label="Search Awesome Go libraries"
            />
          </div>

          <div className="awesome-go-filter-group">
            <div className="awesome-go-filter-group__label">
              <Filter size={16} />
              <span>Categories</span>
            </div>
            <div className="awesome-go-filter-chips">
              {categories.map(category => {
                const isActive = selectedCategories.has(category)
                return (
                  <button
                    key={category}
                    type="button"
                    className={`awesome-go-chip${isActive ? ' is-active' : ''}`}
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                    <span className="awesome-go-chip__count">
                      {categorySummaries.find(summary => summary.category === category)?.count ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="awesome-go-filter-group">
            <div className="awesome-go-filter-group__label">
              <Sparkles size={16} />
              <span>Maturity</span>
            </div>
            <div className="awesome-go-stage-options">
              {stageFilterOptions.map(option => {
                const isActive = stageFilter === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`awesome-go-stage-option${isActive ? ' is-active' : ''}`}
                    onClick={() => setStageFilter(option.value)}
                  >
                    {option.label}
                    {option.value !== 'all' ? (
                      <span className="awesome-go-chip__count">
                        {stageCounts[option.value as AwesomeGoStage] ?? 0}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="awesome-go-panel">
        <header className="awesome-go-results__header">
          <div>
            <h2>Adoption-ready libraries</h2>
            <p className="awesome-go-results__meta">
              Showing {filteredEntries.length} of {awesomeGoEntries.length} curated picks
            </p>
          </div>
        </header>

        <div className="awesome-go-grid">
          {filteredEntries.map(entry => (
            <article key={entry.name} className="awesome-go-card">
              <header className="awesome-go-card__header">
                <div>
                  <p className="awesome-go-card__category">{entry.category}</p>
                  <h3>{entry.name}</h3>
                </div>
                <StageBadge stage={entry.stage} />
              </header>

              <p className="awesome-go-card__description">{entry.description}</p>

              <ul className="awesome-go-card__features">
                {entry.features.map(feature => (
                  <li key={feature}>
                    <CheckCircle2 size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {entry.adoption ? <p className="awesome-go-card__adoption">{entry.adoption}</p> : null}

              <div className="awesome-go-card__tags">
                {entry.tags.map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <footer className="awesome-go-card__footer">
                <div className="awesome-go-card__links">
                  <a href={entry.url} target="_blank" rel="noreferrer">
                    <Github size={16} />
                    <span>Repository</span>
                    <ExternalLink size={14} />
                  </a>
                  {entry.docsUrl ? (
                    <a href={entry.docsUrl} target="_blank" rel="noreferrer">
                      <BookOpen size={16} />
                      <span>Docs</span>
                      <ExternalLink size={14} />
                    </a>
                  ) : null}
                </div>
                <div className="awesome-go-card__stars">
                  <Star size={16} />
                  <span>{formatStars(entry.stars)} stars</span>
                </div>
              </footer>
            </article>
          ))}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="awesome-go-empty">
            <p>No libraries match the current filters. Try widening your search.</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}

