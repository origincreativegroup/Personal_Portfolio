import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './styles/projects-center.css';

type StatCard = {
  id: string;
  title: string;
  value: string;
  suffix?: string;
  change: string;
  changeTone: 'up' | 'steady' | 'down';
  description: string;
  background: string;
};

type FilterChip = {
  id: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
};

type ProjectStatusTone = 'review' | 'execution' | 'planning' | 'research';
type ProjectHealth = 'good' | 'watch' | 'risk';
type MilestoneState = 'completed' | 'active' | 'upcoming';
type UpdateStatus = 'complete' | 'pending' | 'risk';

interface ProjectMeta {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface ProjectMilestone {
  title: string;
  caption: string;
  state: MilestoneState;
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  category: string;
  status: string;
  statusTone: ProjectStatusTone;
  priority: string;
  description: string;
  tags: string[];
  meta: ProjectMeta[];
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  healthState: ProjectHealth;
  healthLabel: string;
  team: TeamMember[];
  milestones: ProjectMilestone[];
}

interface TeamUpdate {
  id: string;
  status: UpdateStatus;
  title: string;
  detail: string;
  time: string;
}

interface UpcomingReview {
  id: string;
  title: string;
  owner: string;
  time: string;
}

const stats: StatCard[] = [
  {
    id: 'active-projects',
    title: 'Active Projects',
    value: '32',
    suffix: '/ 40',
    change: '+12%',
    changeTone: 'up',
    description: 'In production this month',
    background: 'linear-gradient(135deg, #4338ca, #6366f1)',
  },
  {
    id: 'upcoming-launches',
    title: 'Upcoming Launches',
    value: '12',
    suffix: ' scheduled',
    change: '4 this week',
    changeTone: 'steady',
    description: 'Coordinated across 5 teams',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  },
  {
    id: 'team-capacity',
    title: 'Team Capacity',
    value: '82%',
    suffix: ' utilised',
    change: '6 open slots',
    changeTone: 'up',
    description: 'Creative pods ready to assist',
    background: 'linear-gradient(135deg, #0f766e, #22c55e)',
  },
];

const filters: FilterChip[] = [
  { id: 'focus', label: 'High focus', icon: Sparkles, active: true },
  { id: 'launch', label: 'Launch ready', icon: TrendingUp },
  { id: 'review', label: 'Needs review', icon: AlertTriangle },
  { id: 'design', label: 'Design systems' },
  { id: 'week', label: 'This week' },
];

const projects: Project[] = [
  {
    id: 'synthwave-stories',
    name: 'Synthwave Stories',
    category: 'Case Study',
    status: 'In review',
    statusTone: 'review',
    priority: 'High focus',
    description:
      'Narrative-driven product storytelling paired with interactive prototypes for the new marketing site.',
    tags: ['Brand strategy', 'Interactive web', 'Motion'],
    meta: [
      { label: 'Launch window', value: 'Aug 22 · 3 weeks', icon: Calendar },
      { label: 'Next milestone', value: 'Final QA review', icon: Target },
      { label: 'Collaboration', value: 'Design × Marketing', icon: Users },
    ],
    progress: 76,
    tasksCompleted: 28,
    tasksTotal: 36,
    healthState: 'good',
    healthLabel: 'On track',
    team: [
      { name: 'Lara Owens', role: 'Art direction', initials: 'LO', color: '#f97316' },
      { name: 'Mina Patel', role: 'UX research', initials: 'MP', color: '#6366f1' },
      { name: 'Jasper Lin', role: 'Content strategy', initials: 'JL', color: '#10b981' },
    ],
    milestones: [
      { title: 'Research synthesis', caption: 'Complete', state: 'completed' },
      { title: 'QA review', caption: 'Due Aug 18', state: 'active' },
      { title: 'Client presentation', caption: 'Aug 24', state: 'upcoming' },
    ],
  },
  {
    id: 'lumen-experience',
    name: 'Lumen Experience',
    category: 'Product launch',
    status: 'In execution',
    statusTone: 'execution',
    priority: 'Launch sprint',
    description:
      'Immersive product demo built with real-time data visualisation and guided onboarding flows.',
    tags: ['Product marketing', '3D visuals', 'Growth'],
    meta: [
      { label: 'Launch window', value: 'Sep 4 · 5 weeks', icon: Calendar },
      { label: 'Next milestone', value: 'Beta invite drop', icon: Target },
      { label: 'Collaboration', value: 'Product × Growth', icon: Users },
    ],
    progress: 64,
    tasksCompleted: 41,
    tasksTotal: 64,
    healthState: 'watch',
    healthLabel: 'Scope review',
    team: [
      { name: 'Alyssa Moore', role: 'Product design', initials: 'AM', color: '#ec4899' },
      { name: 'Noah Kim', role: 'Engineering', initials: 'NK', color: '#22c55e' },
      { name: 'Sasha Reed', role: 'Marketing', initials: 'SR', color: '#f97316' },
    ],
    milestones: [
      { title: 'Prototype handoff', caption: 'Done', state: 'completed' },
      { title: 'Scope alignment', caption: 'This week', state: 'active' },
      { title: 'Launch rehearsal', caption: 'Sep 1', state: 'upcoming' },
    ],
  },
  {
    id: 'aurora-brand-refresh',
    name: 'Aurora Brand Refresh',
    category: 'Brand system',
    status: 'In planning',
    statusTone: 'planning',
    priority: 'Discovery',
    description:
      'Elevated design system with adaptive color language, component library, and storytelling toolkit.',
    tags: ['Identity', 'Design ops', 'Guidelines'],
    meta: [
      { label: 'Launch window', value: 'Oct 12 · 8 weeks', icon: Calendar },
      { label: 'Next milestone', value: 'Stakeholder workshops', icon: Target },
      { label: 'Collaboration', value: 'Brand × Ops', icon: Users },
    ],
    progress: 38,
    tasksCompleted: 12,
    tasksTotal: 32,
    healthState: 'good',
    healthLabel: 'Healthy pace',
    team: [
      { name: 'Diego Summers', role: 'Brand lead', initials: 'DS', color: '#3b82f6' },
      { name: 'Kim Lee', role: 'Design ops', initials: 'KL', color: '#8b5cf6' },
      { name: 'Priya Shah', role: 'Storytelling', initials: 'PS', color: '#f59e0b' },
    ],
    milestones: [
      { title: 'Audience research', caption: 'Complete', state: 'completed' },
      { title: 'Moodboard sprint', caption: 'Aug 27', state: 'active' },
      { title: 'System rollout', caption: 'Oct 4', state: 'upcoming' },
    ],
  },
];

const teamUpdates: TeamUpdate[] = [
  {
    id: 'design-review',
    status: 'complete',
    title: 'Design research ready for review',
    detail: 'Persona mapping & journeys uploaded to workspace.',
    time: 'Today · 10:30 AM',
  },
  {
    id: 'dev-sync',
    status: 'pending',
    title: 'Engineering sync scheduled',
    detail: 'Frontend + platform walkthrough with QA team.',
    time: 'Tomorrow · 2:00 PM',
  },
  {
    id: 'risk-flag',
    status: 'risk',
    title: 'Content dependencies flagged',
    detail: 'Awaiting final copy for hero narrative.',
    time: 'Needs update · 3 owners',
  },
];

const upcomingReviews: UpcomingReview[] = [
  {
    id: 'review-1',
    title: 'Portfolio walkthrough dry run',
    owner: 'Synthwave Stories',
    time: 'Aug 18 · 4:00 PM',
  },
  {
    id: 'review-2',
    title: 'Brand system component audit',
    owner: 'Aurora Refresh',
    time: 'Aug 20 · 11:00 AM',
  },
  {
    id: 'review-3',
    title: 'Beta success metrics alignment',
    owner: 'Lumen Experience',
    time: 'Aug 22 · 9:30 AM',
  },
];

const templateActions = ['Campaign blueprint', 'Case study outline', 'Launch checklist'];

const TestPage: React.FC = () => {
  return (
    <div className="projects-center-page">
      <div className="projects-center-container">
        <div className="projects-center-backdrop" aria-hidden="true" />
        <div className="projects-center-shell">
          <section className="pc-glass-card">
            <header className="pc-header">
              <div className="pc-header-top">
                <div className="pc-header-intro">
                  <span className="pc-pill">Creator hub · Weekly briefing</span>
                  <h1>Projects Center</h1>
                  <p>
                    Plan, track, and launch portfolio-ready stories with a clear pulse on momentum,
                    ownership, and upcoming deadlines.
                  </p>
                </div>
                <div className="pc-header-actions-wrapper">
                  <div className="pc-header-actions">
                    <button type="button" className="pc-secondary-btn">
                      <span className="icon">
                        <Sparkles size={16} />
                      </span>
                      AI suggestions
                    </button>
                    <button type="button" className="pc-primary-btn">
                      <span className="icon">
                        <Plus size={16} />
                      </span>
                      New project
                    </button>
                  </div>
                  <div className="pc-header-user">
                    <span className="pc-avatar" aria-hidden="true">
                      AO
                    </span>
                    <div>
                      <strong>Alejandro Ortiz</strong>
                      <span>Portfolio strategist</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pc-search-row">
                <div className="pc-search-input">
                  <Search size={18} />
                  <input type="search" placeholder="Search projects, tasks, and collaborators…" />
                  <button type="button" className="pc-inline-action">
                    <Filter size={16} />
                    Filters
                  </button>
                </div>
                <div className="pc-quick-filters" role="group" aria-label="Quick filters">
                  {filters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        className={`pc-filter-chip${filter.active ? ' active' : ''}`}
                      >
                        {Icon ? <Icon size={14} /> : null}
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pc-stats-grid">
                {stats.map((stat) => (
                  <article key={stat.id} className="pc-stat-card" style={{ background: stat.background }}>
                    <span className="pc-stat-label">{stat.title}</span>
                    <div className="pc-stat-value">
                      {stat.value}
                      {stat.suffix ? <span className="suffix">{stat.suffix}</span> : null}
                    </div>
                    <div className="pc-stat-footer">
                      <span>{stat.description}</span>
                      <span className={`pc-stat-change ${stat.changeTone}`}>
                        {stat.changeTone === 'up' ? (
                          <TrendingUp size={15} />
                        ) : stat.changeTone === 'down' ? (
                          <AlertTriangle size={15} />
                        ) : (
                          <Clock size={15} />
                        )}
                        {stat.change}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </header>
          </section>

          <div className="pc-main-grid">
            <section className="pc-section-card">
              <div className="pc-section-header">
                <div>
                  <h2>Active projects</h2>
                  <span>5 updates since yesterday · aligned with quarterly roadmap</span>
                </div>
                <button type="button" className="pc-link">
                  View pipeline
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="pc-project-list">
                {projects.map((project) => (
                  <article key={project.id} className="pc-project-card">
                    <div>
                      <div className="pc-project-header">
                        <span className="pc-type-badge">{project.category}</span>
                        <span className={`pc-status ${project.statusTone}`}>{project.status}</span>
                      </div>
                      <div className="pc-project-title">
                        <h3>{project.name}</h3>
                        <span className="pc-priority">
                          <Star size={14} />
                          {project.priority}
                        </span>
                      </div>
                      <p className="pc-project-description">{project.description}</p>
                      <div className="pc-project-tags">
                        {project.tags.map((tag) => (
                          <span key={tag} className="pc-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="pc-project-meta">
                        {project.meta.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="pc-meta-item">
                              <Icon />
                              <div>
                                <span className="pc-meta-label">{item.label}</span>
                                <span className="pc-meta-value">{item.value}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pc-project-progress">
                      <div className="pc-progress-header">
                        <span>Progress</span>
                        <span className="pc-progress-value">{project.progress}%</span>
                      </div>
                      <div className="pc-progress-bar">
                        <div className="pc-progress-fill" style={{ width: `${project.progress}%` }} />
                      </div>
                      <div className="pc-progress-footer">
                        <span>
                          {project.tasksCompleted}/{project.tasksTotal} tasks
                        </span>
                        <span
                          className={`pc-health${project.healthState === 'good' ? '' : ` ${project.healthState}`}`}
                        >
                          {project.healthLabel}
                        </span>
                      </div>
                      <div className="pc-avatar-group">
                        {project.team.map((member) => (
                          <span
                            key={member.initials}
                            className="pc-avatar"
                            style={{ background: member.color }}
                            title={`${member.name} · ${member.role}`}
                          >
                            {member.initials}
                          </span>
                        ))}
                        <button type="button" className="pc-add-collaborator">
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="pc-progress-milestones">
                        {project.milestones.map((milestone) => (
                          <div key={milestone.title} className={`pc-milestone ${milestone.state}`}>
                            <div>
                              <strong>{milestone.title}</strong>
                              <small>{milestone.caption}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="pc-sidebar">
              <div className="pc-side-card">
                <div className="pc-side-header">
                  <h3>Team updates</h3>
                  <span>Shared across 3 pods</span>
                </div>
                {teamUpdates.map((update) => (
                  <div key={update.id} className={`pc-update ${update.status}`}>
                    <div className="pc-update-title">
                      {update.status === 'complete' ? (
                        <CheckCircle2 />
                      ) : update.status === 'pending' ? (
                        <Clock />
                      ) : (
                        <AlertTriangle />
                      )}
                      <strong>{update.title}</strong>
                    </div>
                    <span>{update.detail}</span>
                    <span>{update.time}</span>
                  </div>
                ))}
              </div>

              <div className="pc-resource-card">
                <h3>Portfolio resources</h3>
                <p>
                  Save time with curated playbooks and templates that plug directly into your launch
                  workflow.
                </p>
                <div className="pc-resource-actions">
                  {templateActions.map((action) => (
                    <button key={action} type="button">
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pc-side-card">
                <div className="pc-side-header">
                  <h3>Upcoming reviews</h3>
                  <span>This week&apos;s checkpoints</span>
                </div>
                <div className="pc-upcoming-list">
                  {upcomingReviews.map((item) => (
                    <div key={item.id} className="pc-upcoming-item">
                      <strong>{item.title}</strong>
                      <div className="pc-upcoming-meta">
                        <span>{item.owner}</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
