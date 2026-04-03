import { useState, useEffect } from 'react'
import { Flame, Dumbbell, Droplets, TrendingUp, Award, Target } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { getProgress } from '../api'
import styles from './DashboardPage.module.css'

const WEEK_MOCK = [
  { day: 'Mon', cal: 1800, protein: 98 },
  { day: 'Tue', cal: 2100, protein: 115 },
  { day: 'Wed', cal: 1650, protein: 89 },
  { day: 'Thu', cal: 1950, protein: 108 },
  { day: 'Fri', cal: 2200, protein: 130 },
  { day: 'Sat', cal: 1700, protein: 95 },
  { day: 'Sun', cal: 0,    protein: 0 },
]

function RadialProgress({ value, max, color, size = 120, strokeWidth = 10, children }) {
  const pct = Math.min((value / max) * 100, 100)
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)

  return (
    <div className={styles.radialWrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="var(--bg-elevated)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className={styles.radialCenter}>{children}</div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, max, unit, color, colorClass }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className={`card ${styles.statCard}`}>
      <div className={styles.statHeader}>
        <div className={`${styles.statIcon} ${styles[colorClass]}`}>
          <Icon size={16} />
        </div>
        <span className={styles.statLabel}>{label}</span>
        <span className={`badge badge-${colorClass === 'iconAccent' ? 'accent' : colorClass === 'iconGreen' ? 'green' : 'steel'}`}>
          {pct}%
        </span>
      </div>
      <div className={styles.statValue}>
        <span className="stat-value" style={{ color }}>{value}</span>
        <span className={styles.statMax}>/ {max}{unit}</span>
      </div>
      <div className="progress-track" style={{ marginTop: 12 }}>
        <div className={`progress-fill progress-fill-${colorClass === 'iconAccent' ? 'accent' : colorClass === 'iconGreen' ? 'green' : 'steel'}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState({ total_calories: 0, total_protein: 0, meals: [] })
  const [loading, setLoading] = useState(true)

  const targetCal = user?.target_calories || 2000
  const targetPro = user?.target_protein || 120

  useEffect(() => {
    if (!user?.id) return
    getProgress(user.id)
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const calPct = Math.min(Math.round((progress.total_calories / targetCal) * 100), 100)
  const proPct = Math.min(Math.round((progress.total_protein / targetPro) * 100), 100)
  const remaining = Math.max(targetCal - progress.total_calories, 0)

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.greeting}>
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'},
            <span className={styles.name}> {user?.name?.split(' ')[0] || 'Bro'} 💪</span>
          </div>
          <div className={styles.date}>{today}</div>
        </div>
        <div className={`badge badge-accent`}>{user?.goal?.toUpperCase() || 'NO GOAL'}</div>
      </div>

      {/* Hero macro ring row */}
      <div className={styles.ringRow}>
        <div className={`card ${styles.ringCard}`}>
          <RadialProgress value={progress.total_calories} max={targetCal} color="var(--accent)" size={140} strokeWidth={11}>
            <div className={styles.ringInner}>
              <Flame size={16} color="var(--accent)" />
              <div className={styles.ringVal}>{progress.total_calories}</div>
              <div className={styles.ringUnit}>kcal</div>
            </div>
          </RadialProgress>
          <div className={styles.ringInfo}>
            <div className={styles.ringLabel}>Calories Today</div>
            <div className={styles.ringRemaining}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{remaining} kcal</span> remaining
            </div>
            <div className={styles.ringTarget}>Target: {targetCal} kcal</div>
          </div>
        </div>

        <div className={`card ${styles.ringCard}`}>
          <RadialProgress value={progress.total_protein} max={targetPro} color="var(--green)" size={140} strokeWidth={11}>
            <div className={styles.ringInner}>
              <Dumbbell size={16} color="var(--green)" />
              <div className={styles.ringVal} style={{ color: 'var(--green)' }}>{progress.total_protein}</div>
              <div className={styles.ringUnit}>g</div>
            </div>
          </RadialProgress>
          <div className={styles.ringInfo}>
            <div className={styles.ringLabel}>Protein Today</div>
            <div className={styles.ringRemaining}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                {Math.max(targetPro - progress.total_protein, 0)}g
              </span> to go
            </div>
            <div className={styles.ringTarget}>Target: {targetPro}g</div>
          </div>
        </div>

        <div className={`card ${styles.tipsCard}`}>
          <div className={styles.tipsHeader}>
            <Award size={16} color="var(--accent)" />
            <span>Daily Tips</span>
          </div>
          <div className={styles.tipsList}>
            {[
              calPct < 50 ? '⚡ Kal ke liye energy chahiye — kuch khao!' : calPct > 90 ? '🎯 Almost at your goal!' : '📊 Tracking is on point!',
              proPct < 60 ? '🥚 Protein low hai — eggs/dahi/dal lo' : '💪 Protein game strong!',
              `🔥 ${calPct}% of daily calories consumed`,
            ].map((t, i) => (
              <div key={i} className={styles.tipItem}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        <StatCard icon={Flame}   label="Calories" value={progress.total_calories} max={targetCal} unit=" kcal" color="var(--accent)" colorClass="iconAccent" />
        <StatCard icon={Dumbbell} label="Protein"  value={progress.total_protein}  max={targetPro}  unit="g"    color="var(--green)"  colorClass="iconGreen" />
        <StatCard icon={Target}  label="Goal"     value={calPct} max={100} unit="%" color="var(--steel)" colorClass="iconSteel" />
      </div>

      {/* Today's meals — populated from /progress meals[] array */}
      {progress.meals && progress.meals.length > 0 && (
        <div className={`card ${styles.mealsCard}`}>
          <div className={styles.chartHeader}>
            <Flame size={16} color="var(--accent)" />
            <span className={styles.chartTitle}>Today's Meals</span>
            <span className="badge badge-accent">{progress.meals.length} logged</span>
          </div>
          <div className={styles.mealsList}>
            {progress.meals.map((meal, i) => (
              <div key={i} className={styles.mealRow}>
                <span className={styles.mealName}>{meal.name}</span>
                <div className={styles.mealMacros}>
                  <span className={styles.mealKcal}>{Math.round(meal.kcal)} kcal</span>
                  <span className={styles.mealProtein}>{Math.round(meal.protein)}g protein</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly chart */}
      <div className={`card ${styles.chartCard}`}>
        <div className={styles.chartHeader}>
          <TrendingUp size={16} color="var(--accent)" />
          <span className={styles.chartTitle}>Weekly Calories</span>
          <span className="badge badge-accent">This Week</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={WEEK_MOCK} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono' }}
              labelStyle={{ color: 'var(--text-primary)' }}
              itemStyle={{ color: 'var(--text-secondary)' }}
            />
            <Area type="monotone" dataKey="cal" stroke="var(--accent)" strokeWidth={2} fill="url(#calGrad)" name="Calories" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Body stats */}
      {user && (
        <div className={`card ${styles.bodyCard}`}>
          <div className={styles.chartHeader}>
            <Droplets size={16} color="var(--steel)" />
            <span className={styles.chartTitle}>Your Stats</span>
          </div>
          <div className={styles.bodyGrid}>
            {[
              { label: 'Weight', value: user.weight_kg, unit: 'kg' },
              { label: 'Height', value: user.height_cm, unit: 'cm' },
              { label: 'Diet',   value: user.diet_type, unit: '' },
              { label: 'Goal',   value: user.goal,      unit: '' },
            ].map(s => (
              <div key={s.label} className={styles.bodyStat}>
                <div className={styles.bodyStatVal}>{s.value}{s.unit}</div>
                <div className={styles.bodyStatLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}