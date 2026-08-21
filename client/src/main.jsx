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
          position="top-center"
          reverseOrder={false}
          gutter={10}
          toastOptions={{
            duration: 4500,
            className: 'civic-toast',
            style: {
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: '#0f172a',
              padding: '12px 18px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 600,
              fontFamily: "'Source Sans 3', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.14), 0 6px 14px -2px rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              maxWidth: '460px',
              lineHeight: 1.45,
            },
            success: {
              duration: 4000,
              iconTheme: {
                primary: '#15803d',
                secondary: '#ffffff',
              },
              style: {
                borderLeft: '4px solid #15803d',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 40%)',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#dc2626',
                secondary: '#ffffff',
              },
              style: {
                borderLeft: '4px solid #dc2626',
                background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 40%)',
              },
            },
            loading: {
              iconTheme: {
                primary: '#0284c7',
                secondary: '#ffffff',
              },
              style: {
                borderLeft: '4px solid #0284c7',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 40%)',
              },
            },
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
