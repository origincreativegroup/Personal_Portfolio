import type { ProjectAsset } from '../types/asset'

// Simple block definition (removed GrapesJS dependency)
interface BlockDefinition {
  label: string
  content: string
  category?: string
}

export type CaseStudyDocument = {
  html: string
  css: string
}

export type ProjectMeta = {
  title: string
  summary?: string
  problem?: string
  solution?: string
  outcomes?: string
  role?: string
  timeframe?: {
    duration?: string
    start?: string
    end?: string
  }
  technologies?: string[]
  tags?: string[]
  cover?: string
  assets: ProjectAsset[]
  metrics?: {
    sales?: string
    engagement?: string
    awards?: string[]
    other?: string
  }
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatParagraphs = (value: string, fallback: string): string => {
  const content = value && value.trim().length > 0 ? value : fallback
  return content
    .split(/\n+/)
    .map(paragraph => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .join('')
}

const findHeroAsset = (project: ProjectMeta): ProjectAsset | null => {
  if (!project.cover) {
    return null
  }
  return project.assets.find(asset => asset.id === project.cover) ?? null
}

const buildMetaItems = (project: ProjectMeta): string => {
  const items: string[] = []
  if (project.role) {
    items.push(project.role)
  }
  if (project.timeframe?.duration) {
    items.push(project.timeframe.duration)
  } else if (project.timeframe?.start || project.timeframe?.end) {
    const start = project.timeframe.start?.replace(/T.*/, '') ?? 'Start'
    const end = project.timeframe.end?.replace(/T.*/, '') ?? 'Present'
    items.push(`${start} – ${end}`)
  }
  if (project.technologies?.length) {
    items.push(project.technologies.join(', '))
  }
  return items
    .map(item => `<span class="case-hero__meta-item">${escapeHtml(item)}</span>`)
    .join('')
}

const buildTagBadges = (project: ProjectMeta): string => {
  const tags = project.tags?.length ? project.tags : ['Case Study']
  return tags
    .slice(0, 6)
    .map(tag => `<span class="case-hero__tag">${escapeHtml(tag)}</span>`)
    .join('')
}

const buildMetrics = (project: ProjectMeta): string => {
  const metrics: Array<{ label: string; value: string }> = []
  if (project.metrics?.sales) {
    metrics.push({ label: 'Business Impact', value: project.metrics.sales })
  }
  if (project.metrics?.engagement) {
    metrics.push({ label: 'Engagement', value: project.metrics.engagement })
  }
  if (project.metrics?.awards?.length) {
    metrics.push({ label: 'Recognition', value: project.metrics.awards.join(', ') })
  }
  if (project.metrics?.other) {
    metrics.push({ label: 'Additional Impact', value: project.metrics.other })
  }

  if (metrics.length === 0) {
    return ''
  }

  const items = metrics
    .map(
      metric => `
        <div class="case-metrics__item">
          <span class="case-metrics__label">${escapeHtml(metric.label)}</span>
          <span class="case-metrics__value">${escapeHtml(metric.value)}</span>
        </div>
      `,
    )
    .join('')

  return `
    <section class="case-section case-section--metrics">
      <h2 class="case-section__title">Impact metrics</h2>
      <div class="case-metrics__grid">
        ${items}
      </div>
    </section>
  `
}

const buildGallery = (project: ProjectMeta): string => {
  const images = project.assets.filter(asset => asset.mimeType.startsWith('image/'))
  if (images.length === 0) {
    return ''
  }

  const items = images
    .slice(0, 6)
    .map(asset => {
      const alt = escapeHtml(asset.name ?? project.title)
      return `
        <figure class="case-gallery__item">
          <img src="${asset.dataUrl}" alt="${alt}" />
        </figure>
      `
    })
    .join('')

  return `
    <section class="case-section case-section--media">
      <h2 class="case-section__title">Visual highlights</h2>
      <div class="case-gallery">
        ${items}
      </div>
    </section>
  `
}

const baseCss = `
:root {
  color-scheme: light;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --case-bg: #f6f5ff;
  --case-surface: #ffffff;
  --case-primary: #5a3cf4;
  --case-primary-soft: rgba(90, 60, 244, 0.12);
  --case-muted: #6b7280;
  --case-text: #111827;
  --case-border: rgba(17, 24, 39, 0.08);
}

body {
  margin: 0;
  background: var(--case-bg);
  color: var(--case-text);
  font-family: inherit;
}

.case-study {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px 96px;
}

.case-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 32px;
  padding: 48px;
  border-radius: 32px;
  background: radial-gradient(circle at top left, rgba(90,60,244,0.12), transparent 45%),
              linear-gradient(135deg, #5a3cf4, #4c1d95);
  color: white;
  box-shadow: 0 32px 80px -40px rgba(76, 29, 149, 0.5);
}

.case-hero__media {
  width: 100%;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  object-fit: cover;
  max-height: 360px;
}

.case-hero__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.75;
}

.case-hero__title {
  margin: 12px 0 16px;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  font-weight: 700;
}

.case-hero__description {
  font-size: 1.1rem;
  max-width: 640px;
  opacity: 0.95;
}

.case-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.case-hero__meta-item {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 0.85rem;
}

.case-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.case-hero__tag {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.case-section {
  margin-top: 56px;
  padding: 36px;
  border-radius: 28px;
  background: var(--case-surface);
  border: 1px solid var(--case-border);
  box-shadow: 0 20px 60px -40px rgba(17, 24, 39, 0.35);
}

.case-section__title {
  font-size: 1.5rem;
  margin-bottom: 16px;
  font-weight: 600;
}

.case-section__body p {
  margin: 0 0 16px;
  font-size: 1rem;
  color: var(--case-muted);
}

.case-metrics__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.case-metrics__item {
  padding: 20px;
  border-radius: 20px;
  background: var(--case-primary-soft);
  display: grid;
  gap: 6px;
}

.case-metrics__label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--case-muted);
}

.case-metrics__value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--case-primary);
}

.case-gallery {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: 24px;
}

.case-gallery__item {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--case-border);
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-gallery__item--placeholder {
  aspect-ratio: 4 / 3;
  background: repeating-linear-gradient(
    45deg,
    rgba(90, 60, 244, 0.1),
    rgba(90, 60, 244, 0.1) 12px,
    rgba(90, 60, 244, 0.2) 12px,
    rgba(90, 60, 244, 0.2) 24px
  );
  border: 1px dashed rgba(90, 60, 244, 0.4);
}

.case-gallery__item img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.case-gallery__item figcaption {
  padding: 0 16px 16px;
  font-size: 0.85rem;
  color: var(--case-muted);
}

.case-quote {
  border-left: 4px solid var(--case-primary);
  padding-left: 24px;
  font-size: 1.25rem;
  color: var(--case-text);
  line-height: 1.6;
}

.case-cta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 36px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(90, 60, 244, 0.08), rgba(90, 60, 244, 0.28));
  border: 1px solid rgba(90, 60, 244, 0.24);
}

.case-cta__actions {
  display: flex;
  gap: 12px;
}

.case-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.case-button--primary {
  background: var(--case-primary);
  color: white;
  box-shadow: 0 15px 40px -20px rgba(90, 60, 244, 0.6);
}

.case-button--secondary {
  background: white;
  color: var(--case-primary);
  border: 1px solid rgba(90, 60, 244, 0.2);
}

@media (max-width: 768px) {
  .case-hero {
    padding: 32px;
  }
  .case-section {
    padding: 28px;
  }
}
`

export const buildCaseStudyTemplate = (project: ProjectMeta): CaseStudyDocument => {
  const heroAsset = findHeroAsset(project)
  const heroMedia = heroAsset
    ? `<img class="case-hero__media" src="${heroAsset.dataUrl}" alt="${escapeHtml(heroAsset.name ?? project.title)}" />`
    : ''

  const summary = project.summary ?? project.problem ?? 'Summarize your project in a sentence or two to set the stage for the reader.'
  const problem = formatParagraphs(project.problem ?? '', 'Outline the core challenge your team needed to solve and who was affected.')
  const solution = formatParagraphs(project.solution ?? '', 'Describe the solution you delivered and why you made key design or technical decisions.')
  const outcomes = formatParagraphs(project.outcomes ?? '', 'Highlight measurable outcomes, user impact, or lessons learned from the engagement.')

  const metricsHtml = buildMetrics(project)
  const galleryHtml = buildGallery(project)

  const html = `
    <article class="case-study">
      <section class="case-hero">
        <div class="case-hero__content">
          <span class="case-hero__eyebrow">Case study</span>
          <h1 class="case-hero__title">${escapeHtml(project.title)}</h1>
          <p class="case-hero__description">${escapeHtml(summary)}</p>
          <div class="case-hero__meta">${buildMetaItems(project)}</div>
          <div class="case-hero__tags">${buildTagBadges(project)}</div>
        </div>
        ${heroMedia}
      </section>

      <section class="case-section">
        <h2 class="case-section__title">The challenge</h2>
        <div class="case-section__body">${problem}</div>
      </section>

      <section class="case-section">
        <h2 class="case-section__title">Approach</h2>
        <div class="case-section__body">${solution}</div>
      </section>

      ${galleryHtml}
      ${metricsHtml}

      <section class="case-section">
        <h2 class="case-section__title">Outcomes</h2>
        <div class="case-section__body">${outcomes}</div>
      </section>

      <section class="case-cta">
        <div>
          <h2 class="case-section__title">Ready to continue the conversation?</h2>
          <p class="case-section__body">Let's explore how these results can translate to your team or next initiative.</p>
        </div>
        <div class="case-cta__actions">
          <button class="case-button case-button--primary">Get in touch</button>
          <button class="case-button case-button--secondary">View live prototype</button>
        </div>
      </section>
    </article>
  `

  return { html, css: baseCss }
}

const createSvg = (path: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="currentColor"/></svg>`

export const createCaseStudyBlocks = (project: ProjectMeta): GrapesBlockDefinition[] => {
  const defaultSummary = project.summary ?? project.problem ?? 'Add a high-level summary that introduces the case study.'
  const tags = buildTagBadges(project)
  const mediaIcon = createSvg('M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H6a2 2 0 0 0-2 2v12a1 1 0 0 1-2 0V5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v14a3 3 0 0 1-4.665 2.495L15 19l-3.335 2.495A3 3 0 0 1 6 19V5H4Z')

  return [
    {
      id: 'case-hero',
      label: 'Hero narrative',
      category: 'Narrative',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Z'),
      content: `
        <section class="case-hero">
          <div class="case-hero__content">
            <span class="case-hero__eyebrow">Case study</span>
            <h1 class="case-hero__title">${escapeHtml(project.title)}</h1>
            <p class="case-hero__description">${escapeHtml(defaultSummary)}</p>
            <div class="case-hero__meta">${buildMetaItems(project)}</div>
            <div class="case-hero__tags">${tags}</div>
          </div>
        </section>
      `,
    },
    {
      id: 'case-problem',
      label: 'Problem section',
      category: 'Narrative',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Zm4 8h4v2h-4v-2Zm0-4h4v2h-4V9Z'),
      content: `
        <section class="case-section">
          <h2 class="case-section__title">The challenge</h2>
          <div class="case-section__body">
            <p>Summarize the core challenge, the audience, and why it mattered.</p>
            <p>Call out constraints, insights, or context that framed the work.</p>
          </div>
        </section>
      `,
    },
    {
      id: 'case-approach',
      label: 'Approach section',
      category: 'Narrative',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Zm2 10h4v2h-4v-2Zm0-4h4v2h-4v-2Z'),
      content: `
        <section class="case-section">
          <h2 class="case-section__title">Approach</h2>
          <div class="case-section__body">
            <p>Describe the strategy, frameworks, or experiments that shaped the solution.</p>
            <p>Highlight collaboration, tooling, and how you validated decisions.</p>
          </div>
        </section>
      `,
    },
    {
      id: 'case-outcomes',
      label: 'Outcomes section',
      category: 'Narrative',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Zm2 8h4v2h-4v-2Zm0-4h4v2h-4V9Z'),
      content: `
        <section class="case-section">
          <h2 class="case-section__title">Outcomes</h2>
          <div class="case-section__body">
            <p>Share measurable results, adoption metrics, or qualitative feedback.</p>
            <p>Capture what changed for users or the business after launch.</p>
          </div>
        </section>
      `,
    },
    {
      id: 'case-gallery',
      label: 'Image gallery',
      category: 'Media',
      media: mediaIcon,
      content: `
        <section class="case-section case-section--media">
          <h2 class="case-section__title">Visual highlights</h2>
          <div class="case-gallery">
            <figure class="case-gallery__item case-gallery__item--placeholder"></figure>
            <figure class="case-gallery__item case-gallery__item--placeholder"></figure>
            <figure class="case-gallery__item case-gallery__item--placeholder"></figure>
          </div>
        </section>
      `,
    },
    {
      id: 'case-metrics',
      label: 'Metrics',
      category: 'Outcomes',
      media: createSvg('M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a1 1 0 0 1-1.555.832L15 17l-3.445 2.832A1 1 0 0 1 10 19V5H7a3 3 0 0 0-3 3v11a1 1 0 0 1-2 0V5Zm5 0v14l3-2.4 3 2.4V5H9Zm2 2h4v2h-4V7Zm0 4h4v2h-4v-2Zm0 4h2v2h-2v-2Z'),
      content: `
        <section class="case-section case-section--metrics">
          <h2 class="case-section__title">Impact metrics</h2>
          <div class="case-metrics__grid">
            <div class="case-metrics__item">
              <span class="case-metrics__label">Metric</span>
              <span class="case-metrics__value">+45% engagement</span>
            </div>
            <div class="case-metrics__item">
              <span class="case-metrics__label">Metric</span>
              <span class="case-metrics__value">-30% support tickets</span>
            </div>
          </div>
        </section>
      `,
    },
    {
      id: 'case-quote',
      label: 'Pull quote',
      category: 'Storytelling',
      media: createSvg('M5 4h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H7l-1 4H3l1-4A3 3 0 0 1 1 11V7a3 3 0 0 1 3-3Zm10 0h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-2l-1 4h-3l1-4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z'),
      content: `
        <section class="case-section">
          <blockquote class="case-quote">
            "Include a quote from a stakeholder or customer that captures the impact of the work."
          </blockquote>
        </section>
      `,
    },
    {
      id: 'case-cta',
      label: 'Call to action',
      category: 'Engagement',
      media: createSvg('M4 4h16a2 2 0 0 1 2 2v6.382a2 2 0 0 1-.586 1.414l-7.618 7.618a2 2 0 0 1-2.828 0l-7.618-7.618A2 2 0 0 1 2 12.382V6a2 2 0 0 1 2-2Zm2 4v2h12V8H6Z'),
      content: `
        <section class="case-cta">
          <div>
            <h2 class="case-section__title">Next steps</h2>
            <p class="case-section__body">Invite the reader to connect, explore prototypes, or review the launch.</p>
          </div>
          <div class="case-cta__actions">
            <button class="case-button case-button--primary">Schedule a chat</button>
            <button class="case-button case-button--secondary">View prototype</button>
          </div>
        </section>
      `,
    },
  ]
}
