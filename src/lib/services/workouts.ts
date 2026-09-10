import { createClient } from '@/lib/supabase/client'
import type { ExerciseLog, CardioLog } from '@/types'

export async function getWorkoutSessions(userId: string, limit = 30) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) console.error('getWorkoutSessions:', error.message)
  return { data: data ?? [], error }
}

export async function getWorkoutSessionByDate(userId: string, date: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  if (error) console.error('getWorkoutSessionByDate:', error.message)
  return { data, error }
}

export async function createWorkoutSession(userId: string, programDayId: number, date: string) {
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
  if (error) console.error('createWorkoutSession:', error.message)
  return { data, error }
}

export async function completeWorkoutSession(sessionId: string, durationSeconds: number, notes?: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration: Math.floor(durationSeconds / 60),
      notes: notes ?? null,
    })
    .eq('id', sessionId)
    .select()
    .single()
  if (error) console.error('completeWorkoutSession:', error.message)
  return { data, error }
}

export async function getExerciseLogs(sessionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('workout_session_id', sessionId)
    .order('set_number')
  if (error) console.error('getExerciseLogs:', error.message)
  return { data: data ?? [], error }
}

export async function upsertExerciseLog(
  log: Partial<ExerciseLog> & { workout_session_id: string; exercise_name: string; set_number: number }
) {
  const supabase = createClient()
  // Strip empty optional FK
  const payload: Record<string, unknown> = { ...log }
  if (!payload.program_exercise_id) delete payload.program_exercise_id
  if (!payload.id) delete payload.id

  const { data, error } = payload.id
    ? await supabase.from('exercise_logs').update(payload).eq('id', payload.id as string).select().single()
    : await supabase.from('exercise_logs').insert(payload).select().single()

  if (error) console.error('upsertExerciseLog:', error.message)
  return { data, error }
}

export async function upsertCardioLog(
  log: Partial<CardioLog> & { workout_session_id: string; cardio_type: string }
) {
  const supabase = createClient()
  const payload: Record<string, unknown> = { ...log }
  if (!payload.id) delete payload.id

  const { data, error } = payload.id
    ? await supabase.from('cardio_logs').update(payload).eq('id', payload.id as string).select().single()
    : await supabase.from('cardio_logs').insert(payload).select().single()

  if (error) console.error('upsertCardioLog:', error.message)
  return { data, error }
}

export async function getCardioLogs(sessionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardio_logs')
    .select('*')
    .eq('workout_session_id', sessionId)
  if (error) console.error('getCardioLogs:', error.message)
  return { data: data ?? [], error }
}

export async function getLastSessionForDay(userId: string, programDayId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, exercise_logs(*)')
    .eq('user_id', userId)
    .eq('program_day_id', programDayId)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) console.error('getLastSessionForDay:', error.message)
  return { data, error }
}

export async function getExerciseHistory(userId: string, exerciseName: string) {
  const supabase = createClient()
  // Get sessions for this user, then join exercise_logs
  const { data: sessions, error: sErr } = await supabase
    .from('workout_sessions')
    .select('id, date')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(20)

  if (sErr || !sessions?.length) return { data: [], error: sErr }

  const sessionIds = sessions.map((s) => s.id)
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .in('workout_session_id', sessionIds)
    .eq('exercise_name', exerciseName)
    .eq('completed', true)
    .order('created_at', { ascending: true })

  if (error) console.error('getExerciseHistory:', error.message)

  // Attach date from sessions
  const sessionMap = new Map(sessions.map((s) => [s.id, s.date]))
  const enriched = (data ?? []).map((log) => ({
    ...log,
    date: sessionMap.get(log.workout_session_id) ?? '',
  }))
  return { data: enriched, error }
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

  if (!data?.length) return 0

  const unique = [...new Set(data.map((r) => r.date))].sort().reverse()
  let streak = 0
  let cur = new Date().toISOString().split('T')[0]

  for (const date of unique) {
    if (date === cur) {
      streak++
      const d = new Date(cur)
      d.setDate(d.getDate() - 1)
      cur = d.toISOString().split('T')[0]
    } else if (date < cur) {
      break
    }
  }
  return streak
}
