import type { Goal, ProgramDayData } from '@/types'

export const PROGRAM_NAME = 'Advanced 6-Day PPL Program'

export const PROGRESSION_RULES = {
  strength: {
    description: 'When you complete ALL reps of ALL sets at the top of the rep range, increase the weight by the smallest increment available (typically 2.5 kg) next session.',
    trigger: 'all_sets_top_of_range',
  },
  hypertrophy: {
    description: 'When you complete ALL reps of ALL sets at the top of the rep range, increase the weight by the smallest increment available (typically 2.5 kg) next session.',
    trigger: 'all_sets_top_of_range',
  },
  deload: {
    frequency: 'Every 4–6 weeks',
    description: 'Perform a deload week every 4–6 weeks. Reduce weight by ~40–50% and perform 2–3 sets per exercise. Focus on form and recovery. Do not push to failure.',
  },
}

export const NUTRITION_GUIDANCE = {
  goal: 'Fat loss while preserving lean muscle mass',
  approach: 'Moderate caloric deficit. High protein intake to preserve muscle. Carbohydrate timing around workouts.',
  protein_guidance: 'Aim for approximately 2.0–2.4 g of protein per kg of bodyweight per day.',
  calorie_guidance: 'Maintain a moderate deficit of approximately 300–500 kcal below your Total Daily Energy Expenditure (TDEE).',
  carb_guidance: 'Prioritise carbohydrates around training sessions (pre- and post-workout) for performance and recovery.',
  fat_guidance: 'Keep dietary fat at a moderate level to support hormonal health.',
  water_guidance: 'Aim for a minimum of 3–4 litres of water per day.',
  meal_timing: 'Eat a protein-rich meal within 1–2 hours post-workout to support muscle protein synthesis.',
}

export const RECOVERY_GUIDANCE = {
  sleep: 'Aim for 7–9 hours of quality sleep per night.',
  active_recovery: 'On rest days, consider light activity such as walking or stretching to promote blood flow and recovery.',
  stress_management: 'Manage stress levels. Elevated cortisol from chronic stress can impair fat loss and muscle retention.',
  deload_signal: 'If performance drops significantly, motivation is very low, or fatigue is persistent, consider an early deload.',
}

// ─── Goal-specific guidance ───────────────────────────────────────────────────
export const GOAL_CONFIG: Record<Goal, {
  label: string
  color: string
  description: string
  calorie_modifier: string
  protein_guidance: string
  cardio_guidance: string
  rest_guidance: string
}> = {
  fat_loss: {
    label: 'Fat Loss',
    color: 'text-orange-400',
    description: 'Preserve muscle while losing body fat through a caloric deficit and high protein.',
    calorie_modifier: '300–500 kcal deficit below TDEE',
    protein_guidance: '2.2–2.4 g per kg bodyweight — prioritise protein to prevent muscle loss.',
    cardio_guidance: '20 min Zone 2 post-workout every session. Optional: 1–2 extra fasted cardio sessions per week.',
    rest_guidance: '60–90 sec between sets. Keep workouts under 75 min.',
  },
  muscle_gain: {
    label: 'Muscle Gain',
    color: 'text-green-400',
    description: 'Build muscle mass through a caloric surplus, progressive overload, and adequate recovery.',
    calorie_modifier: '200–400 kcal surplus above TDEE',
    protein_guidance: '1.8–2.2 g per kg bodyweight. Carbohydrates are your friend — fuel your lifts.',
    cardio_guidance: '10–15 min light cardio post-workout for conditioning. Avoid excessive cardio that impairs recovery.',
    rest_guidance: '2–3 min between heavy compound sets. 60–90 sec for isolation work.',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-blue-400',
    description: 'Maintain current body composition while improving strength and fitness.',
    calorie_modifier: 'Eat at TDEE — adjust based on weekly weight trend.',
    protein_guidance: '1.8–2.0 g per kg bodyweight. Balanced macros.',
    cardio_guidance: '15–20 min Zone 2 post-workout. Flexible based on energy levels.',
    rest_guidance: '90–120 sec between sets. Prioritise performance and form.',
  },
}

