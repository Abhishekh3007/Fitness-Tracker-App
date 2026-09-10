'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getTodayProgramDay, GOAL_CONFIG, getProgramDays } from '@/data/program'
import { weeklyWorkoutCompletion, averageMetric } from '@/lib/calculations'
import { upsertWeightLog } from '@/lib/services/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, Flame, TrendingDown, Zap, Moon, Apple, Target, Scale } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, NutritionLog, RecoveryLog, Goal } from '@/types'

interface Props {
  userId: string
  today: string          // passed from server — stable, no hydration mismatch
  todayName: string
  todayFormatted: string
  profile: Profile | null
  sessions: { date: string; status: string; program_day_id: number | null }[]
  weightLogs: { date: string; weight: number }[]
  nutritionLogs: NutritionLog[]
  recoveryLogs: RecoveryLog[]
}

export function DashboardClient({
  userId, today, todayName, todayFormatted,
  profile, sessions, weightLogs, nutritionLogs, recoveryLogs,
}: Props) {
  const goal: Goal = (profile?.goal as Goal) ?? 'fat_loss'
  const goalCfg = GOAL_CONFIG[goal]
  const todayDay = getTodayProgramDay(goal)
  const todaySession = sessions.find((s) => s.date === today)
  const weeklyPct = weeklyWorkoutCompletion(sessions)
  const router = useRouter()

  const currentWeight = weightLogs[0]?.weight ?? profile?.current_weight ?? null
  const startingWeight = profile?.starting_weight ?? null
  const targetWeight = profile?.target_weight ?? null
  const weightLost = startingWeight && currentWeight
    ? Math.round((startingWeight - currentWeight) * 10) / 10 : null
  const remaining = targetWeight && currentWeight
    ? Math.round((currentWeight - targetWeight) * 10) / 10 : null

  const avgCalories = averageMetric(nutritionLogs, 'calories')
  const avgProtein = averageMetric(nutritionLogs, 'protein')
  const avgSleep = averageMetric(recoveryLogs, 'sleep_hours')

  // Streak — uses server-provided `today`, no Date() in render
  let streak = 0
  const completedDates = [...sessions]
    .filter(s => s.status === 'completed')
    .map(s => s.date)
    .sort()
    .reverse()
  let cur = today
  for (const d of completedDates) {
    if (d === cur) {
      streak++
      const dt = new Date(cur)
      dt.setDate(dt.getDate() - 1)
      cur = dt.toISOString().split('T')[0]
    } else if (d < cur) break
  }

  const [weightInput, setWeightInput] = useState('')
  const [loggingWeight, setLoggingWeight] = useState(false)
  const todayWeightLogged = weightLogs[0]?.date === today
  const programDays = getProgramDays(goal)

  async function logWeight() {
    if (!weightInput) return
    setLoggingWeight(true)
    const { error } = await upsertWeightLog(userId, today, parseFloat(weightInput))
    setLoggingWeight(false)
    if (error) { toast.error('Failed to log weight'); return }
    toast.success('Weight logged!')
    setWeightInput('')
    router.refresh()
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile?.name ? `Hey, ${profile.name.split(' ')[0]} 👋` : 'Dashboard'}
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">{todayName}, {todayFormatted}</p>
        </div>
        <Badge className={`${goalCfg.color} bg-zinc-800 border-zinc-700 text-xs px-2 py-1 shrink-0`}>
          {goalCfg.label}
        </Badge>
      </div>

      {/* Today's Workout */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5">
          {todayDay ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
                  Today · Day {todayDay.day_number}
                </p>
                <h2 className="text-xl font-bold text-white">{todayDay.day_name.toUpperCase()}</h2>
                <p className="text-xs text-zinc-500 mt-1">{todayDay.description}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="border-orange-500/40 text-orange-400 text-xs">
                    <Dumbbell className="h-3 w-3 mr-1" />{todayDay.exercises.length} Exercises
                  </Badge>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                    {todayDay.cardio[0]?.duration_min} min Cardio
                  </Badge>
                  <Badge variant="outline" className={`border-zinc-700 text-xs ${goalCfg.color}`}>
                    {goalCfg.label}
                  </Badge>
                </div>
              </div>
              <div className="shrink-0">
                {todaySession?.status === 'completed' ? (
                  <div className="text-center">
                    <p className="text-green-400 font-semibold text-sm">✓ Completed</p>
                    <Link href="/workout" className="text-xs text-zinc-500 hover:text-zinc-300 mt-1 block">
                      Log another
                    </Link>
                  </div>
                ) : (
                  <Link href="/workout">
                    <Button className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold px-6 h-11">
                      {todaySession?.status === 'in_progress' ? 'Resume Workout' : 'Start Workout'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-2xl mb-2">🛌</p>
              <p className="text-zinc-300 font-semibold">Rest Day</p>
              <p className="text-zinc-500 text-sm mt-1">Recovery is part of the program.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick weight log */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Scale className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-sm font-medium text-zinc-300 flex-1">
              {todayWeightLogged
                ? `Today: ${weightLogs[0].weight} kg ✓`
                : "Log today's weight"}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logWeight()}
                placeholder="kg"
                className="w-20 h-9 rounded-lg bg-zinc-800 border border-zinc-700 text-center text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
              />
              <Button
                size="sm"
                onClick={logWeight}
                disabled={loggingWeight || !weightInput}
                className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-3"
              >
                {loggingWeight ? '…' : 'Log'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={<Flame className="h-4 w-4 text-orange-400" />} label="Streak" value={streak > 0 ? `${streak} days` : '—'} />
        <MetricCard icon={<Zap className="h-4 w-4 text-yellow-400" />} label="This Week" value={sessions.length > 0 ? `${weeklyPct}%` : '—'} />
        <MetricCard
          icon={<TrendingDown className="h-4 w-4 text-green-400" />}
          label="Lost"
          value={weightLost !== null ? `${weightLost > 0 ? '-' : '+'}${Math.abs(weightLost)} kg` : '—'}
        />
        <MetricCard
          icon={<Target className="h-4 w-4 text-blue-400" />}
          label="To Goal"
          value={remaining !== null && remaining > 0 ? `${remaining} kg` : remaining !== null ? '🎯 Done!' : '—'}
        />
      </div>

      {/* Metrics row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard icon={<Apple className="h-4 w-4 text-red-400" />} label="Avg Calories" value={avgCalories !== null ? `${avgCalories} kcal` : '—'} sub="7-day avg" />
        <MetricCard icon={<Dumbbell className="h-4 w-4 text-purple-400" />} label="Avg Protein" value={avgProtein !== null ? `${avgProtein}g` : '—'} sub="7-day avg" />
        <MetricCard icon={<Moon className="h-4 w-4 text-indigo-400" />} label="Avg Sleep" value={avgSleep !== null ? `${avgSleep} hrs` : '—'} sub="7-day avg" />
      </div>

      {/* Weight progress */}
      {(currentWeight || startingWeight || targetWeight) && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Weight Progress</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
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

      {/* Goal guidance */}
      <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-orange-500">
        <CardContent className="p-4 space-y-1.5">
          <p className={`text-xs font-semibold uppercase tracking-widest ${goalCfg.color}`}>
            {goalCfg.label} — Guidance
          </p>
          <p className="text-xs text-zinc-400">🍽 {goalCfg.calorie_modifier}</p>
          <p className="text-xs text-zinc-400">💪 {goalCfg.protein_guidance}</p>
          <p className="text-xs text-zinc-400">🏃 {goalCfg.cardio_guidance}</p>
          <Link href="/settings" className="text-xs text-orange-400 hover:text-orange-300 mt-1 inline-block">
            Change goal →
          </Link>
        </CardContent>
      </Card>

      {/* Week plan */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
            This Week's Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {programDays.map((day) => {
              const isToday = todayDay?.day_number === day.day_number
              const type = day.training_type.split('/')[0].trim()
              const typeColors: Record<string, string> = {
                Push: 'text-orange-400', Pull: 'text-blue-400', Legs: 'text-green-400',
              }
              return (
                <Link
                  key={day.day_number}
                  href="/workout"
                  className={`rounded-xl p-2.5 text-center text-xs transition-colors ${isToday ? 'bg-orange-500/20 border border-orange-500/40' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                >
                  <p className={`font-bold ${isToday ? 'text-orange-400' : 'text-zinc-400'}`}>Day {day.day_number}</p>
                  <p className={`mt-0.5 font-medium ${typeColors[type] ?? 'text-zinc-400'}`}>{type}</p>
                  <p className="text-zinc-600 mt-0.5">{day.exercises.length}ex</p>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
}) {
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
