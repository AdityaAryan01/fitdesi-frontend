import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Flame, Dumbbell, Calendar, Search, RefreshCw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getMealLogs } from '../api'
import styles from './LogsPage.module.css'

export default function LogsPage() {
  const { user } = useAuth()
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [search, setSearch]   = useState('')

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(false)
    try {
      // Calls GET /api/user/{user_id}/logs — returns today's individual meal entries
      const data = await getMealLogs(String(user.id))
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      setError(true)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

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
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Meal Log</h1>
          <div className={styles.headerSub}>
            <Calendar size={13} />
            <span>{today}</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={15} className={loading ? styles.spin : ''} />
          Refresh
        </button>
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
            </div>
          ))
        )}
      </div>
    </div>
  )
}