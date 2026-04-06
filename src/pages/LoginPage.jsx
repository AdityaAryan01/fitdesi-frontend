// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, ChevronRight, Flame, Target, Dumbbell,
  Calculator, SkipForward, Check
} from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import api, { createThread } from '../api'
import styles from './LoginPage.module.css'

const GOALS   = ['cut', 'bulk', 'maintenance']
const DIETS   = ['veg', 'non-veg', 'eggetarian']
const GENDERS = ['male', 'female']
const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary',        sub: 'Desk job, no exercise',         multiplier: 1.2   },
  { key: 'light',     label: 'Lightly Active',    sub: '1–3 days/week exercise',        multiplier: 1.375 },
  { key: 'moderate',  label: 'Moderately Active', sub: '3–5 days/week exercise',        multiplier: 1.55  },
  { key: 'very',      label: 'Very Active',       sub: '6–7 days/week or physical job', multiplier: 1.725 },
]

// ── Mifflin-St Jeor BMR + TDEE + goal targets ───────────────────
function calcMacros(weight, height, age, gender, activityKey, goal) {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  const a = parseInt(age)
  if (!w || !h || !a) return null

  const bmr = gender === 'female'
    ? (10 * w) + (6.25 * h) - (5 * a) - 161
    : (10 * w) + (6.25 * h) - (5 * a) + 5

  const act  = ACTIVITIES.find(x => x.key === activityKey) || ACTIVITIES[2]
  const tdee = Math.round(bmr * act.multiplier)

  const targetCal =
    goal === 'cut'    ? Math.round(tdee * 0.75)
    : goal === 'bulk' ? tdee + 300
    :                   tdee

  const proteinPer =
    goal === 'cut'    ? 2.0
    : goal === 'bulk' ? 1.8
    :                   1.5

  return {
    bmr:           Math.round(bmr),
    tdee,
    targetCal,
    targetProtein: Math.round(w * proteinPer),
  }
}

