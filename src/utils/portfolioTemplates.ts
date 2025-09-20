import type { ProjectMeta } from '../intake/schema'
import type { GrapesBlockDefinition } from '../types/grapes'

export type PortfolioDocument = {
  html: string
  css: string
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const truncate = (value: string, length: number): string => {
  if (value.length <= length) {
    return value
  }
  return `${value.slice(0, length - 1)}…`
}

const summarizeProject = (project: ProjectMeta): string => {
  const summary = project.summary || project.solution || project.problem
  if (!summary) {
    return 'Add a short summary that introduces this case study to prospective clients.'
  }
  return summary
}

const buildTagGroup = (tags: string[]): string =>
  tags
    .slice(0, 4)
    .map(tag => `<span class="portfolio-tag">${escapeHtml(tag)}</span>`)
    .join('')

const baseCss = `
:root {
  color-scheme: light;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --portfolio-bg: radial-gradient(circle at top left, rgba(76, 29, 149, 0.16), rgba(17, 24, 39, 1));
  --portfolio-surface: rgba(15, 23, 42, 0.85);
  --portfolio-border: rgba(148, 163, 184, 0.24);
  --portfolio-primary: #6366f1;
  --portfolio-primary-soft: rgba(99, 102, 241, 0.16);
  --portfolio-text: #e2e8f0;
  --portfolio-muted: #94a3b8;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--portfolio-bg);
  color: var(--portfolio-text);
  font-family: inherit;
}

.portfolio {
  max-width: 1200px;
  margin: 0 auto;
  padding: 72px 24px 120px;
  display: grid;
  gap: 64px;
}

.portfolio-hero {
  position: relative;
  overflow: hidden;
  padding: 64px;
  border-radius: 40px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(14, 116, 144, 0.18));
  border: 1px solid rgba(99, 102, 241, 0.28);
  box-shadow: 0 30px 80px -40px rgba(15, 23, 42, 0.8);
}

.portfolio-hero__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.82);
}

.portfolio-hero__title {
  margin: 12px 0 16px;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  font-weight: 700;
  line-height: 1.08;
}

.portfolio-hero__description {
  max-width: 640px;
  font-size: 1.125rem;
  color: rgba(241, 245, 249, 0.86);
}

.portfolio-hero__actions {
  margin-top: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.portfolio-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  border-radius: 999px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  border: none;
}

.portfolio-button--primary {
  background: rgba(255, 255, 255, 0.18);
  color: white;
  box-shadow: 0 20px 60px -40px rgba(59, 130, 246, 0.8);
}

.portfolio-button--secondary {
  background: rgba(15, 23, 42, 0.6);
  color: var(--portfolio-primary);
  border: 1px solid rgba(99, 102, 241, 0.32);
}

.portfolio-grid {
  display: grid;
  gap: 32px;
}

.portfolio-grid__cards {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.portfolio-card {
  position: relative;
  padding: 28px;
  border-radius: 28px;
  background: var(--portfolio-surface);
  border: 1px solid var(--portfolio-border);
  box-shadow: 0 16px 60px -40px rgba(15, 23, 42, 0.65);
  display: grid;
  gap: 18px;
}

.portfolio-card__title {
  font-size: 1.2rem;
  font-weight: 600;
}

.portfolio-card__summary {
  color: var(--portfolio-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.portfolio-tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.portfolio-tag {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.14);
  color: rgba(226, 232, 240, 0.92);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portfolio-showcase {
  display: grid;
  gap: 32px;
}

.portfolio-case-study {
  padding: 40px;
  border-radius: 32px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(99, 102, 241, 0.18);
  backdrop-filter: blur(8px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 24px 80px -50px rgba(15, 23, 42, 0.9);
}

.portfolio-case-study__header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.portfolio-case-study__title {
  font-size: 1.6rem;
  font-weight: 600;
}

.portfolio-case-study__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.portfolio-case-study__body {
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.12);
  background: rgba(15, 23, 42, 0.55);
}

.portfolio-case-study__body > * {
  margin: 0;
}

@media (max-width: 960px) {
  .portfolio-hero {
    padding: 48px 32px;
  }
  .portfolio-case-study {
    padding: 32px;
  }
}
`

const createSvg = (path: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="currentColor"/></svg>`

export const buildPortfolioTemplate = (projects: ProjectMeta[]): PortfolioDocument => {
  const cards = projects.map(project => {
    const summary = truncate(summarizeProject(project), 160)
    const tags = buildTagGroup(project.tags ?? [])
    return `
      <article class="portfolio-card" data-project="${escapeHtml(project.slug)}">
        <h3 class="portfolio-card__title">${escapeHtml(project.title)}</h3>
        <p class="portfolio-card__summary">${escapeHtml(summary)}</p>
        <div class="portfolio-tag-group">${tags}</div>
      </article>
    `
  })

  const caseStudies = projects.map(project => {
    const tags = buildTagGroup(project.tags ?? [])
    const caseContent = project.caseStudyHtml ?? '<p>Add your case study narrative using the project editor.</p>'
    return `
      <article class="portfolio-case-study" data-project="${escapeHtml(project.slug)}">
        <div class="portfolio-case-study__header">
          <div>
            <h3 class="portfolio-case-study__title">${escapeHtml(project.title)}</h3>
            <div class="portfolio-tag-group">${tags}</div>
          </div>
        </div>
        <div class="portfolio-case-study__body">
          ${caseContent}
        </div>
      </article>
    `
  })

  const html = `
    <main class="portfolio">
      <section class="portfolio-hero">
        <span class="portfolio-hero__eyebrow">Portfolio</span>
        <h1 class="portfolio-hero__title">Selected work & case studies</h1>
        <p class="portfolio-hero__description">
          A collection of collaborative product design and development projects, each grounded in outcomes and measurable impact.
        </p>
        <div class="portfolio-hero__actions">
          <button class="portfolio-button portfolio-button--primary">Book a working session</button>
          <button class="portfolio-button portfolio-button--secondary">Download resume</button>
        </div>
      </section>

      <section class="portfolio-grid">
        <div>
          <h2>Highlights</h2>
          <p class="portfolio-card__summary">Explore a curated mix of engagements spanning research, product design, and engineering.</p>
        </div>
        <div class="portfolio-grid__cards">
          ${cards.join('')}
        </div>
      </section>

      <section class="portfolio-showcase">
        <div>
          <h2>Case studies</h2>
          <p class="portfolio-card__summary">Deep dives into the process, strategy, and impact behind the selected projects.</p>
        </div>
        <div class="portfolio-showcase__list">
          ${caseStudies.join('')}
        </div>
      </section>
    </main>
  `

  const cssFragments = [baseCss, ...projects.map(project => project.caseStudyCss ?? '').filter(Boolean)]

  return {
    html,
    css: cssFragments.join('\n\n'),
  }
}

export const createPortfolioBlocks = (projects: ProjectMeta[]): GrapesBlockDefinition[] => {
  const blocks: GrapesBlockDefinition[] = [
    {
      id: 'portfolio-hero',
      label: 'Portfolio hero',
      category: 'Structure',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Z'),
      content: `
        <section class="portfolio-hero">
          <span class="portfolio-hero__eyebrow">Portfolio</span>
          <h1 class="portfolio-hero__title">Headline for your body of work</h1>
          <p class="portfolio-hero__description">Describe your focus areas, strengths, and the value you bring to product teams.</p>
          <div class="portfolio-hero__actions">
            <button class="portfolio-button portfolio-button--primary">Book a conversation</button>
            <button class="portfolio-button portfolio-button--secondary">Download resume</button>
          </div>
        </section>
      `,
    },
    {
      id: 'portfolio-highlights',
      label: 'Highlights grid',
      category: 'Structure',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Zm8 0h2v2h-2V5Zm0 4h2v2h-2V9Zm0 4h2v2h-2v-2Z'),
      content: `
        <section class="portfolio-grid">
          <div>
            <h2>Highlights</h2>
            <p class="portfolio-card__summary">Pair a short narrative with the types of projects you love shipping.</p>
          </div>
          <div class="portfolio-grid__cards">
            <article class="portfolio-card">
              <h3 class="portfolio-card__title">Project title</h3>
              <p class="portfolio-card__summary">Add a sentence about the outcome and your role.</p>
              <div class="portfolio-tag-group">
                <span class="portfolio-tag">UX Strategy</span>
                <span class="portfolio-tag">Design Systems</span>
              </div>
            </article>
            <article class="portfolio-card">
              <h3 class="portfolio-card__title">Project title</h3>
              <p class="portfolio-card__summary">Highlight measurable impact or shipped features.</p>
              <div class="portfolio-tag-group">
                <span class="portfolio-tag">Product Design</span>
                <span class="portfolio-tag">Leadership</span>
              </div>
            </article>
          </div>
        </section>
      `,
    },
    {
      id: 'portfolio-cta',
      label: 'Contact banner',
      category: 'Structure',
      media: createSvg('M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 6h4v2H6v-2Zm0 4h8v2H6v-2Zm10-8h2v2h-2V6Z'),
      content: `
        <section class="portfolio-hero">
          <span class="portfolio-hero__eyebrow">Let’s collaborate</span>
          <h2 class="portfolio-hero__title">Tell readers how to reach you</h2>
          <p class="portfolio-hero__description">Share availability, preferred contact channels, or upcoming talks and workshops.</p>
          <div class="portfolio-hero__actions">
            <button class="portfolio-button portfolio-button--primary">Start a project</button>
            <button class="portfolio-button portfolio-button--secondary">Download case studies</button>
          </div>
        </section>
      `,
    },
  ]

  projects.forEach(project => {
    const tags = buildTagGroup(project.tags ?? [])
    const caseContent = project.caseStudyHtml ?? '<p>Add the case study narrative from the project editor.</p>'
    blocks.push({
      id: `portfolio-case-${project.slug}`,
      label: `Case study: ${project.title}`,
      category: 'Case studies',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Zm2 4h4v2h-4V9Zm0 4h4v2h-4v-2Z'),
      content: `
        <article class="portfolio-case-study" data-project="${escapeHtml(project.slug)}">
          <div class="portfolio-case-study__header">
            <div>
              <h3 class="portfolio-case-study__title">${escapeHtml(project.title)}</h3>
              <div class="portfolio-tag-group">${tags}</div>
            </div>
          </div>
          <div class="portfolio-case-study__body">
            ${caseContent}
          </div>
        </article>
      `,
    })
  })

  return blocks
}
