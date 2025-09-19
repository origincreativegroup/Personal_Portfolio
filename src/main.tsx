// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from './state/queryClient'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { SyncProvider } from './context/SyncProvider'
import queryClient from './state/queryClient'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SyncProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
