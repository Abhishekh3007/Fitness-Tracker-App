import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProgressClient } from './ProgressClient'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, weightRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: true }).limit(90),
    supabase.from('workout_sessions').select('id, date, program_day_id, status').eq('user_id', user.id).eq('status', 'completed').order('date', { ascending: false }).limit(50),
  ])

  return (
    <ProgressClient
      userId={user.id}
      profile={profileRes.data}
      weightLogs={weightRes.data ?? []}
      sessions={sessionsRes.data ?? []}
    />
  )
}
