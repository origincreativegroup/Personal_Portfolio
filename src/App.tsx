// src/App.tsx
import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import NewIntakePage from './pages/NewIntakePage'
import NewEditorPage from './pages/NewEditorPage'
import SettingsPage from './pages/SettingsPage'
import PortfolioForgeAIAnalysis from './pages/PortfolioForgeAIAnalysis'
import OpenAISettingsPage from './pages/OpenAISettingsPage'
// Legacy pages for backward compatibility
import IntakePage from './pages/IntakePage'
import EditorPage from './pages/EditorPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main>
        <Routes>
          {/* Default route redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* New UI routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create" element={<NewIntakePage />} />
          <Route path="/editor/:projectId" element={<NewEditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* AI Analysis route */}
          <Route path="/analysis" element={<PortfolioForgeAIAnalysis />} />

          {/* Legacy routes for backward compatibility */}
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/editor-legacy/:slug" element={<EditorPage />} />
          <Route path="/settings/openai" element={<OpenAISettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
