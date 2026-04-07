// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, ChevronRight, Flame, Target, Dumbbell,
  Calculator, SkipForward, Check, Loader
} from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import api from '../api'
import styles from './LoginPage.module.css'

import { 
  GOALS, DIETS, GENDERS, ACTIVITIES, calcMacros 
} from '../utils/calculator'
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

  // ── After onboarding form submit ──────────────────
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
      const data     = await api.post('/user', {
        ...form,
        id:               uid,
        age:              parseInt(form.age),
        weight_kg:        parseFloat(form.weight_kg),
        height_cm:        parseFloat(form.height_cm),
        gender,
        activity_level:   activity,
        target_calories:  parseInt(form.target_calories)  || 2000,
        target_protein:   parseInt(form.target_protein)   || 120,
      }).then(r => r.data).catch(() => null)

      const userData = data || {
        id:              uid,
        name:            form.name,
        goal:            form.goal,
        diet_type:       form.diet_type,
        gender,
        activity_level:  activity,
        target_calories: parseInt(form.target_calories)  || 2000,
        target_protein:  parseInt(form.target_protein)   || 120,
        weight_kg:       parseFloat(form.weight_kg),
        height_cm:       parseFloat(form.height_cm),
      }
      login(userData)
      navigate('/chat', { replace: true })
    } catch {
      setError('Failed to save profile. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Existing user login ──────────────────────────
  const fetchAndLoginExistingUser = async (firebaseUid) => {
    try {
      const data   = await api.get(`/user/${firebaseUid}`).then(r => r.data)
      login(data)
      navigate('/chat', { replace: true })
      return true
    } catch {}
    return false
  }

  // ── Email auth ────────────────────────────────────
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

  // ── Google auth ───────────────────────────────────
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
    setCalcResult(null)
    setApplied(false)
    setCalcOpen(false)
    setStep(4)
  }

  // ── Step 1: Landing ──────────────────────────────────────────
  if (step === 1) return (
    <div className={styles.authPage}>
      <div className={styles.authLeft}>
        <div className={styles.brandContainer}>
          <div className={styles.brandIcon}><Zap size={40} fill="currentColor" /></div>
          <h1 className={styles.brandName}>FitDesi</h1>
          <p className={styles.brandTagline}>Your no-BS AI gym bro.</p>
          <div className={styles.brandDescription}>
            Built for Indian hostels, desi diets, and real gains. Track calories, log meals, and hit your macros with AI that understands <em>paranthas</em> and <em>paneer</em>.
          </div>
          <div className={styles.brandStats}>
            <div className={styles.brandStat}>
              <Flame size={20} />
              <span>AI Macro Tracking</span>
            </div>
            <div className={styles.brandStat}>
              <Dumbbell size={20} />
              <span>Hostel-Friendly Advice</span>
            </div>
            <div className={styles.brandStat}>
              <Target size={20} />
              <span>No-Nonsense Gains</span>
            </div>
          </div>
        </div>
        <div className={styles.leftFooter}>
          Join 5,000+ desi lifters today.
        </div>
      </div>
      <div className={styles.authRight}>
        <div className={`${styles.formWrapper} animate-fade-up`}>
          <div className={styles.welcomeText}>
            <h2>Ready to transform?</h2>
            <p>Choose how you want to start your fitness journey.</p>
          </div>
          <button className={`btn btn-primary ${styles.giantBtn}`} onClick={() => setStep(2)}>
            Get Started <ChevronRight size={20} />
          </button>
          <div className={styles.altAction}>
            <span>Already using FitDesi?</span>
            <button className={styles.textLink} onClick={() => { setAuthMode('login'); setStep(2) }}>
              Log in to your account
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Step 2: Firebase Auth ────────────────────────────────────
  if (step === 2) return (
    <div className={styles.authPage}>
      <div className={styles.authLeft}>
        <div className={styles.brandContainer}>
          <div className={styles.brandIcon}><Zap size={40} fill="currentColor" /></div>
          <h1 className={styles.brandName}>FitDesi</h1>
          <p className={styles.brandTagline}>Join the community.</p>
          <div className={styles.brandDescription}>
            "Bhai, paneer bhurji mein kitna protein hai?" — FitDesi knows. Stop guessing, start growing.
          </div>
          <div className={styles.quoteCard}>
            <p>"Hostel mess food used to be a nightmare for my gains. FitDesi helped me track exactly what I was eating and adjusted my targets accordingly."</p>
            <div className={styles.quoteAuthor}>— Rahul, IIT Delhi</div>
          </div>
        </div>
      </div>
      <div className={styles.authRight}>
        <form className={`${styles.authForm} animate-fade-up`} onSubmit={handleEmailAuth}>
          <div className={styles.formHead}>
            <h1>{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
            <p>{authMode === 'signup' ? 'Enter your details to create your profile.' : 'Sign in to continue your progress.'}</p>
          </div>

          <button type="button" className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="Google" />
            Continue with Google
          </button>

          <div className={styles.formDivider}>
            <span>or use email</span>
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input type="email" placeholder="rohan@gmail.com" value={creds.email} onChange={e => setCred('email', e.target.value)} required />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input type="password" placeholder="At least 6 characters" value={creds.password} onChange={e => setCred('password', e.target.value)} required />
          </div>

          {error && <div className={styles.authError}>{error}</div>}

          <button type="submit" className={`btn btn-primary ${styles.giantBtn}`} disabled={loading}>
            {loading ? <Loader size={20} className={styles.spin} /> : authMode === 'signup' ? 'Sign Up' : 'Log In'}
          </button>

          <div className={styles.formFooter}>
            {authMode === 'signup' ? "Already have an account?" : "Don't have an account?"}
            <button type="button" onClick={() => setAuthMode(m => m === 'signup' ? 'login' : 'signup')}>
              {authMode === 'signup' ? 'Log In' : 'Sign Up'}
            </button>
          </div>

          <button type="button" className={styles.backLink} onClick={() => setStep(1)}>
            ← Back to home
          </button>
        </form>
      </div>
    </div>
  )

  // ── Step 3: Basic Profile Info ───────────────────────────────
  if (step === 3) return (
    <div className={styles.authPage}>
      <div className={styles.authLeft}>
        <div className={styles.brandContainer}>
          <div className={styles.brandIcon}><Zap size={40} fill="currentColor" /></div>
          <h1 className={styles.brandName}>FitDesi</h1>
          <p className={styles.brandTagline}>Tell us about yourself.</p>
          <div className={styles.brandDescription}>
            We use these details to calculate your maintenance calories and macro targets. Don't worry, you can always change these later.
          </div>
        </div>
      </div>
      <div className={styles.authRight}>
        <form className={`${styles.authForm} animate-fade-up`} onSubmit={handleStep3Next}>
          <div className={styles.formHead}>
            <h1>Build your profile</h1>
            <p>Step 1 of 2: Basic Information</p>
          </div>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup} style={{ gridColumn: '1/-1' }}>
              <label>Your Name *</label>
              <input placeholder="e.g. Rohan Sharma" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Age *</label>
              <input type="number" placeholder="21" value={form.age} onChange={e => set('age', e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Weight (kg) *</label>
              <input type="number" step="0.1" placeholder="70" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Height (cm) *</label>
              <input type="number" placeholder="175" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
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
            <div className={styles.inputGroup}>
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

          {error && <div className={styles.authError}>{error}</div>}

          <button type="submit" className={`btn btn-primary ${styles.giantBtn}`} disabled={loading}>
            Next <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  )

  // ── Step 4: Macro Targets (Optional, with Calculator) ────────
  return (
    <div className={styles.authPage}>
      <div className={styles.authLeft}>
        <div className={styles.brandContainer}>
          <div className={styles.brandIcon}><Target size={40} /></div>
          <h1 className={styles.brandName}>Targets</h1>
          <p className={styles.brandTagline}>Fuel your gains correctly.</p>
          <div className={styles.brandDescription}>
            "Bhai protein kitna chahiye?" — Standard desi diet can be low on protein. We help you set realistic targets based on your goals.
          </div>
          <div className={styles.quoteCard}>
            <p>Most Indians consume less than 50g protein daily. For muscle growth, you ideally need 1.5g to 2g per kg of body weight.</p>
          </div>
        </div>
      </div>
      <div className={styles.authRight}>
        <div className={`${styles.authForm} animate-fade-up`}>
          <div className={styles.formHead}>
            <h1>Set Your Targets</h1>
            <p>Step 2 of 2: Calorie & Protein goals</p>
          </div>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label>
                Daily Calories
                {applied && <span className={styles.calculatedTag}><Check size={10} /> calculated</span>}
              </label>
              <input type="number" placeholder="e.g. 2000" value={form.target_calories}
                onChange={e => { set('target_calories', e.target.value); setApplied(false) }} />
            </div>
            <div className={styles.inputGroup}>
              <label>
                Daily Protein (g)
                {applied && <span className={styles.calculatedTag}><Check size={10} /> calculated</span>}
              </label>
              <input type="number" placeholder="e.g. 120" value={form.target_protein}
                onChange={e => { set('target_protein', e.target.value); setApplied(false) }} />
            </div>
          </div>

          <button type="button" className={`${styles.calcToggleBtn} ${calcOpen ? styles.calcToggleOpen : ''}`}
            onClick={() => { setCalcOpen(o => !o); if (!calcOpen) runCalc() }}>
            <Calculator size={16} />
            {calcOpen ? 'Hide Calculator' : "Calculate targets for me"}
          </button>

          {calcOpen && (
            <div className={`${styles.calcPanel} animate-fade-up`}>
              <div className={styles.calcPanelTitle}>
                {form.weight_kg}kg · {form.height_cm}cm · Age {form.age} · Goal: {form.goal}
              </div>
              <div className={styles.calcField}>
                <label>Gender</label>
                <div className={styles.pillGroup}>
                  {GENDERS.map(g => (
                    <button type="button" key={g}
                      className={`${styles.pill} ${gender === g ? styles.pillActive : ''}`}
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
                      className={`${styles.activityCard} ${activity === a.key ? styles.activityActive : ''}`}
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

          {error && <div className={styles.authError}>{error}</div>}

          <div className={styles.onboardingActions} style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" className={styles.skipBtn} onClick={finishOnboarding} disabled={loading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <SkipForward size={16} /> Skip
            </button>
            <button type="button" className={`btn btn-primary ${styles.giantBtn}`} onClick={finishOnboarding} disabled={loading} style={{ flex: 2 }}>
              {loading ? <Loader size={20} className={styles.spin} /> : <>Continue 💪</>}
            </button>
          </div>

          <button type="button" className={styles.backLink} onClick={() => setStep(3)}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}