// src/hooks/useAuth.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // `user` = the full profile object (Firebase uid + fitness profile from our DB)
  // `firebaseUser` = raw Firebase user (email, uid, token)
  const [user, setUser]               = useState(null)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true) // true while Firebase checks session

  // ── Listen to Firebase session changes ──────────────────────────
  // This fires on page reload, tab switch, token refresh — handles
  // everything automatically. Replaces the old localStorage read.
  useEffect(() => {
    // Safety net — if Firebase takes >3 seconds on a slow connection,
    // stop blocking the UI and let the user see the login page instead
    const timeout = setTimeout(() => setAuthLoading(false), 3000)

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(timeout) // Firebase responded normally — cancel the timeout
      if (fbUser) {
        setFirebaseUser(fbUser)
        // Try to restore the fitness profile from localStorage
        // (set during onboarding — name, goal, macros etc.)
        try {
          const stored = localStorage.getItem(`fitdesi_profile_${fbUser.uid}`)
          if (stored) setUser(JSON.parse(stored))
          else setUser(null) // Firebase session exists but no profile yet → show onboarding
        } catch {
          setUser(null)
        }
      } else {
        // Firebase says no session — clear everything
        setFirebaseUser(null)
        setUser(null)
      }
      setAuthLoading(false)
    })
    return () => { unsubscribe(); clearTimeout(timeout) } // cleanup both on unmount
  }, [])

  // Called after onboarding form is submitted and backend returns the profile
  const login = (userData) => {
    setUser(userData)
    // Store profile keyed by Firebase uid so multiple users on same browser work
    if (firebaseUser?.uid) {
      localStorage.setItem(`fitdesi_profile_${firebaseUser.uid}`, JSON.stringify(userData))
    }
  }

  // Full sign out — clears Firebase session + local profile
  const logout = async () => {
    if (firebaseUser?.uid) {
      localStorage.removeItem(`fitdesi_profile_${firebaseUser.uid}`)
    }
    setUser(null)
    setFirebaseUser(null)
    await signOut(auth)
  }

  // Helper: get a fresh Firebase ID token to send to the backend
  const getToken = async () => {
    if (!firebaseUser) return null
    return await firebaseUser.getIdToken()
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, authLoading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)