// ─── Base program days (from MD file) ────────────────────────────────────────
const BASE_DAYS: ProgramDayData[] = [
  {
    day_number: 1,
    day_name: 'Push – Strength',
    training_type: 'Push / Strength',
    description: 'Heavy compound pushing movements focused on strength development.',
    exercises: [
      { exercise_name: 'Barbell Bench Press', sets: 4, rep_min: 4, rep_max: 6, order_index: 1, notes: 'Focus on controlled descent, explosive press. Full range of motion.' },
      { exercise_name: 'Overhead Press (Barbell)', sets: 4, rep_min: 4, rep_max: 6, order_index: 2, notes: 'Brace core, avoid excessive lumbar extension.' },
      { exercise_name: 'Incline Dumbbell Press', sets: 3, rep_min: 6, rep_max: 8, order_index: 3, notes: '30–45° incline. Control the eccentric.' },
      { exercise_name: 'Cable Lateral Raise', sets: 3, rep_min: 10, rep_max: 15, order_index: 4, notes: 'Unilateral or bilateral. Lead with elbows.' },
      { exercise_name: 'Tricep Pushdown (Cable)', sets: 3, rep_min: 10, rep_max: 12, order_index: 5, notes: 'Keep elbows tucked. Full extension.' },
      { exercise_name: 'Overhead Tricep Extension (Cable/DB)', sets: 3, rep_min: 10, rep_max: 12, order_index: 6, notes: 'Full stretch at bottom. Control the movement.' },
    ],
    cardio: [{ cardio_type: 'Incline Treadmill Walk', duration_min: 20, duration_max: null, intensity: 'Zone 2 (low intensity, conversational pace)', notes: 'Post-workout. Incline 8–12%, speed 4–5 km/h.' }],
  },
  {
    day_number: 2,
    day_name: 'Pull – Strength',
    training_type: 'Pull / Strength',
    description: 'Heavy compound pulling movements focused on strength development.',
    exercises: [
      { exercise_name: 'Weighted Pull-Up', sets: 4, rep_min: 4, rep_max: 6, order_index: 1, notes: 'Add weight via belt or vest. Full hang at bottom, chin over bar.' },
      { exercise_name: 'Barbell Row (Pendlay or Bent-Over)', sets: 4, rep_min: 4, rep_max: 6, order_index: 2, notes: 'Horizontal pull. Retract scapula at top. Control the eccentric.' },
      { exercise_name: 'Seated Cable Row', sets: 3, rep_min: 6, rep_max: 8, order_index: 3, notes: 'Use a close-grip or neutral-grip handle. Drive elbows back.' },
      { exercise_name: 'Face Pull (Cable)', sets: 3, rep_min: 12, rep_max: 15, order_index: 4, notes: 'External rotation at end range. Rear delt and rotator cuff health.' },
      { exercise_name: 'Barbell or Dumbbell Curl', sets: 3, rep_min: 8, rep_max: 10, order_index: 5, notes: 'Supinate at top. Avoid swinging.' },
      { exercise_name: 'Hammer Curl', sets: 3, rep_min: 10, rep_max: 12, order_index: 6, notes: 'Neutral grip. Targets brachialis and brachioradialis.' },
    ],
    cardio: [{ cardio_type: 'Incline Treadmill Walk', duration_min: 20, duration_max: null, intensity: 'Zone 2 (low intensity, conversational pace)', notes: 'Post-workout. Incline 8–12%, speed 4–5 km/h.' }],
  },
  {
    day_number: 3,
    day_name: 'Legs – Strength',
    training_type: 'Legs / Strength',
    description: 'Heavy compound leg movements focused on strength development.',
    exercises: [
      { exercise_name: 'Barbell Back Squat', sets: 4, rep_min: 4, rep_max: 6, order_index: 1, notes: 'High or low bar. Depth to parallel or below. Brace core throughout.' },
      { exercise_name: 'Romanian Deadlift', sets: 4, rep_min: 6, rep_max: 8, order_index: 2, notes: 'Hip hinge. Feel hamstring stretch. Neutral spine.' },
      { exercise_name: 'Leg Press', sets: 3, rep_min: 8, rep_max: 10, order_index: 3, notes: 'Feet shoulder-width. Do not lock out knees at top.' },
      { exercise_name: 'Leg Curl (Seated or Lying)', sets: 3, rep_min: 10, rep_max: 12, order_index: 4, notes: 'Full range of motion. Slow eccentric.' },
      { exercise_name: 'Calf Raise (Standing or Seated)', sets: 4, rep_min: 12, rep_max: 15, order_index: 5, notes: 'Full stretch at bottom. Pause at top.' },
    ],
    cardio: [{ cardio_type: 'Incline Treadmill Walk', duration_min: 20, duration_max: null, intensity: 'Zone 2 (low intensity, conversational pace)', notes: 'Post-workout. Incline 8–12%, speed 4–5 km/h.' }],
  },
  {
    day_number: 4,
    day_name: 'Push – Hypertrophy',
    training_type: 'Push / Hypertrophy',
    description: 'Moderate weight, higher rep pushing movements focused on muscle growth.',
    exercises: [
      { exercise_name: 'Dumbbell Bench Press', sets: 4, rep_min: 8, rep_max: 12, order_index: 1, notes: 'Greater range of motion than barbell. Control the stretch.' },
      { exercise_name: 'Smith Machine or Dumbbell Shoulder Press', sets: 3, rep_min: 10, rep_max: 12, order_index: 2, notes: 'Seated or standing. Full range of motion.' },
      { exercise_name: 'Cable Chest Fly (Low to High)', sets: 3, rep_min: 12, rep_max: 15, order_index: 3, notes: 'Emphasise the stretch. Slight bend in elbows.' },
      { exercise_name: 'Dumbbell Lateral Raise', sets: 4, rep_min: 12, rep_max: 15, order_index: 4, notes: 'Slight forward lean. Lead with elbows. Controlled.' },
      { exercise_name: 'Tricep Dips (Weighted or Bodyweight)', sets: 3, rep_min: 10, rep_max: 12, order_index: 5, notes: 'Upright torso for tricep focus. Full extension at top.' },
      { exercise_name: 'Skull Crushers (EZ Bar or Dumbbell)', sets: 3, rep_min: 10, rep_max: 12, order_index: 6, notes: 'Lower to forehead or behind head. Full extension.' },
    ],
    cardio: [{ cardio_type: 'Incline Treadmill Walk', duration_min: 20, duration_max: null, intensity: 'Zone 2 (low intensity, conversational pace)', notes: 'Post-workout. Incline 8–12%, speed 4–5 km/h.' }],
  },
  {
    day_number: 5,
    day_name: 'Pull – Hypertrophy',
    training_type: 'Pull / Hypertrophy',
    description: 'Moderate weight, higher rep pulling movements focused on muscle growth.',
    exercises: [
      { exercise_name: 'Lat Pulldown (Wide Grip)', sets: 4, rep_min: 10, rep_max: 12, order_index: 1, notes: 'Full stretch at top. Drive elbows down and back.' },
      { exercise_name: 'Single-Arm Dumbbell Row', sets: 4, rep_min: 10, rep_max: 12, order_index: 2, notes: 'Brace on bench. Full range of motion. Squeeze at top.' },
      { exercise_name: 'Cable Pullover', sets: 3, rep_min: 12, rep_max: 15, order_index: 3, notes: 'Straight-arm. Emphasise lat stretch and contraction.' },
      { exercise_name: 'Reverse Fly (Dumbbell or Cable)', sets: 3, rep_min: 12, rep_max: 15, order_index: 4, notes: 'Rear delt focus. Slight bend in elbows. Control.' },
      { exercise_name: 'Incline Dumbbell Curl', sets: 3, rep_min: 10, rep_max: 12, order_index: 5, notes: 'Full stretch at bottom. Supinate at top.' },
      { exercise_name: 'Cable Curl (Straight Bar or EZ)', sets: 3, rep_min: 12, rep_max: 15, order_index: 6, notes: 'Constant tension. Squeeze at top.' },
    ],
    cardio: [{ cardio_type: 'Incline Treadmill Walk', duration_min: 20, duration_max: null, intensity: 'Zone 2 (low intensity, conversational pace)', notes: 'Post-workout. Incline 8–12%, speed 4–5 km/h.' }],
  },
  {
    day_number: 6,
    day_name: 'Legs – Hypertrophy',
    training_type: 'Legs / Hypertrophy',
    description: 'Moderate weight, higher rep leg movements focused on muscle growth.',
    exercises: [
      { exercise_name: 'Hack Squat or Leg Press', sets: 4, rep_min: 10, rep_max: 12, order_index: 1, notes: 'Full depth. Controlled eccentric. Feet shoulder-width.' },
      { exercise_name: 'Bulgarian Split Squat', sets: 3, rep_min: 10, rep_max: 12, order_index: 2, notes: 'Per leg. Rear foot elevated. Upright torso for quad focus.' },
      { exercise_name: 'Leg Extension', sets: 3, rep_min: 12, rep_max: 15, order_index: 3, notes: 'Full extension. Pause at top. Slow eccentric.' },
      { exercise_name: 'Lying Leg Curl', sets: 3, rep_min: 12, rep_max: 15, order_index: 4, notes: 'Full range. Slow eccentric. Squeeze at top.' },
      { exercise_name: 'Hip Thrust (Barbell or Machine)', sets: 3, rep_min: 12, rep_max: 15, order_index: 5, notes: 'Full hip extension. Squeeze glutes at top.' },
      { exercise_name: 'Seated Calf Raise', sets: 4, rep_min: 15, rep_max: 20, order_index: 6, notes: 'Full stretch at bottom. Pause at top. Soleus focus.' },
    ],
    cardio: [{ cardio_type: 'Incline Treadmill Walk', duration_min: 20, duration_max: null, intensity: 'Zone 2 (low intensity, conversational pace)', notes: 'Post-workout. Incline 8–12%, speed 4–5 km/h.' }],
  },
]

