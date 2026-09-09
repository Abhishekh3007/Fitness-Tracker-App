import type { WeightLog, ExerciseLog, NutritionLog, RecoveryLog } from '@/types'

export function sevenDayAverage(logs: WeightLog[]): { date: string; avg: number }[] {
  if (logs.length < 2) return []
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((log, i) => {
    const window = sorted.slice(Math.max(0, i - 6), i + 1)
    const avg = window.reduce((s, l) => s + l.weight, 0) / window.length
    return { date: log.date, avg: Math.round(avg * 10) / 10 }
  })
}

export function totalVolume(logs: ExerciseLog[]): number {
  return logs.reduce((sum, l) => {
    if (l.weight && l.actual_reps) return sum + l.weight * l.actual_reps
    return sum
  }, 0)
}

export function checkProgressionAvailable(
  logs: ExerciseLog[],
  repMax: number
): boolean {
  if (logs.length === 0) return false
  const bySet = new Map<number, ExerciseLog>()
  for (const log of logs) bySet.set(log.set_number, log)
  return [...bySet.values()].every(
    (l) => l.actual_reps !== null && l.actual_reps >= repMax && l.completed
  )
}

export function averageMetric(
  logs: (NutritionLog | RecoveryLog)[],
  key: string
): number | null {
  const vals = logs
    .map((l) => (l as unknown as Record<string, unknown>)[key] as number | null)
    .filter((v): v is number => v !== null && v !== undefined)
  if (vals.length === 0) return null
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
}

export function weeklyWorkoutCompletion(
  sessions: { date: string; status: string }[],
  totalDays = 6
): number {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEnd = new Date(now).toISOString().split('T')[0]
  const thisWeek = sessions.filter(
    (s) => s.date >= weekStartStr && s.date <= weekEnd && s.status === 'completed'
  )
  return Math.round((thisWeek.length / totalDays) * 100)
}

export function formatWeight(weight: number, unit: 'kg' | 'lbs'): string {
  if (unit === 'lbs') return `${Math.round(weight * 2.20462 * 10) / 10} lbs`
  return `${weight} kg`
}
