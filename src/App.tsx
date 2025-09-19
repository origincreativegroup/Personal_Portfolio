// src/App.tsx
import React from 'react'
import { Link, Route, Routes, Navigate } from 'react-router-dom'
import IntakePage from './pages/IntakePage'
import EditorPage from './pages/EditorPage'
import PortfolioForgeAIAnalysis from './pages/PortfolioForgeAIAnalysis'
import OpenAISettingsPage from './pages/OpenAISettingsPage'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div>
            <p className="app-header__eyebrow">Workflow</p>
            <h1 className="app-header__title">Portfolio Intake</h1>
          </div>
          <nav className="app-nav">
            <Link to="/intake" className="app-nav__link">New project</Link>
            <Link to={{ pathname: '/intake', hash: '#saved-projects' }} className="app-nav__link">Saved projects</Link>
            <Link to="/analysis" className="app-nav__link">AI analysis</Link>
            <Link to="/settings/openai" className="app-nav__link">API keys</Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/intake" replace />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/editor/:slug" element={<EditorPage />} />
          <Route path="/analysis" element={<PortfolioForgeAIAnalysis />} />
          <Route path="/settings/openai" element={<OpenAISettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
