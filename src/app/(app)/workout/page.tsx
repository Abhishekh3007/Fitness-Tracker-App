import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkoutClient } from './WorkoutClient'
import { PROGRAM_DAYS } from '@/data/program'

export default async function WorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; session?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const dayNum = params.day ? parseInt(params.day) : null
  const programDay = dayNum ? PROGRAM_DAYS.find((d) => d.day_number === dayNum) ?? null : null

  return <WorkoutClient userId={user.id} initialDay={programDay} allDays={PROGRAM_DAYS} />
}
