import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NutritionClient } from './NutritionClient'

export default async function NutritionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const todayFormatted = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

  const [logsRes, settingsRes] = await Promise.all([
    supabase.from('nutrition_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <NutritionClient
      userId={user.id}
      today={today}
      todayFormatted={todayFormatted}
      logs={logsRes.data ?? []}
      settings={settingsRes.data}
    />
  )
}
