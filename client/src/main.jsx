import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// Suppress browser extension injected script errors (e.g. IDM 200.js, M_ID, chrome-extension:// Cache errors)
if (typeof window !== 'undefined') {
  const EXTENSION_NOISE = ['200.js', 'M_ID', 'chrome-extension', 'bis_skin_checked', 'data-grammarly']

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}\n${reason.stack || ''}`
        : String(reason ?? '')
    if (EXTENSION_NOISE.some((pattern) => msg.includes(pattern)) || msg.includes('chrome-extension')) {
      event.preventDefault()
      event.stopImmediatePropagation?.()
    }
  })

  window.addEventListener(
    'error',
    (event) => {
      const errorStr = `${event.message || ''} ${event.filename || ''} ${
        event.error instanceof Error ? event.error.stack || '' : ''
      }`
      if (EXTENSION_NOISE.some((pattern) => errorStr.includes(pattern))) {
        event.preventDefault()
        event.stopImmediatePropagation?.()
      }
    },
    true
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

// Register PWA Service Worker for caching and offline functionality
if ('serviceWorker' in navigator && !window.location.host.startsWith('localhost:5173_disabled')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Barangay Portal Service Worker registered successfully:', reg.scope)
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err)
      })
  })
}
