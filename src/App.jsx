// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import LogsPage from './pages/LogsPage'
import ProfilePage from './pages/ProfilePage'

// ── Protected Layout ─────────────────────────────────────────────
function ProtectedLayout() {
  const { user, firebaseUser, authLoading } = useAuth()

  // While Firebase is checking the session, show nothing (prevents flash to /login)
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: 14 }}>
          Loading...
        </div>
      </div>
    )
  }

  // No Firebase session at all → login
  if (!firebaseUser) return <Navigate to="/login" replace />

  // Firebase session exists but no fitness profile yet → onboarding
  // (This handles the edge case where user closes browser mid-onboarding)
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="app-shell">
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/chat"           element={<ChatPage />} />
          <Route path="/chat/:threadId" element={<ChatPage />} />
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/logs"           element={<LogsPage />} />
          <Route path="/profile"        element={<ProfilePage />} />
          <Route path="*"               element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>
    </div>
  )
}

// ── Public Route Guard ───────────────────────────────────────────
function PublicRoute({ children }) {
  const { user, firebaseUser, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: 14 }}>
          Loading...
        </div>
      </div>
    )
  }

  // Already fully logged in → skip login page
  return (firebaseUser && user) ? <Navigate to="/chat" replace /> : children
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/*"     element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  )
}