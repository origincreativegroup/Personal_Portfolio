// src/App.tsx
import React, { Suspense, useEffect } from 'react'
import { Route, Routes, Navigate, Link } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { DebugProvider, useDebug } from './contexts/DebugContext'
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'
import NotificationContainer from './components/NotificationContainer'
import LoadingSpinner from './components/ui/LoadingSpinner'
import globalErrorHandler from './utils/globalErrorHandler'
import logger from './utils/logger'

// Test page
import TestPage from './TestPage'

// Lazy load pages for code splitting
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const NewIntakePage = React.lazy(() => import('./pages/NewIntakePage'))
const NewEditorPage = React.lazy(() => import('./pages/NewEditorPage'))
const AssetManagementPage = React.lazy(() => import('./pages/AssetManagementPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const PortfolioForgeAIAnalysis = React.lazy(() => import('./pages/PortfolioForgeAIAnalysis'))
const OpenAISettingsPage = React.lazy(() => import('./pages/OpenAISettingsPage'))
const PortfolioEditorPage = React.lazy(() => import('./pages/PortfolioEditorPage'))
const PortfolioPage = React.lazy(() => import('./pages/PortfolioPage'))
// Case Study pages
const CaseStudyPage = React.lazy(() => import('./pages/CaseStudyPage'))
const CaseStudyEditorPage = React.lazy(() => import('./pages/CaseStudyEditorPage'))
// Legacy pages for backward compatibility
const IntakePage = React.lazy(() => import('./pages/IntakePage'))
const EditorPage = React.lazy(() => import('./pages/EditorPage'))

// Inner App component that can use debug context
function AppContent() {
  const { state, closeDebugPanel } = useDebug();

  useEffect(() => {
    // Initialize global error handling and logging
    globalErrorHandler.initialize();
    logger.info('Portfolio application initialized', 'system', {
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    return () => {
      globalErrorHandler.destroy();
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Cross-App Navigation Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Portfolio Forge
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">React App</span>
              </div>
              <nav className="flex items-center space-x-4">
                <Link
                  to="/case-studies"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Case Studies
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" text="Loading..." centered />
            </div>
          }>
            <Routes>
              {/* Test route */}
              <Route path="/test" element={<TestPage />} />

              {/* Default route redirects to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* New UI routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create" element={<NewIntakePage />} />
              <Route path="/editor/:projectId" element={<NewEditorPage />} />
              <Route path="/assets" element={<AssetManagementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/portfolio/editor" element={<PortfolioEditorPage />} />

              {/* Case Study routes */}
              <Route path="/case-studies" element={<CaseStudyPage />} />
              <Route path="/case-studies/:projectId/edit" element={<CaseStudyEditorPage />} />

              {/* AI Analysis route */}
              <Route path="/analysis" element={<PortfolioForgeAIAnalysis />} />

              {/* Legacy routes for backward compatibility */}
              <Route path="/intake" element={<IntakePage />} />
              <Route path="/editor-legacy/:slug" element={<EditorPage />} />
              <Route path="/settings/openai" element={<OpenAISettingsPage />} />
            </Routes>
          </Suspense>
        </main>
        <NotificationContainer />
      </div>

      {/* Debug Panel */}
      <DebugPanel
        isOpen={state.isDebugPanelOpen}
        onClose={closeDebugPanel}
      />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <DebugProvider>
        <ErrorBoundary
          component="App"
          enableAutomaticReporting={true}
          showErrorDetails={process.env.NODE_ENV === 'development'}
        >
          <AppContent />
        </ErrorBoundary>
      </DebugProvider>
    </AppProvider>
  )
}

export default App
