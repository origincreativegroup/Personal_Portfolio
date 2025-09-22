import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {Wand2, 
  Eye,Save,Brain,
  Zap,
  Target,
  Users,
  TrendingUp,Lightbulb,
  RefreshCw
} from 'lucide-react'
import { cn } from '../shared/utils'
import ModernButton from '../components/ui/ModernButton'
import ModernCard from '../components/ui/ModernCard'
import AIPortfolioBuilder from '../components/portfolio/AIPortfolioBuilder'
import { Portfolio, Project, CaseStudy } from '../types/portfolio'

// ===== MOCK DATA =====

const mockProjects: Project[] = [
  {
    id: 'project-1',
    title: 'E-commerce Platform Redesign',
    description: 'Complete redesign of a modern e-commerce platform focusing on user experience and conversion optimization.',
    slug: 'ecommerce-platform-redesign',
    coverImage: 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=E-commerce+Platform',
    category: 'Web Design',
    tags: ['UI/UX', 'E-commerce', 'React', 'Figma'],
    status: 'published',
    featured: true,
    order: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    assets: [
      {
        id: 'asset-1',
        name: 'hero-image.jpg',
        type: 'image',
        size: 2048000,
        mimeType: 'image/jpeg',
        dataUrl: 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=Hero+Image',
        addedAt: '2024-01-15T10:00:00Z',
        isHero: true,
        width: 800,
        height: 600
      }
    ],
    metadata: {
      client: 'TechCorp Inc.',
      role: 'Lead Designer',
      duration: '3 months',
      teamSize: 5,
      technologies: ['React', 'TypeScript', 'Figma', 'Adobe Creative Suite'],
      tools: ['Figma', 'Adobe XD', 'Sketch', 'Principle'],
      year: 2024,
      results: ['40% increase in conversion rates', '60% faster page load times', '95% user satisfaction score']
    }
  },
  {
    id: 'project-2',
    title: 'Mobile Banking App',
    description: 'Design and development of a secure mobile banking application with focus on accessibility and user trust.',
    slug: 'mobile-banking-app',
    coverImage: 'https://via.placeholder.com/800x600/10b981/ffffff?text=Mobile+Banking+App',
    category: 'Mobile Design',
    tags: ['Mobile', 'Fintech', 'Security', 'iOS', 'Android'],
    status: 'published',
    featured: false,
    order: 2,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-15T16:45:00Z',
    assets: [],
    metadata: {
      client: 'FinanceBank',
      role: 'UX Designer',
      duration: '6 months',
      teamSize: 8,
      technologies: ['React Native', 'Swift', 'Kotlin', 'Figma'],
      tools: ['Figma', 'Principle', 'Zeplin', 'Jira'],
      year: 2024,
      results: ['50% reduction in support tickets', '4.8/5 app store rating', '30% increase in user engagement']
    }
  }
]

const mockCaseStudies: CaseStudy[] = [
  {
    id: 'casestudy-1',
    title: 'How We Increased E-commerce Conversion by 40%',
    description: 'A detailed case study exploring the design process and user research that led to significant conversion improvements.',
    slug: 'ecommerce-conversion-case-study',
    projectId: 'project-1',
    coverImage: 'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Case+Study+1',
    status: 'published',
    featured: true,
    order: 1,
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-02-01T13:20:00Z',
    content: {
      problem: 'The existing e-commerce platform had a high bounce rate and low conversion rates, particularly on mobile devices.',
      solution: 'We redesigned the entire user journey with a mobile-first approach, focusing on trust signals and streamlined checkout.',
      process: [
        {
          title: 'User Research',
          description: 'Conducted interviews with 50+ users to understand pain points and behaviors.',
          duration: '2 weeks',
          tools: ['UserTesting', 'Figma', 'Miro']
        },
        {
          title: 'Wireframing',
          description: 'Created low-fidelity wireframes to test different layout approaches.',
          duration: '1 week',
          tools: ['Figma', 'Balsamiq']
        },
        {
          title: 'Prototyping',
          description: 'Built interactive prototypes to validate user flows and interactions.',
          duration: '2 weeks',
          tools: ['Figma', 'Principle']
        }
      ],
      results: 'Achieved 40% increase in conversion rates, 60% faster page load times, and 95% user satisfaction score.',
      impact: 'The redesign established a new standard for e-commerce UX in the industry and led to 3 new client acquisitions.',
      gallery: [],
      testimonials: [
        {
          id: 'testimonial-1',
          name: 'Sarah Johnson',
          role: 'Product Manager',
          company: 'TechCorp Inc.',
          content: 'The redesign exceeded our expectations. Our conversion rates have never been higher.',
          projectId: 'project-1',
          rating: 5
        }
      ]
    },
    metrics: {
      views: 1250,
      likes: 89,
      shares: 23,
      comments: 12,
      timeOnPage: 4.5
    }
  }
]

