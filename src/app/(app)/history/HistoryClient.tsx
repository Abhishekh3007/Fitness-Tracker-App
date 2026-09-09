'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PROGRAM_DAYS } from '@/data/program'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { totalVolume } from '@/lib/calculations'
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import type { WorkoutSession, ExerciseLog } from '@/types'

interface Props {
  userId: string
  sessions: WorkoutSession[]
}

export function HistoryClient({ userId, sessions }: Props) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const { data: expandedLogs } = useQuery({
    queryKey: ['session-logs', expanded],
    queryFn: async () => {
      if (!expanded) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('workout_session_id', expanded)
        .order('set_number')
      return (data ?? []) as ExerciseLog[]
    },
    enabled: !!expanded,
  })

  const filters = ['all', 'Push', 'Pull', 'Legs', 'Strength', 'Hypertrophy']

  const filtered = sessions.filter((s) => {
    const day = PROGRAM_DAYS.find((d) => d.day_number.toString() === s.program_day_id)
    if (filter !== 'all' && day && !day.training_type.includes(filter)) return false
    if (search && day && !day.day_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function getDayInfo(session: WorkoutSession) {
    return PROGRAM_DAYS.find((d) => d.day_number.toString() === session.program_day_id)
  }

  function formatDuration(s: WorkoutSession) {
    if (!s.started_at || !s.completed_at) return '—'
    const mins = Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000)
    return `${mins} min`
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">History</h1>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      <Input value={search} onChange={(e) => setSearch(e.target.value)}
        className="bg-zinc-900 border-zinc-800" placeholder="Search workouts…" />

      {filtered.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No workouts found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const day = getDayInfo(session)
            const isExpanded = expanded === session.id
            const logs = isExpanded ? (expandedLogs ?? []) : []
            const vol = logs.length > 0 ? totalVolume(logs) : null

            return (
              <Card key={session.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : session.id)}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-zinc-400">{session.date}</span>
                        <Badge className={`text-xs ${session.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                          {session.status}
                        </Badge>
                      </div>
                      <p className="font-semibold text-white">{day?.day_name ?? 'Workout'}</p>
                      <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                        <span>{formatDuration(session)}</span>
                        {day && <span>{day.exercises.length} exercises</span>}
                        {vol !== null && <span>{vol.toLocaleString()} kg volume</span>}
                      </div>
                      {session.notes && <p className="text-xs text-zinc-500 mt-1 italic">{session.notes}</p>}
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                      {logs.length === 0 ? (
                        <p className="text-zinc-500 text-sm">No exercise data.</p>
                      ) : (
                        (() => {
                          const byExercise = new Map<string, ExerciseLog[]>()
                          for (const log of logs) {
                            if (!byExercise.has(log.exercise_name)) byExercise.set(log.exercise_name, [])
                            byExercise.get(log.exercise_name)!.push(log)
                          }
                          return [...byExercise.entries()].map(([name, sets]) => (
                            <div key={name}>
                              <p className="text-sm font-medium text-zinc-300 mb-1">{name}</p>
                              <div className="flex flex-wrap gap-2">
                                {sets.map((s) => (
                                  <span key={s.id} className={`text-xs px-2 py-1 rounded ${s.completed ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800/50 text-zinc-500'}`}>
                                    {s.weight ? `${s.weight}kg` : '—'} × {s.actual_reps ?? '—'}
                                    {s.rpe ? ` @${s.rpe}` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        })()
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
