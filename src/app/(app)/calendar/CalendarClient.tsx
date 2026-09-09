'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PROGRAM_DAYS } from '@/data/program'

interface Props {
  userId: string
  sessions: { date: string; status: string }[]
  weightDates: string[]
  nutritionDates: string[]
  recoveryDates: string[]
}

export function CalendarClient({ sessions, weightDates, nutritionDates, recoveryDates }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
  const daysInMonth = lastDay.getDate()
  const today = now.toISOString().split('T')[0]

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function getStatus(day: number) {
    const d = dateStr(day)
    const session = sessions.find((s) => s.date === d)
    const hasWeight = weightDates.includes(d)
    const hasNutrition = nutritionDates.includes(d)
    const hasRecovery = recoveryDates.includes(d)
    const isPast = d < today
    const isToday = d === today

    // Determine program day (Mon=1...Sat=6, Sun=rest)
    const dow = new Date(d).getDay()
    const programDayMap: Record<number, number | null> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 0: null }
    const programDay = programDayMap[dow]

    return { session, hasWeight, hasNutrition, hasRecovery, isPast, isToday, programDay }
  }

  const monthName = new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const nullCells: (number | null)[] = Array.from({ length: startDow }, () => null)
  const dayCells: (number | null)[] = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const cells: (number | null)[] = [...nullCells, ...dayCells]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Calendar</h1>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <CardTitle className="text-white text-base">{monthName}</CardTitle>
          <button onClick={next} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center text-xs text-zinc-500 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const { session, hasWeight, hasNutrition, hasRecovery, isPast, isToday, programDay } = getStatus(day)
              const isCompleted = session?.status === 'completed'
              const isPartial = session?.status === 'in_progress'
              const isPlanned = !session && programDay !== null && !isPast

              return (
                <Link key={i} href={`/history?date=${dateStr(day)}`}
                  className={`relative rounded-lg p-1.5 min-h-[52px] flex flex-col items-center transition-colors
                    ${isToday ? 'bg-orange-500/20 border border-orange-500/50' : 'hover:bg-zinc-800'}
                    ${isCompleted ? 'bg-green-500/10' : ''}
                  `}>
                  <span className={`text-sm font-medium ${isToday ? 'text-orange-400' : isPast ? 'text-zinc-400' : 'text-zinc-300'}`}>
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                    {isCompleted && <span className="text-green-400 text-xs">✓</span>}
                    {isPartial && <span className="text-yellow-400 text-xs">◐</span>}
                    {isPlanned && <span className="text-zinc-600 text-xs">○</span>}
                    {hasWeight && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />}
                    {hasNutrition && <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />}
                    {hasRecovery && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />}
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1"><span className="text-green-400">✓</span> Completed</span>
        <span className="flex items-center gap-1"><span className="text-yellow-400">◐</span> Partial</span>
        <span className="flex items-center gap-1"><span className="text-zinc-600">○</span> Planned</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Weight</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Nutrition</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Recovery</span>
      </div>
    </div>
  )
}
