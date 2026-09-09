import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkoutClient } from './WorkoutClient'
import { PROGRAM_DAYS } from '@/data/program'

export default async function WorkoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <WorkoutClient userId={user.id} initialDay={null} allDays={PROGRAM_DAYS} />
}
