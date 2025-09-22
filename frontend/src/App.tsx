import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import { LoadingSpinner } from './components/ui'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load page components for better performance
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))
const ProjectEditor = lazy(() => import('./pages/ProjectEditor'))
const Projects = lazy(() => import('./pages/Projects'))
const AssetManagement = lazy(() => import('./pages/AssetManagement'))
const PortfolioEditorPage = lazy(() => import('./pages/PortfolioEditorPage'))
const AIPortfolioPage = lazy(() => import('./pages/AIPortfolioPage'))

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}>
          <Routes>
            <Route path="/" element={<EnhancedDashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug/edit" element={<ProjectEditor />} />
            <Route path="/projects/new" element={<ProjectEditor />} />
            <Route path="/projects/:slug/view" element={<ProjectEditor />} />
            <Route path="/assets" element={<AssetManagement />} />
            <Route path="/portfolio/editor" element={<PortfolioEditorPage />} />
            <Route path="/portfolio/ai" element={<AIPortfolioPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
