import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight, Flame, Target, Dumbbell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { createThread } from '../api'
import styles from './LoginPage.module.css'

const GOALS = ['cut', 'bulk', 'maintenance']
const DIETS  = ['veg', 'non-veg', 'eggetarian']

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', age: '', weight_kg: '', height_cm: '',
    goal: 'cut', diet_type: 'non-veg',
    target_calories: '', target_protein: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // After login, create first thread and land directly in it
  const loginAndRedirect = async (userData) => {
    login(userData)
    try {
      const thread = await createThread(String(userData.id))
      navigate(`/chat/${thread.id}`)
    } catch {
      // If thread creation fails, fall back to /chat (sidebar has New Conversation btn)
      navigate('/chat')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
          weight_kg: parseFloat(form.weight_kg),
          height_cm: parseFloat(form.height_cm),
          target_calories: parseInt(form.target_calories) || 2000,
          target_protein: parseInt(form.target_protein) || 120,
        })
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      await loginAndRedirect({ ...data, name: form.name, goal: form.goal })
    } catch (err) {
      // Fallback: store locally for testing phase
      const localUser = {
        id: `user_${Date.now()}`,
        name: form.name,
        goal: form.goal,
        diet_type: form.diet_type,
        target_calories: parseInt(form.target_calories) || 2000,
        target_protein: parseInt(form.target_protein) || 120,
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
      }
      await loginAndRedirect(localUser)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={`glow-orb glow-orb-1`} />
      <div className={`glow-orb glow-orb-2`} />

      <div className={styles.container}>
        {step === 1 ? (
          <div className={`${styles.welcome} animate-fade-up`}>
            <div className={styles.welcomeIcon}>
              <Zap size={32} fill="currentColor" />
            </div>
            <h1 className={styles.welcomeTitle}>FitDesi</h1>
            <p className={styles.welcomeSub}>
              Your no-BS AI gym bro.<br/>Built for Indian hostels, desi diets, real gains.
            </p>
            <div className={styles.featureRow}>
              {[
                { icon: Flame, text: 'Track calories with AI' },
                { icon: Dumbbell, text: 'Indian food database' },
                { icon: Target, text: 'Hit your macro goals' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className={styles.featureChip}>
                  <Icon size={14} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button className={`btn btn-primary ${styles.startBtn}`} onClick={() => setStep(2)}>
              Get Started <ChevronRight size={16} />
            </button>
            <p className={styles.note}>No account needed. Just your stats.</p>
          </div>
        ) : (
          <form className={`${styles.formCard} card animate-fade-up`} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <div className={styles.logoSmall}>
                <Zap size={14} fill="currentColor" />
              </div>
              <span>Build your profile</span>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field} style={{ gridColumn: '1/-1' }}>
                <label>Your Name</label>
                <input className="input" placeholder="e.g. Rohan Sharma"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>

              <div className={styles.field}>
                <label>Age</label>
                <input className="input" type="number" placeholder="21"
                  value={form.age} onChange={e => set('age', e.target.value)} required />
              </div>

              <div className={styles.field}>
                <label>Weight (kg)</label>
                <input className="input" type="number" step="0.1" placeholder="70"
                  value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} required />
              </div>

              <div className={styles.field}>
                <label>Height (cm)</label>
                <input className="input" type="number" placeholder="175"
                  value={form.height_cm} onChange={e => set('height_cm', e.target.value)} required />
              </div>

              <div className={styles.field}>
                <label>Target Calories</label>
                <input className="input" type="number" placeholder="2000"
                  value={form.target_calories} onChange={e => set('target_calories', e.target.value)} />
              </div>

              <div className={styles.field}>
                <label>Target Protein (g)</label>
                <input className="input" type="number" placeholder="120"
                  value={form.target_protein} onChange={e => set('target_protein', e.target.value)} />
              </div>

              <div className={styles.field}>
                <label>Goal</label>
                <div className={styles.pillGroup}>
                  {GOALS.map(g => (
                    <button type="button" key={g}
                      className={`${styles.pill} ${form.goal === g ? styles.pillActive : ''}`}
                      onClick={() => set('goal', g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Diet</label>
                <div className={styles.pillGroup}>
                  {DIETS.map(d => (
                    <button type="button" key={d}
                      className={`${styles.pill} ${form.diet_type === d ? styles.pillActive : ''}`}
                      onClick={() => set('diet_type', d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Setting up...' : <>Let's Go 💪 <ChevronRight size={16} /></>}
            </button>

            <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}