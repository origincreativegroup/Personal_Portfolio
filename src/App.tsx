import React from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import NewIntakePage from './pages/NewIntakePage'
import NewEditorPage from './pages/NewEditorPage'
import SettingsPage from './pages/SettingsPage'
import PortfolioForgeAIAnalysis from './pages/PortfolioForgeAIAnalysis'
import IntakePage from './pages/IntakePage'
import EditorPage from './pages/EditorPage'
import OpenAISettingsPage from './pages/OpenAISettingsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { RequireAuth, RequireGuest } from './components/RequireAuth'
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher'
import { useAuth } from './context/AuthContext'

const AppLayout: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Portfolio Forge Workspaces</h1>
            <p className="text-sm text-gray-600">Collaborate with your team in shared projects.</p>
          </div>
          <div className="flex items-center gap-4">
            <WorkspaceSwitcher />
            {user && (
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-gray-900">{user.name ?? user.email}</span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create" element={<NewIntakePage />} />
          <Route path="/editor/:projectId" element={<NewEditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/analysis" element={<PortfolioForgeAIAnalysis />} />

          {/* Legacy routes */}
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/editor-legacy/:slug" element={<EditorPage />} />
          <Route path="/settings/openai" element={<OpenAISettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
