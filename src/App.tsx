// src/App.tsx
import React from 'react'
import PortfolioEditor from './components/portfolioeditor'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 bg-blue-600 text-white shadow">
        <h1 className="text-2xl font-bold">Portfolio Intake</h1>
      </header>

      <main className="p-4">
        <PortfolioEditor />
      </main>
    </div>
  )
}

export default App
