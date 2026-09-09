import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NutritionClient } from './NutritionClient'

export default async function NutritionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [logsRes, settingsRes] = await Promise.all([
    supabase.from('nutrition_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <NutritionClient
      userId={user.id}
      logs={logsRes.data ?? []}
      settings={settingsRes.data}
    />
  )
}
