'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertNutritionLog } from '@/lib/services/data'
import { NUTRITION_GUIDANCE } from '@/data/program'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { NutritionLog, UserSettings } from '@/types'

const schema = z.object({
  calories: z.coerce.number().min(0).optional(),
  protein: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  fat: z.coerce.number().min(0).optional(),
  water: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  userId: string
  today: string
  todayFormatted: string
  logs: NutritionLog[]
  settings: UserSettings | null
}

export function NutritionClient({ userId, today, todayFormatted, logs, settings }: Props) {
  const todayLog = logs.find((l) => l.date === today)
  const [allLogs, setAllLogs] = useState(logs)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      calories: todayLog?.calories ?? undefined,
      protein: todayLog?.protein ?? undefined,
      carbs: todayLog?.carbs ?? undefined,
      fat: todayLog?.fat ?? undefined,
      water: todayLog?.water ?? undefined,
      notes: todayLog?.notes ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    const { error, data: saved } = await upsertNutritionLog({ user_id: userId, date: today, ...data })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Nutrition logged!')
    if (saved) setAllLogs((prev) => [saved, ...prev.filter((l) => l.date !== today)])
  }

  const chartData = [...allLogs].reverse().slice(-14).map((l) => ({
    date: l.date.slice(5),
    calories: l.calories ?? 0,
    protein: l.protein ?? 0,
  }))

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Nutrition</h1>

      <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-orange-500">
        <CardContent className="p-4 space-y-1">
          <p className="text-xs text-orange-400 uppercase tracking-widest font-medium">Program Guidance</p>
          <p className="text-sm text-zinc-300">{NUTRITION_GUIDANCE.protein_guidance}</p>
          <p className="text-sm text-zinc-300">{NUTRITION_GUIDANCE.calorie_guidance}</p>
          <p className="text-sm text-zinc-300">{NUTRITION_GUIDANCE.water_guidance}</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Today — {todayFormatted}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {([
                { name: 'calories' as const, label: 'Calories (kcal)', target: settings?.calorie_target },
                { name: 'protein' as const, label: 'Protein (g)', target: settings?.protein_target },
                { name: 'carbs' as const, label: 'Carbs (g)', target: null },
                { name: 'fat' as const, label: 'Fat (g)', target: null },
                { name: 'water' as const, label: 'Water (L)', target: 3.5 },
              ]).map(({ name, label, target }) => (
                <div key={name} className="space-y-1">
                  <Label className="text-xs text-zinc-400">
                    {label}{target ? <span className="text-zinc-600 ml-1">target: {target}</span> : ''}
                  </Label>
                  <Input {...register(name)} type="number" step="0.1"
                    className="bg-zinc-800 border-zinc-700" placeholder="0" />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Notes</Label>
              <Input {...register('notes')} className="bg-zinc-800 border-zinc-700" placeholder="Meal notes…" />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={saving}>
              {saving ? 'Saving…' : todayLog ? 'Update Today' : 'Save Today'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {chartData.length > 1 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-base">14-Day Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                <Bar dataKey="calories" fill="#f97316" name="Calories" radius={[3, 3, 0, 0]} />
                <Bar dataKey="protein" fill="#a78bfa" name="Protein (g)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-white text-base">Recent</CardTitle></CardHeader>
        <CardContent>
          {allLogs.length === 0 ? (
            <p className="text-zinc-500 text-sm">No logs yet.</p>
          ) : (
            <div className="space-y-2">
              {allLogs.slice(0, 7).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-400">{log.date}</span>
                  <div className="flex gap-4 text-sm">
                    {log.calories != null && <span className="text-orange-400">{log.calories} kcal</span>}
                    {log.protein != null && <span className="text-purple-400">{log.protein}g protein</span>}
                    {log.water != null && <span className="text-blue-400">{log.water}L</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
