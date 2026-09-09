import { createClient } from '@/lib/supabase/client'
import type { ExerciseLog, CardioLog } from '@/types'

export async function getWorkoutSessions(userId: string, limit = 30) {
  const supabase = createClient()
  return supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
}

export async function getWorkoutSessionByDate(userId: string, date: string) {
  const supabase = createClient()
  return supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
}

export async function createWorkoutSession(
  userId: string,
  programDayId: number,
  date: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      program_day_id: programDayId,
      date,
      started_at: new Date().toISOString(),
      status: 'in_progress',
    })
    .select()
    .single()
  if (error) console.error('createWorkoutSession error:', error)
  return { data, error }
}

export async function completeWorkoutSession(sessionId: string, notes?: string) {
  const supabase = createClient()
  return supabase
    .from('workout_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString(), notes })
    .eq('id', sessionId)
    .select()
    .single()
}

export async function getExerciseLogs(sessionId: string) {
  const supabase = createClient()
  return supabase
    .from('exercise_logs')
    .select('*')
    .eq('workout_session_id', sessionId)
    .order('set_number')
}

export async function upsertExerciseLog(
  log: Partial<ExerciseLog> & { workout_session_id: string; exercise_name: string; set_number: number }
) {
  const supabase = createClient()
  // Remove program_exercise_id if empty string — it's optional
  const payload = { ...log }
  if (!payload.program_exercise_id) delete payload.program_exercise_id
  if (payload.id) {
    return supabase.from('exercise_logs').update(payload).eq('id', payload.id).select().single()
  }
  return supabase.from('exercise_logs').insert(payload).select().single()
}

export async function upsertCardioLog(
  log: Partial<CardioLog> & { workout_session_id: string; cardio_type: string }
) {
  const supabase = createClient()
  if (log.id) {
    return supabase.from('cardio_logs').update(log).eq('id', log.id).select().single()
  }
  return supabase.from('cardio_logs').insert(log).select().single()
}

export async function getCardioLogs(sessionId: string) {
  const supabase = createClient()
  return supabase.from('cardio_logs').select('*').eq('workout_session_id', sessionId)
}

export async function getLastSessionForDay(userId: string, programDayId: number) {
  const supabase = createClient()
  return supabase
    .from('workout_sessions')
    .select('*, exercise_logs(*)')
    .eq('user_id', userId)
    .eq('program_day_id', programDayId)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function getExerciseHistory(userId: string, exerciseName: string, limit = 10) {
  const supabase = createClient()
  return supabase
    .from('exercise_logs')
    .select('*, workout_sessions!inner(user_id, date)')
    .eq('workout_sessions.user_id', userId)
    .eq('exercise_name', exerciseName)
    .order('created_at', { ascending: false })
    .limit(limit * 10)
}

export async function getWorkoutStreak(userId: string): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('workout_sessions')
    .select('date')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(60)

  if (!data || data.length === 0) return 0

  const dates = data.map((r) => r.date).sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let current = today

  for (const date of dates) {
    if (date === current) {
      streak++
      const d = new Date(current)
      d.setDate(d.getDate() - 1)
      current = d.toISOString().split('T')[0]
    } else if (date < current) {
      break
    }
  }
  return streak
}
