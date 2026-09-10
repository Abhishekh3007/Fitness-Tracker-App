import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Compute date on server so client gets a stable value — no hydration mismatch
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayNames[now.getDay()]
  const todayFormatted = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const [profileRes, sessionsRes, weightRes, nutritionRes, recoveryRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('workout_sessions').select('date, status, program_day_id').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    supabase.from('weight_logs').select('date, weight').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    supabase.from('nutrition_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
    supabase.from('recovery_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
  ])

  return (
    <DashboardClient
      userId={user.id}
      today={today}
      todayName={todayName}
      todayFormatted={todayFormatted}
      profile={profileRes.data}
      sessions={sessionsRes.data ?? []}
      weightLogs={weightRes.data ?? []}
      nutritionLogs={nutritionRes.data ?? []}
      recoveryLogs={recoveryRes.data ?? []}
    />
  )
}
