// src/App.tsx
import React, { Suspense, useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
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
