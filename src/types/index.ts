export type Goal = 'fat_loss' | 'muscle_gain' | 'maintenance'

export interface Profile {
  id: string
  user_id: string
  name: string | null
  height: number | null
  age: number | null
  starting_weight: number | null
  target_weight: number | null
  current_weight: number | null
  preferred_units: 'kg' | 'lbs'
  goal: Goal | null
  created_at: string
  updated_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  program_day_id: number | null
  date: string
  started_at: string | null
  completed_at: string | null
  duration: number | null
  status: 'in_progress' | 'completed' | 'skipped'
  notes: string | null
}

export interface ExerciseLog {
  id: string
  workout_session_id: string
  program_exercise_id: string
  exercise_name: string
  set_number: number
  target_reps: number
  weight: number | null
  actual_reps: number | null
  rpe: number | null
  completed: boolean
  notes: string | null
}

export interface CardioLog {
  id: string
  workout_session_id: string
  cardio_type: string
  duration: number | null
  distance: number | null
  intensity: string | null
  completed: boolean
  notes: string | null
}

export interface WeightLog {
  id: string
  user_id: string
  date: string
  weight: number
  notes: string | null
}

export interface NutritionLog {
  id: string
  user_id: string
  date: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  water: number | null
  notes: string | null
}

export interface RecoveryLog {
  id: string
  user_id: string
  date: string
  sleep_hours: number | null
  sleep_quality: number | null
  energy: number | null
  soreness: number | null
  stress: number | null
  notes: string | null
}

export interface UserSettings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  weight_unit: 'kg' | 'lbs'
  preferred_units: 'metric' | 'imperial'
  calorie_target: number | null
  protein_target: number | null
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

// Program data types (static)
export interface ProgramDayData {
  day_number: number
  day_name: string
  training_type: string
  description: string
  exercises: ProgramExerciseData[]
  cardio: ProgramCardioData[]
}

export interface ProgramExerciseData {
  exercise_name: string
  sets: number
  rep_min: number
  rep_max: number
  order_index: number
  notes: string | null
}

export interface ProgramCardioData {
  cardio_type: string
  duration_min: number
  duration_max: number | null
  intensity: string | null
  notes: string | null
}
