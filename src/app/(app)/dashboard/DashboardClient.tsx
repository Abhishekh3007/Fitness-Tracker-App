'use client'

import Link from 'next/link'
import { getTodayProgramDay, PROGRAM_DAYS } from '@/data/program'
import { weeklyWorkoutCompletion, averageMetric } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, Flame, TrendingDown, Zap, Moon, Apple, Target } from 'lucide-react'
import type { Profile, NutritionLog, RecoveryLog } from '@/types'

interface Props {
  userId: string
  profile: Profile | null
  sessions: { date: string; status: string; program_day_id: string | null }[]
  weightLogs: { date: string; weight: number }[]
  nutritionLogs: NutritionLog[]
  recoveryLogs: RecoveryLog[]
}

export function DashboardClient({ profile, sessions, weightLogs, nutritionLogs, recoveryLogs }: Props) {
  const todayDay = getTodayProgramDay()
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find((s) => s.date === today)
  const weeklyPct = weeklyWorkoutCompletion(sessions)

  const currentWeight = weightLogs[0]?.weight ?? profile?.current_weight ?? null
  const startingWeight = profile?.starting_weight ?? null
  const targetWeight = profile?.target_weight ?? null
  const weightLost = startingWeight && currentWeight ? Math.round((startingWeight - currentWeight) * 10) / 10 : null
  const remaining = targetWeight && currentWeight ? Math.round((currentWeight - targetWeight) * 10) / 10 : null

  const avgCalories = averageMetric(nutritionLogs, 'calories')
  const avgProtein = averageMetric(nutritionLogs, 'protein')
  const avgSleep = averageMetric(recoveryLogs, 'sleep_hours')

  // streak
  let streak = 0
  const sortedDates = [...sessions].filter(s => s.status === 'completed').map(s => s.date).sort().reverse()
  let cur = today
  for (const d of sortedDates) {
    if (d === cur) {
      streak++
      const dt = new Date(cur); dt.setDate(dt.getDate() - 1)
      cur = dt.toISOString().split('T')[0]
    } else if (d < cur) break
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayNames[new Date().getDay()]

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {profile?.name ? `Hey, ${profile.name.split(' ')[0]} 👋` : 'Dashboard'}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">{todayName}, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Today's Workout */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          {todayDay ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Today</p>
                <p className="text-zinc-400 text-sm">{todayName} · Day {todayDay.day_number}</p>
                <h2 className="text-xl font-bold text-white mt-1">{todayDay.day_name.toUpperCase()}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="border-orange-500/40 text-orange-400 text-xs">
                    <Dumbbell className="h-3 w-3 mr-1" />
                    {todayDay.exercises.length} Exercises
                  </Badge>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                    {todayDay.cardio[0]?.duration_min} min Cardio
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {todaySession?.status === 'completed' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">✓ Completed</Badge>
                ) : (
                  <Link href={`/workout?day=${todayDay.day_number}`}>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6">
                      {todaySession?.status === 'in_progress' ? 'Resume Workout' : 'Start Workout'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-zinc-400 font-medium">Rest Day 🛌</p>
              <p className="text-zinc-500 text-sm mt-1">Recovery is part of the program.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={<Flame className="h-4 w-4 text-orange-400" />} label="Streak" value={streak > 0 ? `${streak} days` : '—'} />
        <MetricCard icon={<Zap className="h-4 w-4 text-yellow-400" />} label="Weekly" value={sessions.length > 0 ? `${weeklyPct}%` : '—'} />
        <MetricCard icon={<TrendingDown className="h-4 w-4 text-green-400" />} label="Lost" value={weightLost !== null ? `${weightLost} kg` : '—'} />
        <MetricCard icon={<Target className="h-4 w-4 text-blue-400" />} label="Remaining" value={remaining !== null && remaining > 0 ? `${remaining} kg` : remaining !== null ? 'Goal reached!' : '—'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard icon={<Apple className="h-4 w-4 text-red-400" />} label="Avg Calories" value={avgCalories !== null ? `${avgCalories} kcal` : '—'} sub="7-day avg" />
        <MetricCard icon={<Dumbbell className="h-4 w-4 text-purple-400" />} label="Avg Protein" value={avgProtein !== null ? `${avgProtein}g` : '—'} sub="7-day avg" />
        <MetricCard icon={<Moon className="h-4 w-4 text-indigo-400" />} label="Avg Sleep" value={avgSleep !== null ? `${avgSleep} hrs` : '—'} sub="7-day avg" />
      </div>

      {/* Weight summary */}
      {(currentWeight || startingWeight || targetWeight) && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 font-medium uppercase tracking-widest">Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Starting</p>
                <p className="text-lg font-bold text-white">{startingWeight ? `${startingWeight} kg` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Current</p>
                <p className="text-lg font-bold text-orange-400">{currentWeight ? `${currentWeight} kg` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Target</p>
                <p className="text-lg font-bold text-white">{targetWeight ? `${targetWeight} kg` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week program overview */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium uppercase tracking-widest">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {PROGRAM_DAYS.map((day) => {
              const dayMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 }
              const isToday = todayDay?.day_number === day.day_number
              const type = day.training_type.split('/')[0].trim()
              return (
                <div key={day.day_number} className={`rounded-lg p-2 text-center text-xs ${isToday ? 'bg-orange-500/20 border border-orange-500/40' : 'bg-zinc-800'}`}>
                  <p className={`font-semibold ${isToday ? 'text-orange-400' : 'text-zinc-300'}`}>Day {day.day_number}</p>
                  <p className="text-zinc-500 mt-0.5">{type}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
