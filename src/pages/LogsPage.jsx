import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Flame, Dumbbell, Calendar, Search, RefreshCw, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getMealLogs, deleteMealLog, getUser, startUserDay, endUserDay } from '../api'
import styles from './LogsPage.module.css'

export default function LogsPage() {
  const { user } = useAuth()
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [search, setSearch]   = useState('')

  // Day Tracking State
  const [dayActive, setDayActive] = useState(false)
  const [dayStartDate, setDayStartDate] = useState(null)
  const [showOldDayPrompt, setShowOldDayPrompt] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  const handleDelete = async (logId) => {
    if (!user?.id || !window.confirm('Delete this meal log?')) return
    try {
      await deleteMealLog(user.id, logId)
      setLogs(prev => prev.filter(l => l.id !== logId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(false)
    try {
      // 1. Fetch user to get tracking status
      const uProfile = await getUser(String(user.id))
      const isActive = !!uProfile.active_tracking_date
      setDayActive(isActive)
      
      if (isActive && uProfile.active_tracking_start) {
        setDayStartDate(new Date(uProfile.active_tracking_start + 'Z')) // ensure correct UTC/local mapping
        
        // check if old
        const start = new Date(uProfile.active_tracking_start + 'Z')
        const diffHours = (new Date() - start) / (1000 * 60 * 60)
        if (diffHours > 16) {
          setShowOldDayPrompt(true)
        } else {
          setShowOldDayPrompt(false)
        }
      } else {
        setDayStartDate(null)
        setShowOldDayPrompt(false)
      }

      // 2. Fetch logs
      const data = await getMealLogs(String(user.id))
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      setError(true)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const handleStartDay = async () => {
    if (!user?.id) return
    setLoadingAction(true)
    try {
      await startUserDay(user.id)
      await fetchLogs()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleEndDay = async () => {
    if (!user?.id) return
    setLoadingAction(true)
    try {
      await endUserDay(user.id)
      await fetchLogs()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAction(false)
    }
  }

  useEffect(() => { 
    if (user?.id) {
        fetchLogs(); 
    }
}, [user?.id]); // Only re-run if the user actually changes

  const displayLogs = logs.filter(l =>
    l.food_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalCal = logs.reduce((a, l) => a + Number(l.calories || 0), 0)
  const totalPro = logs.reduce((a, l) => a + Number(l.protein || 0), 0)

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className={styles.page}>
      
      {showOldDayPrompt && (
        <div className={styles.warningAlert}>
          <div style={{ flex: 1 }}>
            <strong>Forgot to end your day?</strong>
             <div style={{ fontSize: '0.85rem' }}>It looks like yesterday's tracking session is still active. End it now to start a new day fresh.</div>
          </div>
          <button className="btn" disabled={loadingAction} onClick={handleEndDay} style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>
            End Yesterday
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Meal Log</h1>
          <div className={styles.headerSub}>
            <Calendar size={13} />
            <span>{today}</span>
            {dayActive ? (
                <span className={styles.activeBadge} style={{ color: 'var(--green)', border: '1px solid var(--border)', background: 'var(--green-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Active</span>
            ) : (
                <span className={styles.activeBadge} style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--bg-mid)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Not Started</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {dayActive ? (
            <button className="btn" onClick={handleEndDay} disabled={loadingAction} style={{ background: 'var(--bg-mid)', color: 'var(--text)', borderColor: 'var(--border)' }}>
              End My Day
            </button>
          ) : (
            <button className="btn" onClick={handleStartDay} disabled={loadingAction} style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
              Start My Day
            </button>
          )}
          <button className="btn btn-ghost" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={15} className={loading ? styles.spin : ''} />
          </button>
        </div>
      </div>

      {/* Summary bar — shows real totals from API */}
      <div className={`card ${styles.summaryBar}`}>
        <div className={styles.summaryItem}>
          <Flame size={16} color="var(--accent)" />
          <div>
            <div className={styles.summaryVal}>{Math.round(totalCal)}</div>
            <div className={styles.summaryLabel}>Total kcal</div>
          </div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <Dumbbell size={16} color="var(--green)" />
          <div>
            <div className={styles.summaryVal} style={{ color: 'var(--green)' }}>
              {Math.round(totalPro)}g
            </div>
            <div className={styles.summaryLabel}>Total protein</div>
          </div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <BookOpen size={16} color="var(--steel)" />
          <div>
            <div className={styles.summaryVal} style={{ color: 'var(--steel)' }}>
              {logs.length}
            </div>
            <div className={styles.summaryLabel}>Meals logged</div>
          </div>
        </div>
      </div>

      {/* Search */}
      {logs.length > 0 && (
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search meals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Log list */}
      <div className={styles.logList}>
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.spinner} />
            <span>Loading today's meals...</span>
          </div>

        ) : error ? (
          <div className={styles.empty}>
            <BookOpen size={32} color="var(--text-muted)" />
            <span>Couldn't fetch logs. Is the backend running?</span>
            <button className="btn btn-ghost" onClick={fetchLogs} style={{ marginTop: 8 }}>
              Try again
            </button>
          </div>

        ) : displayLogs.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={32} color="var(--text-muted)" />
            <span>
              {search
                ? `No meals matching "${search}"`
                : 'No meals logged today. Tell the gym bro what you ate! 💪'
              }
            </span>
          </div>

        ) : (
          displayLogs.map((log, i) => (
            <div
              key={log.id || i}
              className={`card ${styles.logItem} animate-fade-up`}
              style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className={styles.logLeft}>
                <div className={styles.logIndex}>{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className={styles.logName}>{log.food_name}</div>
                  <div className={styles.logTime}>
                    {log.date
                      ? new Date(log.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })
                      : 'Today'
                    }
                  </div>
                </div>
              </div>
              <div className={styles.logRight}>
                <div className={styles.logMacros}>
                  <div className={styles.macroPill} style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    <Flame size={11} />
                    {Math.round(log.calories)} kcal
                  </div>
                  <div className={styles.macroPill} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                    <Dumbbell size={11} />
                    {Math.round(log.protein)}g
                  </div>
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(log.id)} title="Delete log">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}