export default function LoginPage() {
  const { login, firebaseUser } = useAuth()
  const navigate = useNavigate()

  // step 1=landing, 2=firebase auth, 3=basic info, 4=macro targets
  const [step,     setStep]     = useState(1)
  const [authMode, setAuthMode] = useState('signup')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const [creds, setCreds] = useState({ email: '', password: '' })
  const setCred = (k, v) => setCreds(f => ({ ...f, [k]: v }))

  const [form, setForm] = useState({
    name: '', age: '', weight_kg: '', height_cm: '',
    goal: 'cut', diet_type: 'non-veg',
    target_calories: '', target_protein: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Step 4 calculator state ──────────────────────────────────
  const [calcOpen,   setCalcOpen]   = useState(false)
  const [gender,     setGender]     = useState('male')
  const [activity,   setActivity]   = useState('moderate')
  const [calcResult, setCalcResult] = useState(null)
  const [applied,    setApplied]    = useState(false)

  const runCalc = (g = gender, a = activity) => {
    const result = calcMacros(form.weight_kg, form.height_cm, form.age, g, a, form.goal)
    setCalcResult(result)
  }

  const handleGenderChange   = (g) => { setGender(g);   runCalc(g, activity) }
  const handleActivityChange = (a) => { setActivity(a); runCalc(gender, a)   }

  const applyCalcResult = () => {
    if (!calcResult) return
    set('target_calories', String(calcResult.targetCal))
    set('target_protein',  String(calcResult.targetProtein))
    setApplied(true)
    setCalcOpen(false)
  }

  // ── UNCHANGED: After onboarding form submit ──────────────────
  const finishOnboarding = async () => {
    const uid = firebaseUser?.uid
    if (!uid) {
      setError('Session lost. Please sign in again.')
      setStep(1)
      return
    }
    setLoading(true)
    setError('')
    try {
      // Use api (axios) not raw fetch — token must be attached for backend to accept the request
      const data     = await api.post('/user', {
        ...form,
        id:               uid,
        age:              parseInt(form.age),
        weight_kg:        parseFloat(form.weight_kg),
        height_cm:        parseFloat(form.height_cm),
        target_calories:  parseInt(form.target_calories)  || 2000,
        target_protein:   parseInt(form.target_protein)   || 120,
      }).then(r => r.data).catch(() => null)

      const userData = data || {
        id:              uid,
        name:            form.name,
        goal:            form.goal,
        diet_type:       form.diet_type,
        target_calories: parseInt(form.target_calories)  || 2000,
        target_protein:  parseInt(form.target_protein)   || 120,
        weight_kg:       parseFloat(form.weight_kg),
        height_cm:       parseFloat(form.height_cm),
      }
      login(userData)
      const thread = await createThread(String(userData.id)).catch(() => null)
      navigate(thread ? `/chat/${thread.id}` : '/chat', { replace: true })
    } catch {
      setError('Failed to save profile. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── UNCHANGED: Existing user login ──────────────────────────
  const fetchAndLoginExistingUser = async (firebaseUid) => {
    try {
      // Use api (axios) not raw fetch — axios interceptor attaches Firebase token automatically.
      // Raw fetch would return 401 because backend requires Authorization header on all routes.
      const data   = await api.get(`/user/${firebaseUid}`).then(r => r.data)
      login(data)
      const thread = await createThread(String(data.id)).catch(() => null)
      navigate(thread ? `/chat/${thread.id}` : '/chat', { replace: true })
      return true
    } catch {}
    return false
  }

  // ── UNCHANGED: Email auth ────────────────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, creds.email, creds.password)
        setStep(3)
      } else {
        const result = await signInWithEmailAndPassword(auth, creds.email, creds.password)
        const found  = await fetchAndLoginExistingUser(result.user.uid)
        if (!found) setStep(3)
      }
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Email already registered. Try logging in.',
        'auth/wrong-password':       'Wrong password. Try again.',
        'auth/user-not-found':       'No account found. Sign up instead.',
        'auth/weak-password':        'Password must be at least 6 characters.',
        'auth/invalid-email':        'Enter a valid email address.',
        'auth/invalid-credential':   'Wrong email or password.',
      }
      setError(msgs[err.code] || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── UNCHANGED: Google auth ───────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      const result   = await signInWithPopup(auth, provider)
      const uid      = result.user.uid
      const found    = await fetchAndLoginExistingUser(uid)
      if (!found) {
        setForm(f => ({ ...f, name: result.user.displayName || '' }))
        setStep(3)
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3 → Step 4 (validate basic fields first) ───────────
  const handleStep3Next = (e) => {
    e.preventDefault()
    if (!form.name || !form.age || !form.weight_kg || !form.height_cm) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    // Reset calculator state for fresh use on step 4
    setCalcResult(null)
    setApplied(false)
    setCalcOpen(false)
    setStep(4)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  // ── Step 1: Landing ──────────────────────────────────────────
  if (step === 1) return (
    <div className={styles.page}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className={styles.container}>
        <div className={`${styles.welcome} animate-fade-up`}>
          <div className={styles.welcomeIcon}><Zap size={32} fill="currentColor" /></div>
          <h1 className={styles.welcomeTitle}>FitDesi</h1>
          <p className={styles.welcomeSub}>
            Your no-BS AI gym bro.<br />Built for Indian hostels, desi diets, real gains.
          </p>
          <div className={styles.featureRow}>
            {[
              { icon: Flame,    text: 'Track calories with AI' },
              { icon: Dumbbell, text: 'Indian food database'   },
              { icon: Target,   text: 'Hit your macro goals'   },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className={styles.featureChip}>
                <Icon size={14} /><span>{text}</span>
              </div>
            ))}
          </div>
          <button className={`btn btn-primary ${styles.startBtn}`} onClick={() => setStep(2)}>
            Get Started <ChevronRight size={16} />
          </button>
          <button
            className={`btn btn-ghost ${styles.startBtn}`}
            style={{ marginTop: 8 }}
            onClick={() => { setAuthMode('login'); setStep(2) }}
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  )

  // ── Step 2: Firebase Auth ────────────────────────────────────
  if (step === 2) return (
    <div className={styles.page}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className={styles.container}>
        <form className={`${styles.formCard} card animate-fade-up`} onSubmit={handleEmailAuth}>
          <div className={styles.formHeader}>
            <div className={styles.logoSmall}><Zap size={14} fill="currentColor" /></div>
            <span>{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</span>
          </div>

          <button type="button" className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
            onClick={handleGoogle} disabled={loading}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width={18} height={18} alt="Google"
            />
            Continue with Google
          </button>

          <div className={styles.orDivider}>— or use email —</div>

          <div className={styles.fieldGrid}>
            <div className={styles.field} style={{ gridColumn: '1/-1' }}>
              <label>Email</label>
              <input className="input" type="email" placeholder="rohan@gmail.com"
                value={creds.email} onChange={e => setCred('email', e.target.value)} required />
            </div>
            <div className={styles.field} style={{ gridColumn: '1/-1' }}>
              <label>Password</label>
              <input className="input" type="password" placeholder="Min 6 characters"
                value={creds.password} onChange={e => setCred('password', e.target.value)} required />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading
              ? 'Please wait...'
              : authMode === 'signup'
                ? <> Sign Up <ChevronRight size={16} /></>
                : <> Log In  <ChevronRight size={16} /></>
            }
          </button>

          <button type="button" className={styles.backBtn}
            onClick={() => setAuthMode(m => m === 'signup' ? 'login' : 'signup')}>
            {authMode === 'signup'
              ? 'Already have an account? Log in'
              : "Don't have an account? Sign up"}
          </button>

          <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
            ← Back
          </button>
        </form>
      </div>
    </div>
  )

  // ── Step 3: Basic Profile Info ───────────────────────────────
  if (step === 3) return (
    <div className={styles.page}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className={styles.container}>
        <form className={`${styles.formCard} card animate-fade-up`} onSubmit={handleStep3Next}>
          <div className={styles.formHeader}>
            <div className={styles.logoSmall}><Zap size={14} fill="currentColor" /></div>
            <span>Build your profile</span>
            <div className={styles.stepPill}>Step 1 of 2</div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field} style={{ gridColumn: '1/-1' }}>
              <label>Your Name *</label>
              <input className="input" placeholder="e.g. Rohan Sharma"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Age *</label>
              <input className="input" type="number" placeholder="21"
                value={form.age} onChange={e => set('age', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Weight (kg) *</label>
              <input className="input" type="number" step="0.1" placeholder="70"
                value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Height (cm) *</label>
              <input className="input" type="number" placeholder="175"
                value={form.height_cm} onChange={e => set('height_cm', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Goal *</label>
              <div className={styles.pillGroup}>
                {GOALS.map(g => (
                  <button type="button" key={g}
                    className={`${styles.pill} ${form.goal === g ? styles.pillActive : ''}`}
                    onClick={() => set('goal', g)}>{g}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label>Diet *</label>
              <div className={styles.pillGroup}>
                {DIETS.map(d => (
                  <button type="button" key={d}
                    className={`${styles.pill} ${form.diet_type === d ? styles.pillActive : ''}`}
                    onClick={() => set('diet_type', d)}>{d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`}>
            Next <ChevronRight size={16} />
          </button>
        </form>
      </div>
    </div>
  )

  // ── Step 4: Macro Targets (Optional, with Calculator) ────────
  return (
    <div className={styles.page}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className={styles.container}>
        <div className={`${styles.formCard} card animate-fade-up`}>

          <div className={styles.formHeader}>
            <div className={styles.logoSmall}><Target size={14} /></div>
            <span>Set Your Targets</span>
            <div className={styles.stepPill}>Step 2 of 2</div>
          </div>

          <p className={styles.stepSubtitle}>
            Set your daily calorie and protein targets, or skip to use defaults.
          </p>

          {/* Manual inputs (Mode B — default) */}
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label>
                Daily Calories
                {applied && (
                  <span className={styles.calculatedTag}>
                    <Check size={10} /> calculated
                  </span>
                )}
              </label>
              <input className="input" type="number" placeholder="e.g. 2000"
                value={form.target_calories}
                onChange={e => { set('target_calories', e.target.value); setApplied(false) }} />
            </div>
            <div className={styles.field}>
              <label>
                Daily Protein (g)
                {applied && (
                  <span className={styles.calculatedTag}>
                    <Check size={10} /> calculated
                  </span>
                )}
              </label>
              <input className="input" type="number" placeholder="e.g. 120"
                value={form.target_protein}
                onChange={e => { set('target_protein', e.target.value); setApplied(false) }} />
            </div>
          </div>

          {/* Calculator toggle */}
          <button
            type="button"
            className={`${styles.calcToggleBtn} ${calcOpen ? styles.calcToggleOpen : ''}`}
            onClick={() => { setCalcOpen(o => !o); if (!calcOpen) runCalc() }}
          >
            <Calculator size={15} />
            {calcOpen ? 'Hide Calculator' : "Don't know your targets? Calculate them"}
          </button>

          {/* Calculator panel (Mode A) */}
          {calcOpen && (
            <div className={`${styles.calcPanel} animate-fade-up`}>
              <div className={styles.calcPanelTitle}>
                Based on: {form.weight_kg}kg · {form.height_cm}cm · Age {form.age} · Goal: {form.goal}
              </div>

              {/* Gender */}
              <div className={styles.calcField}>
                <label>Gender</label>
                <div className={styles.pillGroup}>
                  {GENDERS.map(g => (
                    <button type="button" key={g}
                      className={`${styles.pill} ${gender === g ? styles.pillActive : ''}`}
                      onClick={() => handleGenderChange(g)}
                      style={{ textTransform: 'capitalize' }}>{g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity level */}
              <div className={styles.calcField}>
                <label>Activity Level</label>
                <div className={styles.activityGrid}>
                  {ACTIVITIES.map(a => (
                    <button type="button" key={a.key}
                      className={`${styles.activityCard} ${activity === a.key ? styles.activityActive : ''}`}
                      onClick={() => handleActivityChange(a.key)}
                    >
                      <div className={styles.activityLabel}>{a.label}</div>
                      <div className={styles.activitySub}>{a.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {calcResult && (
                <div className={styles.calcResult}>
                  <div className={styles.calcResultGrid}>
                    <div className={styles.calcStat}>
                      <div className={styles.calcStatVal}>{calcResult.bmr}</div>
                      <div className={styles.calcStatLabel}>BMR</div>
                    </div>
                    <div className={styles.calcStat}>
                      <div className={styles.calcStatVal}>{calcResult.tdee}</div>
                      <div className={styles.calcStatLabel}>Maintenance</div>
                    </div>
                    <div className={styles.calcStat}>
                      <div className={styles.calcStatVal} style={{ color: 'var(--accent)' }}>
                        {calcResult.targetCal}
                      </div>
                      <div className={styles.calcStatLabel}>Target ({form.goal})</div>
                    </div>
                    <div className={styles.calcStat}>
                      <div className={styles.calcStatVal} style={{ color: 'var(--green)' }}>
                        {calcResult.targetProtein}g
                      </div>
                      <div className={styles.calcStatLabel}>Protein</div>
                    </div>
                  </div>

                  <div className={styles.calcLogic}>
                    💡 {form.goal === 'cut'
                      ? `Cut = Maintenance (${calcResult.tdee}) × 75% = ${calcResult.targetCal} kcal (25% deficit)`
                      : form.goal === 'bulk'
                      ? `Bulk = Maintenance (${calcResult.tdee}) + 300 kcal → lean muscle gain`
                      : `Maintenance = your TDEE, no surplus or deficit`
                    }
                  </div>

                  <button type="button"
                    className={`btn btn-primary ${styles.applyBtn}`}
                    onClick={applyCalcResult}>
                    <Check size={15} /> Use these numbers
                  </button>
                </div>
              )}
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {/* Action row */}
          <div className={styles.actionRow}>
            <button type="button" className={styles.skipBtn}
              onClick={finishOnboarding} disabled={loading}>
              <SkipForward size={14} />
              {loading ? 'Setting up...' : 'Skip'}
            </button>
            <button type="button"
              className={`btn btn-primary ${styles.submitBtnFlex}`}
              onClick={finishOnboarding}
              disabled={loading}>
              {loading ? 'Setting up...' : <>Let's Go 💪 <ChevronRight size={16} /></>}
            </button>
          </div>

          <button type="button" className={styles.backBtn} onClick={() => setStep(3)}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}