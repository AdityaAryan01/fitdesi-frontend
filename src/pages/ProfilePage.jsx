import { useState } from 'react'
import { User, Edit3, Save, X, Zap, Flame, Dumbbell, Activity, Target, Calculator, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { updateUser } from '../api'
import { GOALS, DIETS, GENDERS, ACTIVITIES, calcMacros } from '../utils/calculator'
import styles from './ProfilePage.module.css'

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
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...user })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Calculator states
  const [calcOpen, setCalcOpen] = useState(false)
  const [calcResult, setCalcResult] = useState(null)
  const [applied, setApplied] = useState(false)

  const runCalc = (g = form.gender || 'male', a = form.activity_level || 'moderate', goal = form.goal) => {
    const result = calcMacros(form.weight_kg, form.height_cm, form.age, g, a, goal)
    setCalcResult(result)
  }

  const handleGenderChange = (g) => { set('gender', g); runCalc(g, form.activity_level, form.goal) }
  const handleActivityChange = (a) => { set('activity_level', a); runCalc(form.gender || 'male', a, form.goal) }
  
  const handleGoalChange = (g) => {
    set('goal', g)
    if (editing) {
      setCalcOpen(true)
      runCalc(form.gender || 'male', form.activity_level || 'moderate', g)
    }
  }

  const applyCalcResult = () => {
    if (!calcResult) return
    set('target_calories', String(calcResult.targetCal))
    set('target_protein', String(calcResult.targetProtein))
    setApplied(true)
    setCalcOpen(false)
  }

  const save = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const updatedUser = await updateUser(user.id, form)
      login(updatedUser)
      setEditing(false)
    } catch (err) {
      console.error('Failed to update profile:', err)
      alert("Error saving profile. Please try again.")
    } finally {
      setSaving(false)
    }
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
            <button 
              className="btn btn-primary" 
              onClick={save} 
              disabled={saving}
              style={{ marginLeft: 'auto', padding: '8px 16px', opacity: saving ? 0.7 : 1 }}
            >
              <Save size={14}/> {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        <div className={styles.fieldGrid}>
          {[
            { key: 'name',      label: 'Name',           type: 'text',   placeholder: 'Rohan Sharma' },
            { key: 'age',       label: 'Age',            type: 'number', placeholder: '21' },
            { key: 'weight_kg', label: 'Weight (kg)',    type: 'number', placeholder: '70' },
            { key: 'height_cm', label: 'Height (cm)',    type: 'number', placeholder: '175' },
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
            <label>Target Calories {applied && <span className={styles.calculatedTag}><Check size={10} /> calc</span>}</label>
            {editing ? (
              <input className="input" type="number" placeholder="2000"
                value={form.target_calories || ''} onChange={e => { set('target_calories', e.target.value); setApplied(false) }} />
            ) : (
              <div className={styles.fieldVal}>{user?.target_calories || '—'}</div>
            )}
          </div>

          <div className={styles.field}>
            <label>Target Protein <span style={{fontSize:'0.8rem', textTransform:'none'}}>(g)</span> {applied && <span className={styles.calculatedTag}><Check size={10} /> calc</span>}</label>
            {editing ? (
              <input className="input" type="number" placeholder="120"
                value={form.target_protein || ''} onChange={e => { set('target_protein', e.target.value); setApplied(false) }} />
            ) : (
              <div className={styles.fieldVal}>{user?.target_protein || '—'}</div>
            )}
          </div>


          <div className={styles.field}>
            <label>Goal</label>
            {editing ? (
              <div className={styles.pillGroup}>
                {GOALS.map(g => (
                  <button type="button" key={g}
                    className={`${styles.pill} ${form.goal === g ? styles.pillActive : ''}`}
                    onClick={() => handleGoalChange(g)}>{g}</button>
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

          {editing && (
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="button" className={`${styles.calcToggleBtn} ${calcOpen ? styles.calcToggleOpen : ''}`}
                onClick={() => { setCalcOpen(o => !o); if (!calcOpen) runCalc() }}>
                <Calculator size={16} />
                {calcOpen ? 'Hide Calculator' : "Recalculate Macros"}
              </button>

              {calcOpen && (
                <div className={`${styles.calcPanel} animate-fade-up`}>
                  <div className={styles.calcPanelTitle}>
                    Updating parameters: {form.weight_kg}kg · {form.height_cm}cm · Age {form.age} · Goal: {form.goal}
                  </div>
                  
                  <div className={styles.calcField}>
                    <label>Gender</label>
                    <div className={styles.pillGroup}>
                      {GENDERS.map(g => (
                        <button type="button" key={g}
                          className={`${styles.pill} ${(form.gender || 'male') === g ? styles.pillActive : ''}`}
                          onClick={() => handleGenderChange(g)}>{g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.calcField}>
                    <label>Activity Level</label>
                    <div className={styles.activityGrid}>
                      {ACTIVITIES.map(a => (
                        <button type="button" key={a.key}
                          className={`${styles.activityCard} ${(form.activity_level || 'moderate') === a.key ? styles.activityActive : ''}`}
                          onClick={() => handleActivityChange(a.key)}>
                          <div className={styles.activityLabel}>{a.label}</div>
                          <div className={styles.activitySub}>{a.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {calcResult && (
                    <div className={styles.calcResult}>
                      <div className={styles.calcResultGrid}>
                        <div className={styles.calcStat}>
                          <div className={styles.calcStatVal}>{calcResult.bmr}</div>
                          <div className={styles.calcStatLabel}>BMR</div>
                        </div>
                        <div className={styles.calcStat}>
                          <div className={styles.calcStatVal}>{calcResult.tdee}</div>
                          <div className={styles.calcStatLabel}>TDEE</div>
                        </div>
                        <div className={styles.calcStat}>
                          <div className={styles.calcStatVal} style={{ color: 'var(--accent)' }}>{calcResult.targetCal}</div>
                          <div className={styles.calcStatLabel}>Target</div>
                        </div>
                        <div className={styles.calcStat}>
                          <div className={styles.calcStatVal} style={{ color: 'var(--green)' }}>{calcResult.targetProtein}g</div>
                          <div className={styles.calcStatLabel}>Protein</div>
                        </div>
                      </div>
                      <button type="button" className={`btn btn-primary ${styles.applyBtn}`} onClick={applyCalcResult}>
                        <Check size={16} /> Apply these targets
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
