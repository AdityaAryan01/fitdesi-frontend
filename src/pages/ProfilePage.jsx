import { useState } from 'react'
import { User, Edit3, Save, X, Zap, Flame, Dumbbell, Activity, Target } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import styles from './ProfilePage.module.css'

const GOALS = ['cut', 'bulk', 'maintenance']
const DIETS  = ['veg', 'non-veg', 'eggetarian']

function calcBMR(weight, height, age) {
  if (!weight || !height || !age) return null
  return Math.round(10 * weight + 6.25 * height - 5 * age + 5)
}

function getBMI(weight, height) {
  if (!weight || !height) return null
  const h = height / 100
  return (weight / (h * h)).toFixed(1)
}

function bmiLabel(bmi) {
  if (!bmi) return ''
  if (bmi < 18.5) return { text: 'Underweight', color: 'var(--steel)' }
  if (bmi < 25)   return { text: 'Normal',      color: 'var(--green)' }
  if (bmi < 30)   return { text: 'Overweight',  color: 'var(--accent)' }
  return               { text: 'Obese',         color: '#ef4444' }
}

export default function ProfilePage() {
  const { user, login } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    login({ ...user, ...form })
    setEditing(false)
  }
  const cancel = () => {
    setForm({ ...user })
    setEditing(false)
  }

  const bmi = getBMI(user?.weight_kg, user?.height_cm)
  const bmiInfo = bmiLabel(parseFloat(bmi))
  const bmr = calcBMR(user?.weight_kg, user?.height_cm, user?.age)

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={`card ${styles.heroCard}`}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.bigAvatar}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.heroName}>{user?.name || 'Anonymous Bro'}</h1>
            <div className={styles.heroBadges}>
              <span className="badge badge-accent">{user?.goal?.toUpperCase()}</span>
              <span className="badge badge-green">{user?.diet_type}</span>
              <span className={`badge badge-steel`}>ID: {String(user?.id || 'N/A').slice(0,10)}</span>
            </div>
          </div>
          <button
            className={`btn ${editing ? 'btn-ghost' : 'btn-primary'} ${styles.editBtn}`}
            onClick={() => editing ? cancel() : setEditing(true)}
          >
            {editing ? <><X size={15}/> Cancel</> : <><Edit3 size={15}/> Edit</>}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className={styles.statsGrid}>
        {[
          { icon: Activity, label: 'BMI',    val: bmi || '—',    sub: bmiInfo?.text, subColor: bmiInfo?.color },
          { icon: Flame,    label: 'BMR',    val: bmr ? `${bmr}` : '—', sub: 'kcal/day base', subColor: 'var(--accent)' },
          { icon: Target,   label: 'Cal Goal', val: user?.target_calories || '—', sub: 'kcal / day', subColor: 'var(--accent)' },
          { icon: Dumbbell, label: 'Protein',  val: `${user?.target_protein || '—'}`, sub: 'g / day', subColor: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className={`card ${styles.statCard}`}>
            <s.icon size={16} color="var(--text-muted)" />
            <div className={styles.statVal}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
            {s.sub && <div className={styles.statSub} style={{ color: s.subColor }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Details / Edit form */}
      <div className={`card ${styles.detailCard}`}>
        <div className={styles.sectionHeader}>
          <User size={16} color="var(--accent)" />
          <span>Personal Details</span>
          {editing && (
            <button className="btn btn-primary" onClick={save} style={{ marginLeft: 'auto', padding: '8px 16px' }}>
              <Save size={14}/> Save
            </button>
          )}
        </div>

        <div className={styles.fieldGrid}>
          {[
            { key: 'name',      label: 'Name',           type: 'text',   placeholder: 'Rohan Sharma' },
            { key: 'age',       label: 'Age',            type: 'number', placeholder: '21' },
            { key: 'weight_kg', label: 'Weight (kg)',    type: 'number', placeholder: '70' },
            { key: 'height_cm', label: 'Height (cm)',    type: 'number', placeholder: '175' },
            { key: 'target_calories', label: 'Target Calories', type: 'number', placeholder: '2000' },
            { key: 'target_protein',  label: 'Target Protein (g)', type: 'number', placeholder: '120' },
          ].map(f => (
            <div key={f.key} className={styles.field}>
              <label>{f.label}</label>
              {editing ? (
                <input className="input" type={f.type} placeholder={f.placeholder}
                  value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
              ) : (
                <div className={styles.fieldVal}>{user?.[f.key] || '—'}</div>
              )}
            </div>
          ))}

          <div className={styles.field}>
            <label>Goal</label>
            {editing ? (
              <div className={styles.pillGroup}>
                {GOALS.map(g => (
                  <button type="button" key={g}
                    className={`${styles.pill} ${form.goal === g ? styles.pillActive : ''}`}
                    onClick={() => set('goal', g)}>{g}</button>
                ))}
              </div>
            ) : (
              <div className={styles.fieldVal} style={{ textTransform: 'capitalize' }}>{user?.goal || '—'}</div>
            )}
          </div>

          <div className={styles.field}>
            <label>Diet Type</label>
            {editing ? (
              <div className={styles.pillGroup}>
                {DIETS.map(d => (
                  <button type="button" key={d}
                    className={`${styles.pill} ${form.diet_type === d ? styles.pillActive : ''}`}
                    onClick={() => set('diet_type', d)}>{d}</button>
                ))}
              </div>
            ) : (
              <div className={styles.fieldVal} style={{ textTransform: 'capitalize' }}>{user?.diet_type || '—'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Gym tip */}
      <div className={`card ${styles.tipCard}`}>
        <Zap size={14} color="var(--accent)" />
        <span>
          {user?.goal === 'cut'
            ? 'On a cut: aim for 25% kcal deficit. High protein prevents muscle loss. Prioritize sleep — growth hormone peaks at night.'
            : user?.goal === 'bulk'
            ? 'On a bulk: eat 300–500 kcal surplus. Train heavy compound lifts. Track progressive overload every session.'
            : 'Maintenance: match TDEE calories. Focus on building strength and body recomp over time.'}
        </span>
      </div>
    </div>
  )
}
