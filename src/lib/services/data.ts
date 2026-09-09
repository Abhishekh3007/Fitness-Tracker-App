import { createClient } from '@/lib/supabase/client'
import type { WeightLog, NutritionLog, RecoveryLog, Profile, UserSettings } from '@/types'

// ── Weight ────────────────────────────────────────────────────────────────────
export async function getWeightLogs(userId: string, limit = 90) {
  const supabase = createClient()
  return supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
}

export async function upsertWeightLog(userId: string, date: string, weight: number, notes?: string) {
  const supabase = createClient()
  return supabase
    .from('weight_logs')
    .upsert({ user_id: userId, date, weight, notes }, { onConflict: 'user_id,date' })
    .select()
    .single()
}

// ── Nutrition ─────────────────────────────────────────────────────────────────
export async function getNutritionLogs(userId: string, limit = 30) {
  const supabase = createClient()
  return supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
}

export async function getNutritionLogByDate(userId: string, date: string) {
  const supabase = createClient()
  return supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
}

export async function upsertNutritionLog(log: Partial<NutritionLog> & { user_id: string; date: string }) {
  const supabase = createClient()
  return supabase
    .from('nutrition_logs')
    .upsert(log, { onConflict: 'user_id,date' })
    .select()
    .single()
}

// ── Recovery ──────────────────────────────────────────────────────────────────
export async function getRecoveryLogs(userId: string, limit = 30) {
  const supabase = createClient()
  return supabase
    .from('recovery_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
}

export async function getRecoveryLogByDate(userId: string, date: string) {
  const supabase = createClient()
  return supabase
    .from('recovery_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
}

export async function upsertRecoveryLog(log: Partial<RecoveryLog> & { user_id: string; date: string }) {
  const supabase = createClient()
  return supabase
    .from('recovery_logs')
    .upsert(log, { onConflict: 'user_id,date' })
    .select()
    .single()
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const supabase = createClient()
  return supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
}

export async function upsertProfile(profile: Partial<Profile> & { user_id: string }) {
  const supabase = createClient()
  return supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSettings(userId: string) {
  const supabase = createClient()
  return supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
}

export async function upsertSettings(settings: Partial<UserSettings> & { user_id: string }) {
  const supabase = createClient()
  return supabase
    .from('user_settings')
    .upsert({ ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()
}
