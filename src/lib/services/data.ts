import { createClient } from '@/lib/supabase/client'
import type { WeightLog, NutritionLog, RecoveryLog, Profile, UserSettings } from '@/types'

// ── Weight ────────────────────────────────────────────────────────────────────
export async function getWeightLogs(userId: string, limit = 90) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) console.error('getWeightLogs:', error.message)
  return { data: data ?? [], error }
}

export async function upsertWeightLog(userId: string, date: string, weight: number, notes?: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weight_logs')
    .upsert({ user_id: userId, date, weight, notes: notes ?? null }, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) console.error('upsertWeightLog:', error.message)
  return { data, error }
}

// ── Nutrition ─────────────────────────────────────────────────────────────────
export async function getNutritionLogs(userId: string, limit = 30) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) console.error('getNutritionLogs:', error.message)
  return { data: data ?? [], error }
}

export async function getNutritionLogByDate(userId: string, date: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  if (error) console.error('getNutritionLogByDate:', error.message)
  return { data, error }
}

export async function upsertNutritionLog(log: Partial<NutritionLog> & { user_id: string; date: string }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('nutrition_logs')
    .upsert(log, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) console.error('upsertNutritionLog:', error.message)
  return { data, error }
}

// ── Recovery ──────────────────────────────────────────────────────────────────
export async function getRecoveryLogs(userId: string, limit = 30) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recovery_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) console.error('getRecoveryLogs:', error.message)
  return { data: data ?? [], error }
}

export async function getRecoveryLogByDate(userId: string, date: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recovery_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  if (error) console.error('getRecoveryLogByDate:', error.message)
  return { data, error }
}

export async function upsertRecoveryLog(log: Partial<RecoveryLog> & { user_id: string; date: string }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recovery_logs')
    .upsert(log, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) console.error('upsertRecoveryLog:', error.message)
  return { data, error }
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) console.error('getProfile:', error.message)
  return { data, error }
}

export async function upsertProfile(profile: Partial<Profile> & { user_id: string }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) console.error('upsertProfile:', error.message)
  return { data, error }
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSettings(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) console.error('getSettings:', error.message)
  return { data, error }
}

export async function upsertSettings(settings: Partial<UserSettings> & { user_id: string }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) console.error('upsertSettings:', error.message)
  return { data, error }
}
