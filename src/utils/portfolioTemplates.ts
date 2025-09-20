import type { CaseStudyContent, ProjectMeta } from '../intake/schema'

export type PortfolioSettings = {
  title: string
  subtitle: string
  introduction: string
  featuredProjectSlugs: string[]
  highlightHeading?: string
  contactEmail?: string
  callToAction?: string
}

export type PortfolioDocument = {
  html: string
  css: string
  settings?: PortfolioSettings
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const listToHtml = (items: string[], className: string): string => {
  if (!items || items.length === 0) {
    return ''
  }
  const list = items
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('')
  return `<ul class="${className}">${list}</ul>`
}

const resolveCaseStudyContent = (project: ProjectMeta): CaseStudyContent | null => {
  if (project.caseStudyContent) {
    return project.caseStudyContent
  }
  return null
}

const BASE_CSS = `
:root {
  color-scheme: light dark;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

body {
  margin: 0;
  background: radial-gradient(circle at top left, #0f172a, #020617);
  color: #e2e8f0;
}

.portfolio {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 24px 120px;
  display: grid;
  gap: 64px;
}

.portfolio__hero {
  display: grid;
  gap: 24px;
  background: rgba(15, 23, 42, 0.75);
  border-radius: 32px;
  padding: 56px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 40px 80px -60px rgba(15, 23, 42, 0.9);
}

.portfolio__eyebrow {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  color: rgba(148, 163, 184, 0.85);
}

.portfolio__title {
  margin: 0;
  font-size: clamp(2.6rem, 5vw, 3.6rem);
  font-weight: 700;
}

.portfolio__subtitle {
  margin: 0;
  font-size: 1.25rem;
  color: rgba(199, 210, 254, 0.88);
}

.portfolio__introduction {
  margin: 0;
  font-size: 1.05rem;
  color: rgba(226, 232, 240, 0.85);
  line-height: 1.7;
  max-width: 720px;
}

.portfolio__projects {
  display: grid;
  gap: 32px;
}

.portfolio__heading {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(180, 198, 255, 0.9);
}

.portfolio__grid {
  display: grid;
  gap: 28px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.portfolio-card {
  background: rgba(15, 23, 42, 0.72);
  border-radius: 24px;
  padding: 32px;
  display: grid;
  gap: 18px;
  border: 1px solid rgba(71, 85, 105, 0.4);
  box-shadow: 0 24px 60px -48px rgba(2, 6, 23, 0.85);
}

.portfolio-card__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.portfolio-card__summary {
  margin: 0;
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.6;
}

.portfolio-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.portfolio-card__tags li {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.16);
  color: rgba(199, 210, 254, 0.92);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portfolio-card__list {
  margin: 0;
  padding-left: 18px;
  color: rgba(226, 232, 240, 0.85);
  line-height: 1.55;
}

.portfolio__contact {
  display: grid;
  gap: 12px;
  background: rgba(37, 99, 235, 0.16);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(59, 130, 246, 0.32);
}

.portfolio__contact h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(191, 219, 254, 0.92);
}

.portfolio__contact p {
  margin: 0;
  color: rgba(226, 232, 240, 0.85);
}

.portfolio__cta {
  font-weight: 600;
  color: rgba(191, 219, 254, 0.94);
}
`

const buildProjectCard = (project: ProjectMeta): string => {
  const content = resolveCaseStudyContent(project)
  const summary = content?.overview || project.summary || project.solution || project.problem
  const approach = content ? listToHtml(content.approach, 'portfolio-card__list') : ''
  const results = content ? listToHtml(content.results, 'portfolio-card__list') : ''
  const learnings = content?.learnings
    ? `<p class="portfolio-card__summary"><strong>Learnings:</strong> ${escapeHtml(content.learnings)}</p>`
    : ''

  return `
<div class="portfolio-card">
  <div>
    <h3 class="portfolio-card__title">${escapeHtml(project.title)}</h3>
    ${summary ? `<p class="portfolio-card__summary">${escapeHtml(summary)}</p>` : ''}
  </div>
  ${project.tags && project.tags.length > 0
    ? `<ul class="portfolio-card__tags">${project.tags
        .slice(0, 6)
        .map(tag => `<li>${escapeHtml(tag)}</li>`)
        .join('')}</ul>`
    : ''}
  ${approach ? `<div><strong>Approach</strong>${approach}</div>` : ''}
  ${results ? `<div><strong>Impact</strong>${results}</div>` : ''}
  ${learnings}
</div>`
}

export const createDefaultPortfolioSettings = (projects: ProjectMeta[]): PortfolioSettings => ({
  title: 'Portfolio showcase',
  subtitle: projects.length > 0 ? `Selected work featuring ${projects[0].title}` : 'Selected work',
  introduction:
    'A curated snapshot of projects that balance craft, measurable outcomes, and collaborative momentum.',
  featuredProjectSlugs: projects.slice(0, 4).map(project => project.slug),
  highlightHeading: 'Selected projects',
  contactEmail: '',
  callToAction: 'Let’s collaborate on the next build.',
})

export const buildPortfolioTemplate = (
  projects: ProjectMeta[],
  settings?: PortfolioSettings,
): PortfolioDocument => {
  const resolvedSettings = settings ?? createDefaultPortfolioSettings(projects)
  const featuredProjects = resolvedSettings.featuredProjectSlugs
    .map(slug => projects.find(project => project.slug === slug))
    .filter((project): project is ProjectMeta => Boolean(project))

  const fallbackProjects = projects
    .filter(project => !resolvedSettings.featuredProjectSlugs.includes(project.slug))
    .slice(0, Math.max(0, 4 - featuredProjects.length))

  const allProjects = featuredProjects.length > 0 ? featuredProjects : fallbackProjects

  const projectsMarkup =
    allProjects.length === 0
      ? '<p class="portfolio-card__summary">Add projects to your portfolio to populate this section.</p>'
      : allProjects.map(buildProjectCard).join('')

  const heroSubtitle = resolvedSettings.subtitle
    ? `<p class="portfolio__subtitle">${escapeHtml(resolvedSettings.subtitle)}</p>`
    : ''
  const highlightHeading = resolvedSettings.highlightHeading
    ? `<h2 class="portfolio__heading">${escapeHtml(resolvedSettings.highlightHeading)}</h2>`
    : ''
  const contactBlock =
    resolvedSettings.contactEmail || resolvedSettings.callToAction
      ? `<section class="portfolio__contact">
          <h3>Available for new collaborations</h3>
          ${resolvedSettings.callToAction ? `<p class="portfolio__cta">${escapeHtml(resolvedSettings.callToAction)}</p>` : ''}
          ${resolvedSettings.contactEmail ? `<p>${escapeHtml(resolvedSettings.contactEmail)}</p>` : ''}
        </section>`
      : ''

  const html = `
<main class="portfolio">
  <header class="portfolio__hero">
    <span class="portfolio__eyebrow">Portfolio</span>
    <h1 class="portfolio__title">${escapeHtml(resolvedSettings.title)}</h1>
    ${heroSubtitle}
    <p class="portfolio__introduction">${escapeHtml(resolvedSettings.introduction)}</p>
  </header>

  <section class="portfolio__projects">
    ${highlightHeading}
    <div class="portfolio__grid">
      ${projectsMarkup}
    </div>
  </section>

  ${contactBlock}
</main>
`

  return {
    html,
    css: BASE_CSS,
    settings: resolvedSettings,
  }
}
