import type { CaseStudyContent, ProjectAsset, ProjectMeta } from '../intake/schema'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const toSentence = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  return value.trim()
}

const normaliseList = (values?: string[] | null): string[] => {
  if (!values || values.length === 0) {
    return []
  }
  return values
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

const DEFAULT_CSS = `
:root {
  color-scheme: light dark;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

body {
  margin: 0;
  background: radial-gradient(circle at top, #0f172a, #020617);
  color: #e2e8f0;
  font-family: inherit;
}

.case-study {
  max-width: 960px;
  margin: 0 auto;
  padding: 72px 20px 120px;
  display: grid;
  gap: 56px;
}

.case-study__card {
  background: rgba(15, 23, 42, 0.78);
  border-radius: 24px;
  padding: 40px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 40px 80px -60px rgba(2, 6, 23, 0.9);
  backdrop-filter: blur(12px);
}

.case-study__header {
  display: grid;
  gap: 20px;
}

.case-study__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.85);
}

.case-study__title {
  font-size: clamp(2.4rem, 5vw, 3.4rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.08;
}

.case-study__summary {
  font-size: 1.125rem;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.6;
}

.case-study__grid {
  display: grid;
  gap: 32px;
}

.case-study__section {
  display: grid;
  gap: 16px;
}

.case-study__section h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #cbd5f5;
}

.case-study__body {
  margin: 0;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.65;
}

.case-study__list {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 10px;
  color: rgba(226, 232, 240, 0.82);
}

.case-study__cta {
  border-radius: 18px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 28px;
  display: grid;
  gap: 12px;
  background: rgba(67, 56, 202, 0.16);
}

.case-study__cta-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(199, 210, 254, 0.92);
}

.case-study__cta p {
  margin: 0;
  color: rgba(224, 231, 255, 0.88);
}
`

const renderList = (items: string[]): string => {
  if (items.length === 0) {
    return ''
  }
  const listItems = items
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('')
  return `<ul class="case-study__list">${listItems}</ul>`
}

const selectHeroAsset = (assets: ProjectAsset[]): string | null => {
  const heroAsset = assets.find(asset => asset.isHeroImage)
  if (heroAsset?.dataUrl) {
    return heroAsset.dataUrl
  }
  const firstImage = assets.find(asset => asset.mimeType.startsWith('image/') && asset.dataUrl)
  return firstImage?.dataUrl ?? null
}

export const buildCaseStudyDocument = (
  project: ProjectMeta,
  content: CaseStudyContent,
): { html: string; css: string } => {
  const summary = toSentence(content.overview || project.summary || project.solution)
  const heroImage = selectHeroAsset(project.assets)
  const heroMarkup = heroImage
    ? `<figure style="margin:0;border-radius:20px;overflow:hidden;background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.18);">
        <img src="${heroImage}" alt="${escapeHtml(project.title)} hero" style="width:100%;display:block;object-fit:cover;max-height:420px;">
      </figure>`
    : ''

  const html = `
<article class="case-study">
  <header class="case-study__card case-study__header">
    <span class="case-study__eyebrow">Case Study</span>
    <h1 class="case-study__title">${escapeHtml(project.title)}</h1>
    ${summary ? `<p class="case-study__summary">${escapeHtml(summary)}</p>` : ''}
    ${heroMarkup}
    ${project.tags && project.tags.length > 0
      ? `<div style="display:flex;flex-wrap:wrap;gap:8px;">${project.tags
          .slice(0, 6)
          .map(tag => `<span style="padding:6px 12px;border-radius:999px;background:rgba(99,102,241,0.16);color:#c7d2fe;font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(tag)}</span>`)
          .join('')}</div>`
      : ''}
  </header>

  <section class="case-study__card case-study__grid">
    <div class="case-study__section">
      <h3>The challenge</h3>
      ${content.challenge ? `<p class="case-study__body">${escapeHtml(content.challenge)}</p>` : '<p class="case-study__body">Describe the problem you set out to solve.</p>'}
    </div>
    <div class="case-study__section">
      <h3>Approach</h3>
      ${renderList(normaliseList(content.approach)) || '<p class="case-study__body">Outline the steps you took and how you collaborated.</p>'}
    </div>
    <div class="case-study__section">
      <h3>Results</h3>
      ${renderList(normaliseList(content.results)) || '<p class="case-study__body">Share measurable impact and qualitative wins.</p>'}
    </div>
    <div class="case-study__section">
      <h3>What I learned</h3>
      ${content.learnings ? `<p class="case-study__body">${escapeHtml(content.learnings)}</p>` : '<p class="case-study__body">Capture the insights and lessons that will inform your next project.</p>'}
    </div>
  </section>

  ${content.callToAction
    ? `<section class="case-study__card case-study__cta">
        <h3 class="case-study__cta-title">Next steps</h3>
        <p>${escapeHtml(content.callToAction)}</p>
      </section>`
    : ''}
</article>
`

  return {
    html,
    css: DEFAULT_CSS,
  }
}

export const buildDefaultCaseStudyContent = (project: ProjectMeta): CaseStudyContent => {
  const approach = project.solution
    ? project.solution.split(/\r?\n|•|-/).map(part => part.trim()).filter(Boolean)
    : []
  const results = project.outcomes
    ? project.outcomes.split(/\r?\n|•|-/).map(part => part.trim()).filter(Boolean)
    : []

  return {
    overview: project.summary ?? '',
    challenge: project.problem ?? '',
    approach,
    results,
    learnings: '',
    callToAction: undefined,
  }
}
