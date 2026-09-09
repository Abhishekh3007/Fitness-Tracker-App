'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PROGRAM_DAYS } from '@/data/program'
import type { ProgramDayData } from '@/types'
import {
  createWorkoutSession,
  completeWorkoutSession,
  upsertExerciseLog,
  upsertCardioLog,
  getLastSessionForDay,
} from '@/lib/services/workouts'
import { checkProgressionAvailable } from '@/lib/calculations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CheckCircle2, ChevronRight, Timer, TrendingUp,
  Dumbbell, Play, Pause, RotateCcw, ArrowLeft,
  ChevronDown, ChevronUp, Waves,
} from 'lucide-react'

interface SetRow {
  id?: string
  set_number: number
  weight: string
  actual_reps: string
  rpe: string
  completed: boolean
}

interface ExerciseState {
  sets: SetRow[]
  lastSession: { weight: number; reps: number[] } | null
  progressionAvailable: boolean
  collapsed: boolean
}

interface Props {
  userId: string
  initialDay: ProgramDayData | null
  allDays: ProgramDayData[]
}

type Screen = 'select' | 'active' | 'complete'

export function WorkoutClient({ userId, initialDay, allDays }: Props) {
  const [screen, setScreen] = useState<Screen>(initialDay ? 'select' : 'select')
  const [selectedDay, setSelectedDay] = useState<ProgramDayData | null>(initialDay)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({})
  const [cardioState, setCardioState] = useState({ duration: '', distance: '', completed: false })
  const [cardioLogId, setCardioLogId] = useState<string | undefined>()
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [activeTab, setActiveTab] = useState<'exercises' | 'cardio'>('exercises')
  const [starting, setStarting] = useState(false)

  // Rest timer
  const [timerPreset, setTimerPreset] = useState(90)
  const [timerDisplay, setTimerDisplay] = useState(90)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed timer
  useEffect(() => {
    let iv: ReturnType<typeof setInterval>
    if (screen === 'active' && startTime) {
      iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000)
    }
    return () => clearInterval(iv)
  }, [screen, startTime])

  // Rest timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerDisplay((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            toast.success('Rest over — next set!')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  async function handleStartWorkout() {
    if (!selectedDay || starting) return
    setStarting(true)
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await createWorkoutSession(userId, selectedDay.day_number, today)
    if (error || !data) {
      toast.error(error?.message ?? 'Failed to start workout')
      setStarting(false)
      return
    }
    setSessionId(data.id)
    setStartTime(new Date())

    // Load previous session
    const { data: lastData } = await getLastSessionForDay(userId, selectedDay.day_number)
    const prevLogs = (lastData?.exercise_logs ?? []) as {
      exercise_name: string; set_number: number; weight: number; actual_reps: number; completed: boolean
    }[]

    const states: Record<string, ExerciseState> = {}
    for (const ex of selectedDay.exercises) {
      const exLogs = prevLogs.filter((l) => l.exercise_name === ex.exercise_name)
      const sets: SetRow[] = Array.from({ length: ex.sets }, (_, i) => ({
        set_number: i + 1,
        weight: exLogs[0]?.weight?.toString() ?? '',
        actual_reps: '',
        rpe: '',
        completed: false,
      }))
      const lastSession = exLogs.length > 0
        ? { weight: exLogs[0].weight, reps: exLogs.map((l) => l.actual_reps).filter(Boolean) }
        : null
      const progressionAvailable = lastSession
        ? checkProgressionAvailable(
            exLogs.map((l) => ({ ...l, rpe: null, notes: null, id: '', workout_session_id: '', program_exercise_id: '', target_reps: ex.rep_max })),
            ex.rep_max
          )
        : false
      states[ex.exercise_name] = { sets, lastSession, progressionAvailable, collapsed: false }
    }
    setExerciseStates(states)
    setStarting(false)
    setScreen('active')
    toast.success(`${selectedDay.day_name} — let's go!`)
  }

  const updateSet = useCallback((exName: string, idx: number, field: keyof SetRow, value: string | boolean) => {
    setExerciseStates((prev) => {
      const ex = prev[exName]
      const sets = [...ex.sets]
      sets[idx] = { ...sets[idx], [field]: value }
      return { ...prev, [exName]: { ...ex, sets } }
    })
  }, [])

  async function completeSet(exName: string, idx: number) {
    if (!sessionId || !selectedDay) return
    const ex = exerciseStates[exName]
    const set = ex.sets[idx]
    const programEx = selectedDay.exercises.find((e) => e.exercise_name === exName)!
    const newCompleted = !set.completed
    updateSet(exName, idx, 'completed', newCompleted)

    const { data, error } = await upsertExerciseLog({
      id: set.id,
      workout_session_id: sessionId,
      exercise_name: exName,
      set_number: set.set_number,
      target_reps: programEx.rep_max,
      weight: set.weight ? parseFloat(set.weight) : null,
      actual_reps: set.actual_reps ? parseInt(set.actual_reps) : null,
      rpe: set.rpe ? parseFloat(set.rpe) : null,
      completed: newCompleted,
    })
    if (data) updateSet(exName, idx, 'id', data.id)
    if (error) toast.error('Failed to save set')

    if (newCompleted) {
      setTimerDisplay(timerPreset)
      setTimerRunning(true)
    }
  }

  async function handleFinish() {
    if (!sessionId) return
    await completeWorkoutSession(sessionId, workoutNotes || undefined)
    setScreen('complete')
    toast.success('Workout saved!')
  }

  function resetTimer(preset: number) {
    setTimerPreset(preset)
    setTimerDisplay(preset)
    setTimerRunning(false)
  }

  const totalSets = selectedDay?.exercises.reduce((s, e) => s + e.sets, 0) ?? 0
  const completedSets = Object.values(exerciseStates).flatMap((e) => e.sets).filter((s) => s.completed).length

  // ── SELECT DAY ──────────────────────────────────────────────────────────────
  if (screen === 'select') {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Workout</h1>
          <p className="text-zinc-400 text-sm mb-6">Select today's session</p>
          <div className="space-y-3">
            {allDays.map((day) => {
              const typeColor: Record<string, string> = {
                'Push': 'text-orange-400', 'Pull': 'text-blue-400', 'Legs': 'text-green-400',
              }
              const type = day.training_type.split('/')[0].trim()
              const subtype = day.training_type.split('/')[1]?.trim()
              return (
                <button
                  key={day.day_number}
                  onClick={() => { setSelectedDay(day); handleStartWorkoutForDay(day) }}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 active:scale-[0.98] rounded-xl p-4 flex items-center justify-between transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-zinc-300">{day.day_number}</span>
                    </div>
                    <div>
                      <p className={`font-semibold text-base ${typeColor[type] ?? 'text-white'}`}>{day.day_name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{day.exercises.length} exercises · {day.cardio[0]?.duration_min} min cardio · {subtype}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-600 shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── COMPLETE ────────────────────────────────────────────────────────────────
  if (screen === 'complete') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-2">Workout Complete!</h1>
        <p className="text-zinc-400 mb-8">{selectedDay?.day_name}</p>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
          {[
            { label: 'Duration', value: fmt(elapsed), color: 'text-orange-400' },
            { label: 'Sets Done', value: `${completedSets}/${totalSets}`, color: 'text-white' },
            { label: 'Cardio', value: cardioState.completed ? '✓' : '—', color: 'text-green-400' },
          ].map((m) => (
            <div key={m.label} className="bg-zinc-900 rounded-xl p-4">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
        <Button
          className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-semibold"
          onClick={() => { setScreen('select'); setSelectedDay(null); setSessionId(null); setExerciseStates({}); setCardioState({ duration: '', distance: '', completed: false }); setElapsed(0) }}
        >
          Done
        </Button>
      </div>
    )
  }

  // ── ACTIVE WORKOUT ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-zinc-950">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('select')} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Day {selectedDay?.day_number}</p>
            <p className="font-bold text-white text-sm leading-tight">{selectedDay?.day_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-orange-400 font-mono text-base font-bold leading-none">{fmt(elapsed)}</p>
            <p className="text-xs text-zinc-600">elapsed</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-base leading-none">{completedSets}/{totalSets}</p>
            <p className="text-xs text-zinc-600">sets</p>
          </div>
        </div>
      </div>

      {/* Sticky rest timer */}
      <div className="sticky top-[61px] z-20 bg-zinc-900 border-b border-zinc-800 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <Timer className="h-4 w-4 text-orange-400 shrink-0" />
          <p className={`font-mono text-xl font-bold w-14 ${timerDisplay <= 10 && timerRunning ? 'text-red-400' : 'text-white'}`}>
            {fmt(timerDisplay)}
          </p>
          <div className="flex gap-1.5 flex-1">
            {[60, 90, 120, 180].map((s) => (
              <button key={s} onClick={() => resetTimer(s)}
                className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${timerPreset === s ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                {s}s
              </button>
            ))}
          </div>
          <button onClick={() => setTimerRunning(!timerRunning)}
            className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white shrink-0">
            {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={() => { setTimerDisplay(timerPreset); setTimerRunning(false) }}
            className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white shrink-0">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 shrink-0 bg-zinc-950">
        <button onClick={() => setActiveTab('exercises')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'exercises' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500'}`}>
          <Dumbbell className="h-4 w-4 inline mr-1.5" />Exercises
        </button>
        <button onClick={() => setActiveTab('cardio')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'cardio' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500'}`}>
          <Waves className="h-4 w-4 inline mr-1.5" />Cardio
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'exercises' && (
          <div className="p-3 space-y-3">
            {selectedDay?.exercises.map((ex) => {
              const state = exerciseStates[ex.exercise_name]
              if (!state) return null
              const allDone = state.sets.every((s) => s.completed)
              return (
                <div key={ex.exercise_name} className={`rounded-xl border transition-colors ${allDone ? 'bg-zinc-900/50 border-green-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
                  {/* Exercise header */}
                  <button
                    className="w-full flex items-center justify-between p-4 text-left"
                    onClick={() => setExerciseStates((prev) => ({
                      ...prev,
                      [ex.exercise_name]: { ...prev[ex.exercise_name], collapsed: !prev[ex.exercise_name].collapsed }
                    }))}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${allDone ? 'text-green-400' : 'text-white'}`}>{ex.exercise_name}</p>
                        {allDone && <span className="text-green-400 text-xs">✓</span>}
                        {state.progressionAvailable && !allDone && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1.5 py-0">
                            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />↑
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{ex.sets} × {ex.rep_min}–{ex.rep_max} reps</p>
                      {state.lastSession && (
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Last: {state.lastSession.weight}kg · {state.lastSession.reps.join(', ')} reps
                          {state.progressionAvailable && <span className="text-green-500 ml-1">→ increase weight</span>}
                        </p>
                      )}
                    </div>
                    {state.collapsed
                      ? <ChevronDown className="h-4 w-4 text-zinc-600 shrink-0 ml-2" />
                      : <ChevronUp className="h-4 w-4 text-zinc-600 shrink-0 ml-2" />
                    }
                  </button>

                  {!state.collapsed && (
                    <div className="px-3 pb-3">
                      {/* Column headers */}
                      <div className="grid grid-cols-[28px_1fr_1fr_1fr_44px] gap-1.5 mb-1.5 px-1">
                        <span className="text-xs text-zinc-600 text-center">#</span>
                        <span className="text-xs text-zinc-600 text-center">KG</span>
                        <span className="text-xs text-zinc-600 text-center">REPS</span>
                        <span className="text-xs text-zinc-600 text-center">RPE</span>
                        <span />
                      </div>
                      {state.sets.map((set, idx) => (
                        <div key={idx} className={`grid grid-cols-[28px_1fr_1fr_1fr_44px] gap-1.5 mb-1.5 items-center ${set.completed ? 'opacity-60' : ''}`}>
                          <span className="text-sm font-bold text-zinc-400 text-center">{set.set_number}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={set.weight}
                            onChange={(e) => updateSet(ex.exercise_name, idx, 'weight', e.target.value)}
                            placeholder="—"
                            className="h-11 w-full rounded-lg bg-zinc-800 border border-zinc-700 text-center text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.actual_reps}
                            onChange={(e) => updateSet(ex.exercise_name, idx, 'actual_reps', e.target.value)}
                            placeholder={`${ex.rep_min}-${ex.rep_max}`}
                            className="h-11 w-full rounded-lg bg-zinc-800 border border-zinc-700 text-center text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            inputMode="decimal"
                            value={set.rpe}
                            onChange={(e) => updateSet(ex.exercise_name, idx, 'rpe', e.target.value)}
                            placeholder="RPE"
                            className="h-11 w-full rounded-lg bg-zinc-800 border border-zinc-700 text-center text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                          <button
                            onClick={() => completeSet(ex.exercise_name, idx)}
                            className={`h-11 w-11 rounded-lg flex items-center justify-center transition-colors shrink-0 ${set.completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-500 active:bg-zinc-700'}`}
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      {ex.notes && <p className="text-xs text-zinc-600 italic mt-2 px-1">{ex.notes}</p>}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Notes + Finish */}
            <div className="pt-2 space-y-3">
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Workout notes…"
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleFinish}
                className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base transition-colors"
              >
                Finish Workout
              </button>
            </div>
          </div>
        )}

        {activeTab === 'cardio' && selectedDay?.cardio.map((c, i) => (
          <div key={i} className="p-4 space-y-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <p className="font-bold text-white text-base">{c.cardio_type}</p>
              <p className="text-sm text-zinc-400 mt-0.5">{c.intensity}</p>
              <p className="text-xs text-zinc-500 mt-1">Target: {c.duration_min} min</p>
              {c.notes && <p className="text-xs text-zinc-600 italic mt-1">{c.notes}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">Duration (min)</p>
                <input
                  type="number" inputMode="numeric"
                  value={cardioState.duration}
                  onChange={(e) => setCardioState((p) => ({ ...p, duration: e.target.value }))}
                  placeholder={c.duration_min.toString()}
                  className="h-12 w-full rounded-xl bg-zinc-900 border border-zinc-800 text-center text-white text-base focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">Distance (km)</p>
                <input
                  type="number" inputMode="decimal"
                  value={cardioState.distance}
                  onChange={(e) => setCardioState((p) => ({ ...p, distance: e.target.value }))}
                  placeholder="optional"
                  className="h-12 w-full rounded-xl bg-zinc-900 border border-zinc-800 text-center text-white text-base focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <button
              onClick={async () => {
                if (!sessionId) return
                const newCompleted = !cardioState.completed
                setCardioState((p) => ({ ...p, completed: newCompleted }))
                const { data } = await upsertCardioLog({
                  id: cardioLogId,
                  workout_session_id: sessionId,
                  cardio_type: c.cardio_type,
                  duration: cardioState.duration ? parseInt(cardioState.duration) : c.duration_min,
                  distance: cardioState.distance ? parseFloat(cardioState.distance) : null,
                  intensity: c.intensity ?? null,
                  completed: newCompleted,
                })
                if (data) setCardioLogId(data.id)
                if (newCompleted) toast.success('Cardio logged!')
              }}
              className={`w-full h-14 rounded-xl font-bold text-base transition-colors ${cardioState.completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'}`}
            >
              {cardioState.completed ? '✓ Cardio Complete' : 'Mark Complete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  // Helper called from select screen
  async function handleStartWorkoutForDay(day: ProgramDayData) {
    setSelectedDay(day)
    setStarting(true)
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await createWorkoutSession(userId, day.day_number, today)
    if (error || !data) {
      toast.error(error?.message ?? 'Failed to start workout')
      setStarting(false)
      return
    }
    setSessionId(data.id)
    setStartTime(new Date())

    const { data: lastData } = await getLastSessionForDay(userId, day.day_number)
    const prevLogs = (lastData?.exercise_logs ?? []) as {
      exercise_name: string; set_number: number; weight: number; actual_reps: number; completed: boolean
    }[]

    const states: Record<string, ExerciseState> = {}
    for (const ex of day.exercises) {
      const exLogs = prevLogs.filter((l) => l.exercise_name === ex.exercise_name)
      const sets: SetRow[] = Array.from({ length: ex.sets }, (_, i) => ({
        set_number: i + 1,
        weight: exLogs[0]?.weight?.toString() ?? '',
        actual_reps: '',
        rpe: '',
        completed: false,
      }))
      const lastSession = exLogs.length > 0
        ? { weight: exLogs[0].weight, reps: exLogs.map((l) => l.actual_reps).filter(Boolean) }
        : null
      const progressionAvailable = lastSession
        ? checkProgressionAvailable(
            exLogs.map((l) => ({ ...l, rpe: null, notes: null, id: '', workout_session_id: '', program_exercise_id: '', target_reps: ex.rep_max })),
            ex.rep_max
          )
        : false
      states[ex.exercise_name] = { sets, lastSession, progressionAvailable, collapsed: false }
    }
    setExerciseStates(states)
    setStarting(false)
    setScreen('active')
    toast.success(`${day.day_name} — let's go!`)
  }
}
