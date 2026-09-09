'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { sevenDayAverage } from '@/lib/calculations'
import { ALL_EXERCISE_NAMES } from '@/data/program'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Profile } from '@/types'

interface Props {
  userId: string
  profile: Profile | null
  weightLogs: { date: string; weight: number }[]
  sessions: { id: string; date: string }[]
}

export function ProgressClient({ userId, profile, weightLogs, sessions }: Props) {
  const [selectedExercise, setSelectedExercise] = useState(ALL_EXERCISE_NAMES[0])

  const { data: exerciseLogs } = useQuery({
    queryKey: ['exercise-history', userId, selectedExercise],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('exercise_logs')
        .select('*, workout_sessions!inner(user_id, date)')
        .eq('workout_sessions.user_id', userId)
        .eq('exercise_name', selectedExercise)
        .eq('completed', true)
        .order('created_at', { ascending: true })
      return data ?? []
    },
    enabled: !!selectedExercise,
  })

  const avgData = sevenDayAverage(weightLogs as import('@/types').WeightLog[])
  const weightChartData = weightLogs.map((w) => ({
    date: w.date.slice(5),
    weight: w.weight,
    avg: avgData.find((a) => a.date === w.date)?.avg,
  }))

  // Build strength chart: max weight per session date
  const strengthData = (() => {
    if (!exerciseLogs || exerciseLogs.length === 0) return []
    const byDate = new Map<string, number>()
    for (const log of exerciseLogs) {
      const date = (log as { workout_sessions: { date: string } }).workout_sessions?.date
      if (!date || !log.weight) continue
      byDate.set(date, Math.max(byDate.get(date) ?? 0, log.weight))
    }
    return [...byDate.entries()].sort().map(([date, weight]) => ({ date: date.slice(5), weight }))
  })()

  const currentWeight = weightLogs[weightLogs.length - 1]?.weight
  const startingWeight = profile?.starting_weight
  const targetWeight = profile?.target_weight
  const totalChange = startingWeight && currentWeight ? Math.round((currentWeight - startingWeight) * 10) / 10 : null

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Progress</h1>

      {/* Weight summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Starting', value: startingWeight ? `${startingWeight} kg` : '—' },
          { label: 'Current', value: currentWeight ? `${currentWeight} kg` : '—', highlight: true },
          { label: 'Target', value: targetWeight ? `${targetWeight} kg` : '—' },
          { label: 'Total Change', value: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange} kg` : '—', color: totalChange !== null && totalChange < 0 ? 'text-green-400' : 'text-red-400' },
        ].map((item) => (
          <Card key={item.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.highlight ? 'text-orange-400' : item.color ?? 'text-white'}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weight chart */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Body Weight</CardTitle>
        </CardHeader>
        <CardContent>
          {weightChartData.length < 2 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Log your weight to see the chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#a1a1aa' }} itemStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={1.5} dot={false} name="Weight" />
                <Line type="monotone" dataKey="avg" stroke="#fb923c" strokeWidth={2} dot={false} strokeDasharray="4 2" name="7-day avg" />
                {targetWeight && <ReferenceLine y={targetWeight} stroke="#22c55e" strokeDasharray="4 2" label={{ value: 'Target', fill: '#22c55e', fontSize: 11 }} />}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Strength chart */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base">Strength Progress</CardTitle>
          <Select value={selectedExercise} onValueChange={(v) => setSelectedExercise(v ?? ALL_EXERCISE_NAMES[0])}>
            <SelectTrigger className="w-52 bg-zinc-800 border-zinc-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {ALL_EXERCISE_NAMES.map((name) => (
                <SelectItem key={name} value={name} className="text-zinc-300 focus:bg-zinc-800">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {strengthData.length < 2 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Not enough data yet. Complete more workouts.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={strengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={['auto', 'auto']} unit=" kg" />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#a1a1aa' }} itemStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} name="Max Weight" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
