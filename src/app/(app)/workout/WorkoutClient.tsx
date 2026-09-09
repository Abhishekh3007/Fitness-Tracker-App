'use client'

import { useState, useEffect, useRef } from 'react'
import { PROGRAM_DAYS, PROGRESSION_RULES } from '@/data/program'
import type { ProgramDayData } from '@/types'
import {
  createWorkoutSession, completeWorkoutSession,
  upsertExerciseLog, upsertCardioLog,
  getExerciseLogs, getCardioLogs, getLastSessionForDay,
} from '@/lib/services/workouts'
import { checkProgressionAvailable } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { CheckCircle2, ChevronRight, Timer, TrendingUp, Dumbbell, Play, Pause, RotateCcw } from 'lucide-react'

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
}

interface Props {
  userId: string
  initialDay: ProgramDayData | null
  allDays: ProgramDayData[]
}

export function WorkoutClient({ userId, initialDay, allDays }: Props) {
  const [selectedDay, setSelectedDay] = useState<ProgramDayData | null>(initialDay)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({})
  const [cardioState, setCardioState] = useState({ duration: '', distance: '', completed: false, notes: '' })
  const [cardioLogId, setCardioLogId] = useState<string | undefined>()
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  // Rest timer
  const [timerSeconds, setTimerSeconds] = useState(90)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDisplay, setTimerDisplay] = useState(90)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerDisplay((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            toast.success('Rest complete! Time to go.')
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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (started && startTime && !completed) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [started, startTime, completed])

  async function handleStartWorkout() {
    if (!selectedDay) return
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await createWorkoutSession(userId, selectedDay.day_number, today)
    if (error || !data) {
      toast.error(`Failed to start workout: ${error?.message ?? 'unknown error'}`)
      return
    }
    setSessionId(data.id)
    setStarted(true)
    setStartTime(new Date())

    // Load last session once for the whole day
    const { data: lastData } = await getLastSessionForDay(userId, selectedDay.day_number)

    // Init exercise states
    const states: Record<string, ExerciseState> = {}
    for (const ex of selectedDay.exercises) {
      const sets: SetRow[] = Array.from({ length: ex.sets }, (_, i) => ({
        set_number: i + 1, weight: '', actual_reps: '', rpe: '', completed: false,
      }))
      let lastSession = null
      if (lastData?.exercise_logs) {
        const logs = (lastData.exercise_logs as { exercise_name: string; weight: number; actual_reps: number }[])
          .filter((l) => l.exercise_name === ex.exercise_name)
        if (logs.length > 0) {
          const w = logs[0].weight
          const reps = logs.map((l) => l.actual_reps).filter(Boolean)
          lastSession = { weight: w, reps }
          sets.forEach((s) => { s.weight = w?.toString() ?? '' })
        }
      }
      const progressionAvailable = lastSession
        ? checkProgressionAvailable(
            logs_from_last(lastData?.exercise_logs ?? [], ex.exercise_name),
            ex.rep_max
          )
        : false
      states[ex.exercise_name] = { sets, lastSession, progressionAvailable }
    }
    setExerciseStates(states)
    toast.success(`${selectedDay.day_name} started!`)
  }

  function logs_from_last(logs: unknown[], exerciseName: string) {
    return (logs as { exercise_name: string; set_number: number; weight: number; actual_reps: number; completed: boolean }[])
      .filter((l) => l.exercise_name === exerciseName)
      .map((l) => ({ ...l, rpe: null, notes: null, id: '', workout_session_id: '', program_exercise_id: '', target_reps: 0 }))
  }

  function updateSet(exerciseName: string, setIdx: number, field: keyof SetRow, value: string | boolean) {
    setExerciseStates((prev) => {
      const ex = { ...prev[exerciseName] }
      const sets = [...ex.sets]
      sets[setIdx] = { ...sets[setIdx], [field]: value }
      return { ...prev, [exerciseName]: { ...ex, sets } }
    })
  }

  async function saveSet(exerciseName: string, setIdx: number) {
    if (!sessionId) return
    const ex = exerciseStates[exerciseName]
    const set = ex.sets[setIdx]
    const programEx = selectedDay!.exercises.find((e) => e.exercise_name === exerciseName)!
    const { data, error } = await upsertExerciseLog({
      id: set.id,
      workout_session_id: sessionId,
      exercise_name: exerciseName,
      set_number: set.set_number,
      target_reps: programEx.rep_max,
      weight: set.weight ? parseFloat(set.weight) : null,
      actual_reps: set.actual_reps ? parseInt(set.actual_reps) : null,
      rpe: set.rpe ? parseFloat(set.rpe) : null,
      completed: set.completed,
    })
    if (!error && data) {
      updateSet(exerciseName, setIdx, 'id', data.id)
    }
    // Start rest timer
    setTimerDisplay(timerSeconds)
    setTimerRunning(true)
  }

  async function handleFinishWorkout() {
    if (!sessionId) return
    const durationMins = Math.floor(elapsed / 60)
    await completeWorkoutSession(sessionId, workoutNotes || undefined)
    setCompleted(true)
    toast.success('Workout saved!')
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  if (!selectedDay && !started) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-white">Workout</h1>
        <p className="text-zinc-400 text-sm">Select a workout to begin</p>
        <div className="grid gap-3">
          {allDays.map((day) => (
            <Card key={day.day_number} className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-orange-500/50 transition-colors"
              onClick={() => setSelectedDay(day)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Day {day.day_number}</p>
                  <p className="font-semibold text-white">{day.day_name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{day.exercises.length} exercises · {day.cardio[0]?.duration_min} min cardio</p>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-500" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (completed) {
    const totalSets = selectedDay ? selectedDay.exercises.reduce((s, e) => s + e.sets, 0) : 0
    const completedSets = Object.values(exerciseStates).flatMap((e) => e.sets).filter((s) => s.completed).length
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-white">Workout Complete!</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-2xl font-bold text-orange-400">{formatTime(elapsed)}</p>
            <p className="text-xs text-zinc-500 mt-1">Duration</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{completedSets}/{totalSets}</p>
            <p className="text-xs text-zinc-500 mt-1">Sets</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-400">✓</p>
            <p className="text-xs text-zinc-500 mt-1">Cardio</p>
          </div>
        </div>
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { setCompleted(false); setStarted(false); setSelectedDay(null); setSessionId(null) }}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Day {selectedDay?.day_number}</p>
          <h1 className="text-xl font-bold text-white">{selectedDay?.day_name}</h1>
        </div>
        {started && (
          <div className="text-right">
            <p className="text-orange-400 font-mono text-lg font-bold">{formatTime(elapsed)}</p>
            <p className="text-xs text-zinc-500">elapsed</p>
          </div>
        )}
      </div>

      {/* Rest Timer */}
      {started && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3 flex items-center gap-3">
            <Timer className="h-4 w-4 text-orange-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-zinc-500 mb-1">Rest Timer</p>
              <p className={`font-mono text-xl font-bold ${timerDisplay <= 10 ? 'text-red-400' : 'text-white'}`}>{formatTime(timerDisplay)}</p>
            </div>
            <div className="flex gap-2">
              {[60, 90, 120, 180].map((s) => (
                <button key={s} onClick={() => { setTimerSeconds(s); setTimerDisplay(s); setTimerRunning(false) }}
                  className={`text-xs px-2 py-1 rounded ${timerSeconds === s ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  {s}s
                </button>
              ))}
              <button onClick={() => setTimerRunning(!timerRunning)}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:text-white">
                {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={() => { setTimerDisplay(timerSeconds); setTimerRunning(false) }}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:text-white">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {!started ? (
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 text-lg" onClick={handleStartWorkout}>
          <Dumbbell className="h-5 w-5 mr-2" /> Start Workout
        </Button>
      ) : (
        <Tabs defaultValue="exercises">
          <TabsList className="bg-zinc-900 border border-zinc-800 w-full">
            <TabsTrigger value="exercises" className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Exercises</TabsTrigger>
            <TabsTrigger value="cardio" className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Cardio</TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="space-y-4 mt-4">
            {selectedDay?.exercises.map((ex) => {
              const state = exerciseStates[ex.exercise_name]
              if (!state) return null
              return (
                <Card key={ex.exercise_name} className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-base">{ex.exercise_name}</CardTitle>
                        <p className="text-xs text-zinc-500 mt-0.5">Target: {ex.sets} × {ex.rep_min}–{ex.rep_max} reps</p>
                      </div>
                      {state.progressionAvailable && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shrink-0">
                          <TrendingUp className="h-3 w-3 mr-1" /> Progress
                        </Badge>
                      )}
                    </div>
                    {state.lastSession && (
                      <div className="mt-2 p-2 bg-zinc-800 rounded-lg text-xs text-zinc-400">
                        <span className="text-zinc-500">Last: </span>
                        <span className="text-white font-medium">{state.lastSession.weight}kg</span>
                        {' · '}
                        {state.lastSession.reps.join(', ')} reps
                        {state.progressionAvailable && (
                          <span className="text-green-400 ml-2">→ Consider increasing weight</span>
                        )}
                      </div>
                    )}
                    {ex.notes && <p className="text-xs text-zinc-500 mt-1 italic">{ex.notes}</p>}
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-5 gap-1 text-xs text-zinc-500 mb-2 px-1">
                      <span>SET</span><span>WEIGHT</span><span>REPS</span><span>RPE</span><span></span>
                    </div>
                    {state.sets.map((set, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-1 mb-2 items-center">
                        <span className="text-zinc-400 text-sm font-medium pl-1">{set.set_number}</span>
                        <Input value={set.weight} onChange={(e) => updateSet(ex.exercise_name, idx, 'weight', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 h-10 text-center text-sm p-1" placeholder="kg" type="number" />
                        <Input value={set.actual_reps} onChange={(e) => updateSet(ex.exercise_name, idx, 'actual_reps', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 h-10 text-center text-sm p-1" placeholder={`${ex.rep_min}-${ex.rep_max}`} type="number" />
                        <Input value={set.rpe} onChange={(e) => updateSet(ex.exercise_name, idx, 'rpe', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 h-10 text-center text-sm p-1" placeholder="6-10" type="number" />
                        <button
                          onClick={() => { updateSet(ex.exercise_name, idx, 'completed', !set.completed); saveSet(ex.exercise_name, idx) }}
                          className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${set.completed ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}>
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="cardio" className="mt-4">
            {selectedDay?.cardio.map((c, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white">{c.cardio_type}</CardTitle>
                  <p className="text-sm text-zinc-400">{c.intensity}</p>
                  <p className="text-xs text-zinc-500">Target: {c.duration_min} min</p>
                  {c.notes && <p className="text-xs text-zinc-500 italic">{c.notes}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Duration (min)</p>
                      <Input value={cardioState.duration} onChange={(e) => setCardioState((p) => ({ ...p, duration: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700" placeholder={c.duration_min.toString()} type="number" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Distance (optional)</p>
                      <Input value={cardioState.distance} onChange={(e) => setCardioState((p) => ({ ...p, distance: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700" placeholder="km" type="number" />
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
                    }}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${cardioState.completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                    {cardioState.completed ? '✓ Cardio Complete' : 'Mark Complete'}
                  </button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {started && (
        <div className="space-y-3 pt-2">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Workout Notes</p>
            <textarea value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-600 resize-none"
              rows={2} placeholder="How did it feel?" />
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-5" onClick={handleFinishWorkout}>
            Finish Workout
          </Button>
        </div>
      )}
    </div>
  )
}
