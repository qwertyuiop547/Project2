import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './lib/auth'

// Layout
import Layout from './components/Layout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Complaints from './pages/Complaints'
import ComplaintDetail from './pages/ComplaintDetail'
import CreateComplaint from './pages/CreateComplaint'
import Suggestions from './pages/Suggestions'
import CreateSuggestion from './pages/CreateSuggestion'
import Announcements from './pages/Announcements'
import Services from './pages/Services'
import Profile from './pages/Profile'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await checkAuth()
      setIsLoading(false)
    }
    init()
  }, [])

  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
      } />

      {/* Protected routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="complaints/new" element={<CreateComplaint />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="suggestions" element={<Suggestions />} />
        <Route path="suggestions/new" element={<CreateSuggestion />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="services" element={<Services />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