const mockPortfolio: Portfolio = {
  id: 'portfolio-1',
  title: 'Creative Portfolio',
  description: 'A showcase of innovative design solutions and creative problem-solving',
  slug: 'creative-portfolio',
  published: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
  settings: {
    theme: 'minimal',
    layout: 'grid',
    showCategories: true,
    showTags: true,
    showDates: true,
    showMetrics: true,
    enableFiltering: true,
    enableSearch: true,
    seo: {
      title: 'Creative Portfolio - Innovative Design Solutions',
      description: 'Explore my creative work and design solutions that drive business results.',
      keywords: ['design', 'UX', 'UI', 'creative', 'portfolio']
    }
  },
  projects: mockProjects,
  caseStudies: mockCaseStudies
}

// ===== COMPONENT =====

export default function AIPortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'analytics'>('builder')

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPortfolio(mockPortfolio)
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw size={48} className="animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-text-secondary dark:text-text-secondary-dark">Loading AI Portfolio Builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <RefreshCw size={32} className="text-primary-500" />
              <h1 className="text-4xl md:text-6xl font-bold text-text-primary dark:text-text-primary-dark">
                AI Portfolio Builder
              </h1>
            </div>
            <p className="text-xl text-text-secondary dark:text-text-secondary-dark mb-8">
              Transform your creative assets into compelling narratives that showcase your work and attract clients
            </p>
            <div className="flex items-center justify-center gap-4">
              <ModernButton
                variant="primary"
                size="lg"
                className="flex items-center gap-2"
              >
                <Wand2 size={20} />
                Start Building
              </ModernButton>
              <ModernButton
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Eye size={20} />
                View Demo
              </ModernButton>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-surface dark:bg-surface-dark">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
              Powered by AI
            </h2>
            <p className="text-lg text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto">
              Our AI analyzes your work and generates compelling narratives that tell your story
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Brain size={32} className="text-primary-500" />,
                title: 'Smart Analysis',
                description: 'AI analyzes your assets and projects to understand your creative process and expertise'
              },
              {
                icon: <Zap size={32} className="text-secondary-500" />,
                title: 'Auto-Generate',
                description: 'Instantly generate compelling narratives, case studies, and project descriptions'
              },
              {
                icon: <Target size={32} className="text-green-500" />,
                title: 'Optimize Impact',
                description: 'AI optimizes your content for maximum engagement and client attraction'
              },
              {
                icon: <Users size={32} className="text-purple-500" />,
                title: 'Audience Targeting',
                description: 'Tailor your narratives for different audiences: clients, peers, recruiters'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <ModernCard className="p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    {feature.description}
                  </p>
                </ModernCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          {/* Tab Navigation */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-1">
              {[
                { id: 'builder', label: 'AI Builder', icon: <Wand2 size={16} /> },
                { id: 'preview', label: 'Preview', icon: <Eye size={16} /> },
                { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200',
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'builder' && (
              <AIPortfolioBuilder
                initialPortfolio={portfolio}
                onSave={(updatedPortfolio) => {
                  setPortfolio(updatedPortfolio)
                  console.log('Portfolio saved:', updatedPortfolio)
                }}
                onPublish={(publishedPortfolio) => {
                  setPortfolio(publishedPortfolio)
                  console.log('Portfolio published:', publishedPortfolio)
                }}
              />
            )}

            {activeTab === 'preview' && (
              <div className="text-center py-12">
                <Eye size={64} className="text-text-tertiary dark:text-text-tertiary-dark mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                  Portfolio Preview
                </h3>
                <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
                  See how your portfolio will look to visitors
                </p>
                <ModernButton variant="primary" size="lg">
                  Launch Preview
                </ModernButton>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <TrendingUp size={64} className="text-text-tertiary dark:text-text-tertiary-dark mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                  Portfolio Analytics
                </h3>
                <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
                  Track your portfolio performance and engagement
                </p>
                <ModernButton variant="primary" size="lg">
                  View Analytics
                </ModernButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Portfolio?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Let AI help you create compelling narratives that showcase your work and attract clients
            </p>
            <div className="flex items-center justify-center gap-4">
              <ModernButton
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
              >
                <Wand2 size={20} />
                Start Free Trial
              </ModernButton>
              <ModernButton
                variant="outline"
                size="lg"
                className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-primary-500"
              >
                <Lightbulb size={20} />
                Learn More
              </ModernButton>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
