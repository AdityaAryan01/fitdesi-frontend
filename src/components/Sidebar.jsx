import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { 
  LayoutDashboard, BookOpen, User, Zap, LogOut,
  Plus, Trash2, MessageCircle, Edit2, Loader
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getThreads, createThread, deleteThread, renameThread } from '../api'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { threadId: activeThreadId } = useParams()
  const navigate = useNavigate()

  const [threads, setThreads]       = useState([])
  const [loadingNew, setLoadingNew] = useState(false)

  const fetchThreads = () => {
    if (!user?.id) return
    getThreads(user.id)
      .then(data => setThreads(Array.isArray(data) ? data : []))
      .catch(() => setThreads([]))
  }

  // Fetch on mount
  useEffect(() => { fetchThreads() }, [user?.id])

  // Re-fetch whenever the active thread changes — catches auto-created threads
  useEffect(() => { fetchThreads() }, [activeThreadId])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNewChat = async () => {
    if (!user?.id || loadingNew) return
    setLoadingNew(true)
    try {
      const newThread = await createThread(user.id)
      setThreads(prev => [newThread, ...prev])
      navigate(`/chat/${newThread.id}`)
    } catch {
      console.error("Failed to create new chat")
    } finally {
      setLoadingNew(false)
    }
  }

  const handleDeleteThread = async (e, tid) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm("Bhai, conversation delete karni hai?")) return
    try {
      await deleteThread(user.id, tid)
      setThreads(prev => prev.filter(t => t.id !== tid))
      if (activeThreadId === tid) navigate('/chat')
    } catch { console.error("Delete failed") }
  }

  const handleRenameThread = async (e, tid, currentTitle) => {
    e.preventDefault()
    e.stopPropagation()
    const newTitle = window.prompt("Enter new name for this chat:", currentTitle)
    if (newTitle && newTitle.trim()) {
      try {
        await renameThread(user.id, tid, newTitle.trim())
        setThreads(prev => prev.map(t => t.id === tid ? { ...t, title: newTitle.trim() } : t))
      } catch { console.error("Rename failed") }
    }
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className={styles.logoIcon}>
          <Zap size={20} fill="currentColor" />
        </div>
        <div>
          <div className={styles.logoText}>FitDesi</div>
          <div className={styles.logoSub}>AI Gym Bro</div>
        </div>
      </div>

      {/* New Chat Button */}
      <button className={styles.newChatBtn} onClick={handleNewChat} disabled={loadingNew}>
        {loadingNew ? <Loader size={16} className={styles.spin} /> : <Plus size={18} />}
        <span>New Conversation</span>
      </button>

      <div className={styles.divider} />

      {/* Thread History */}
      <div className={styles.historySection}>
        <div className={styles.sectionLabel}>Recent History</div>
        <div className={styles.threadList}>
          {threads.map((t) => (
            <NavLink
              key={t.id}
              to={`/chat/${t.id}`}
              className={({ isActive }) => `${styles.threadItem} ${isActive ? styles.activeThread : ''}`}
            >
              <MessageCircle size={14} className={styles.threadIcon} />
              <span className={styles.threadTitle}>{t.title}</span>
              <div className={styles.threadActions}>
                <button className={styles.actionBtn} onClick={(e) => handleRenameThread(e, t.id, t.title)} title="Rename">
                  <Edit2 size={12} />
                </button>
                <button className={styles.actionBtn} onClick={(e) => handleDeleteThread(e, t.id)} title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </NavLink>
          ))}
          {threads.length === 0 && (
            <div className={styles.emptyHistory}>No recent chats</div>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Nav Links */}
      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <LayoutDashboard size={18} /><span>Dashboard</span>
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <BookOpen size={18} /><span>Meal Log</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <User size={18} /><span>Profile</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className={styles.bottom}>
        <div className={styles.divider} />
        {user && (
          <div className={styles.userPill}>
            <div className={styles.avatar}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userGoal}>
                <span className="badge badge-accent">{user.goal || 'No goal'}</span>
              </div>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} /><span>Sign Out</span>
        </button>
        <div className={styles.versionTag}>v0.1.0 · beta</div>
      </div>
    </aside>
  )
}