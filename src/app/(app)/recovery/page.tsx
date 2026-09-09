import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecoveryClient } from './RecoveryClient'

export default async function RecoveryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('recovery_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  return <RecoveryClient userId={user.id} logs={logs ?? []} />
}