// ─── Goal-based program modifiers ────────────────────────────────────────────
function applyGoalModifiers(days: ProgramDayData[], goal: Goal): ProgramDayData[] {
  return days.map((day) => {
    const d = { ...day, exercises: day.exercises.map((e) => ({ ...e })), cardio: day.cardio.map((c) => ({ ...c })) }

    if (goal === 'muscle_gain') {
      // More sets, slightly higher reps, less cardio
      d.exercises = d.exercises.map((e) => ({
        ...e,
        sets: e.sets + 1,
        rep_min: e.rep_min,
        rep_max: e.rep_max + 2,
      }))
      d.cardio = d.cardio.map((c) => ({ ...c, duration_min: 10, notes: 'Keep cardio brief — 10 min light walk to preserve recovery.' }))
    }

    if (goal === 'fat_loss') {
      // Base program as-is — 20 min cardio, standard sets/reps
      d.cardio = d.cardio.map((c) => ({ ...c, duration_min: 20, notes: 'Post-workout Zone 2. Incline 8–12%, speed 4–5 km/h.' }))
    }

    if (goal === 'maintenance') {
      // Slightly reduced volume, moderate cardio
      d.exercises = d.exercises.map((e) => ({
        ...e,
        sets: Math.max(2, e.sets - 1),
      }))
      d.cardio = d.cardio.map((c) => ({ ...c, duration_min: 15, notes: '15 min Zone 2 post-workout.' }))
    }

    return d
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getProgramDays(goal: Goal = 'fat_loss'): ProgramDayData[] {
  return applyGoalModifiers(BASE_DAYS, goal)
}

export const PROGRAM_DAYS = BASE_DAYS // base export for non-goal contexts

export function getProgramDay(dayNumber: number, goal: Goal = 'fat_loss'): ProgramDayData | undefined {
  return getProgramDays(goal).find((d) => d.day_number === dayNumber)
}

export function getTodayProgramDay(goal: Goal = 'fat_loss'): ProgramDayData | null {
  const dow = new Date().getDay()
  const map: Record<number, number | null> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 0: null }
  const dayNum = map[dow]
  if (!dayNum) return null
  return getProgramDay(dayNum, goal) ?? null
}

export const ALL_EXERCISE_NAMES = [
  ...new Set(BASE_DAYS.flatMap((d) => d.exercises.map((e) => e.exercise_name))),
]
