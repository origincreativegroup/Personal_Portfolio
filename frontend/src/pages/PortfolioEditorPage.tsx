import { useState } from 'react'
import { Save, Eye, Download, Palette, Layout, Settings } from 'lucide-react'
import Button from '../components/ui/Button'
import { PageHeader } from '../components/navigation/Breadcrumbs'
import GrapesJSEditor from '../components/GrapesJSEditor'

export default function PortfolioEditorPage() {
  const [showVisualEditor, setShowVisualEditor] = useState(false)
  const [editorHtml, setEditorHtml] = useState(`
    <div class="portfolio">
      <header class="portfolio-header">
        <h1>Your Portfolio</h1>
        <p>Welcome to your professional portfolio</p>
      </header>
      <main class="portfolio-content">
        <section class="portfolio-section">
          <h2>About Me</h2>
          <p>Tell your story and showcase your expertise...</p>
        </section>
        <section class="portfolio-section">
          <h2>Featured Projects</h2>
          <p>Highlight your best work...</p>
        </section>
      </main>
    </div>
  `)
  const [editorCss, setEditorCss] = useState(`
    .portfolio {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: 'Inter', sans-serif;
    }
    .portfolio-header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 1rem;
    }
    .portfolio-header h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }
    .portfolio-header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    .portfolio-content {
      display: grid;
      gap: 2rem;
    }
    .portfolio-section {
      padding: 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .portfolio-section h2 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .portfolio-section p {
      color: #666;
      line-height: 1.6;
    }
  `)

  const handleEditorChange = (document: { html: string; css: string }) => {
    setEditorHtml(document.html)
    setEditorCss(document.css)
  }

  const portfolioBlocks = [
    {
      id: 'hero-section',
      label: 'Hero Section',
      category: 'Layout',
      content: `
        <section class="hero">
          <div class="hero-content">
            <h1>Your Name</h1>
            <p class="hero-subtitle">Your Professional Title</p>
            <p class="hero-description">Brief introduction about yourself and your expertise</p>
            <div class="hero-actions">
              <a href="#contact" class="btn btn-primary">Get In Touch</a>
              <a href="#work" class="btn btn-secondary">View My Work</a>
            </div>
          </div>
        </section>
      `
    },
    {
      id: 'about-section',
      label: 'About Section',
      category: 'Content',
      content: `
        <section class="about">
          <h2>About Me</h2>
          <p>Tell your story, your background, and what makes you unique. This is where you can share your passion, experience, and what drives you in your work.</p>
          <div class="skills">
            <h3>Skills</h3>
            <ul class="skills-list">
              <li>Design</li>
              <li>Development</li>
              <li>Strategy</li>
            </ul>
          </div>
        </section>
      `
    },
    {
      id: 'projects-section',
      label: 'Projects Grid',
      category: 'Content',
      content: `
        <section class="projects">
          <h2>Featured Projects</h2>
          <div class="projects-grid">
            <div class="project-card">
              <h3>Project Title</h3>
              <p>Brief description of the project and its impact.</p>
              <a href="#" class="project-link">View Project</a>
            </div>
            <div class="project-card">
              <h3>Project Title</h3>
              <p>Brief description of the project and its impact.</p>
              <a href="#" class="project-link">View Project</a>
            </div>
          </div>
        </section>
      `
    },
    {
      id: 'contact-section',
      label: 'Contact Section',
      category: 'Content',
      content: `
        <section class="contact">
          <h2>Let's Work Together</h2>
          <p>Ready to start your next project? Get in touch and let's discuss how we can bring your ideas to life.</p>
          <div class="contact-info">
            <a href="mailto:your@email.com" class="contact-link">your@email.com</a>
            <a href="https://linkedin.com/in/yourprofile" class="contact-link">LinkedIn</a>
            <a href="https://github.com/yourusername" class="contact-link">GitHub</a>
          </div>
        </section>
      `
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Portfolio Editor"
        subtitle="Design and customize your professional portfolio"
        actions={
          <div className="flex items-center space-x-3">
            <Button variant="outline" icon={<Eye className="w-4 h-4" />}>
              Preview
            </Button>
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>
              Export
            </Button>
            <Button variant="primary" icon={<Save className="w-4 h-4" />}>
              Save Portfolio
            </Button>
          </div>
        }
      />

      <div className="py-8">
        <div className="container-responsive">
          <main className="space-y-8">
            <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Visual Portfolio Builder</h2>
              <p className="text-sm text-text-secondary">Create a stunning portfolio with drag-and-drop components</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                icon={<Layout className="w-4 h-4" />}
                onClick={() => setShowVisualEditor(!showVisualEditor)}
              >
                {showVisualEditor ? 'Hide Editor' : 'Show Editor'}
              </Button>
              <Button
                variant="primary"
                icon={<Settings className="w-4 h-4" />}
              >
                Portfolio Settings
              </Button>
            </div>
          </div>

          {showVisualEditor ? (
            <div className="border border-border rounded-xl overflow-hidden" style={{ height: '700px' }}>
              <GrapesJSEditor
                initialHtml={editorHtml}
                initialCss={editorCss}
                blocks={portfolioBlocks}
                onChange={handleEditorChange}
                height="700px"
                className="w-full"
              />
            </div>
          ) : (
            <div className="upload-dropzone">
              <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-text-primary">Portfolio Builder Ready</h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Click "Show Editor" to start building your portfolio with drag-and-drop sections,
                customizable layouts, and professional styling.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  icon={<Layout className="w-4 h-4" />}
                  onClick={() => setShowVisualEditor(true)}
                >
                  Launch Portfolio Builder
                </Button>
                <Button
                  variant="primary"
                  icon={<Eye className="w-4 h-4" />}
                >
                  Preview Portfolio
                </Button>
              </div>
            </div>
          )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
