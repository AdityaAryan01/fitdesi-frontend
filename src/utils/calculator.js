export const GOALS   = ['cut', 'bulk', 'maintenance']
export const DIETS   = ['veg', 'non-veg', 'eggetarian']
export const GENDERS = ['male', 'female']

export const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary',        sub: 'Desk job, no exercise',         multiplier: 1.2   },
  { key: 'light',     label: 'Lightly Active',    sub: '1–3 days/week exercise',        multiplier: 1.375 },
  { key: 'moderate',  label: 'Moderately Active', sub: '3–5 days/week exercise',        multiplier: 1.55  },
  { key: 'very',      label: 'Very Active',       sub: '6–7 days/week or physical job', multiplier: 1.725 },
]

export function calcMacros(weight, height, age, gender, activityKey, goal) {
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
