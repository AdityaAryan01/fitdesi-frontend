import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import LogsPage from './pages/LogsPage'
import ProfilePage from './pages/ProfilePage'

// --- PROTECTED LAYOUT ---
function ProtectedLayout() {
  const { user } = useAuth()
  
  // If user is not logged in, kick them to login page
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="app-shell">
      {/* Background Aesthetic Orbs */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      
      {/* Persistent Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          {/* 
              UPDATE: We now have two routes for Chat. 
              1. /chat -> Opens a fresh, empty chat
              2. /chat/:threadId -> Opens a specific conversation from history
          */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:threadId" element={<ChatPage />} />
          
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/logs"      element={<LogsPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
          
          {/* Fallback: If route doesn't exist, go to chat */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>
    </div>
  )
}

// --- PUBLIC ROUTE GUARD ---
function PublicRoute({ children }) {
  const { user } = useAuth()
  // If user is already logged in, they shouldn't see the login page
  return user ? <Navigate to="/chat" replace /> : children
}

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Route */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* All other routes are nested inside the Protected Layout */}
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  )
}