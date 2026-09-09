import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [sessionsRes, weightRes, nutritionRes, recoveryRes] = await Promise.all([
    supabase.from('workout_sessions').select('date, status').eq('user_id', user.id).gte('date', firstOfMonth).lte('date', lastOfMonth),
    supabase.from('weight_logs').select('date').eq('user_id', user.id).gte('date', firstOfMonth).lte('date', lastOfMonth),
    supabase.from('nutrition_logs').select('date').eq('user_id', user.id).gte('date', firstOfMonth).lte('date', lastOfMonth),
    supabase.from('recovery_logs').select('date').eq('user_id', user.id).gte('date', firstOfMonth).lte('date', lastOfMonth),
  ])

  return (
    <CalendarClient
      userId={user.id}
      sessions={sessionsRes.data ?? []}
      weightDates={(weightRes.data ?? []).map((w) => w.date)}
      nutritionDates={(nutritionRes.data ?? []).map((n) => n.date)}
      recoveryDates={(recoveryRes.data ?? []).map((r) => r.date)}
    />
  )
}
