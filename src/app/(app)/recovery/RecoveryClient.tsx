'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertRecoveryLog } from '@/lib/services/data'
import { RECOVERY_GUIDANCE } from '@/data/program'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { RecoveryLog } from '@/types'

const schema = z.object({
  sleep_hours: z.coerce.number().min(0).max(24).optional(),
  sleep_quality: z.coerce.number().min(1).max(10).optional(),
  energy: z.coerce.number().min(1).max(10).optional(),
  soreness: z.coerce.number().min(1).max(10).optional(),
  stress: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  userId: string
  today: string
  todayFormatted: string
  logs: RecoveryLog[]
}

export function RecoveryClient({ userId, today, todayFormatted, logs }: Props) {
  const todayLog = logs.find((l) => l.date === today)
  const [allLogs, setAllLogs] = useState(logs)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sleep_hours: todayLog?.sleep_hours ?? undefined,
      sleep_quality: todayLog?.sleep_quality ?? undefined,
      energy: todayLog?.energy ?? undefined,
      soreness: todayLog?.soreness ?? undefined,
      stress: todayLog?.stress ?? undefined,
      notes: todayLog?.notes ?? '',
    },
  })

  const values = watch()
  const radarData = [
    { metric: 'Sleep', value: values.sleep_quality ?? 0 },
    { metric: 'Energy', value: values.energy ?? 0 },
    { metric: 'Recovery', value: values.soreness ? 11 - values.soreness : 0 },
    { metric: 'Calm', value: values.stress ? 11 - values.stress : 0 },
  ]

  async function onSubmit(data: FormData) {
    setSaving(true)
    const { error, data: saved } = await upsertRecoveryLog({ user_id: userId, date: today, ...data })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Recovery logged!')
    if (saved) setAllLogs((prev) => [saved, ...prev.filter((l) => l.date !== today)])
  }

  const fields = [
    { name: 'sleep_hours' as const, label: 'Sleep Hours', placeholder: '7.5', step: '0.5', max: '24' },
    { name: 'sleep_quality' as const, label: 'Sleep Quality (1–10)', placeholder: '7', step: '1', max: '10' },
    { name: 'energy' as const, label: 'Energy Level (1–10)', placeholder: '7', step: '1', max: '10' },
    { name: 'soreness' as const, label: 'Soreness (1–10)', placeholder: '3', step: '1', max: '10' },
    { name: 'stress' as const, label: 'Stress (1–10)', placeholder: '3', step: '1', max: '10' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Recovery</h1>

      <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-indigo-500">
        <CardContent className="p-4 space-y-1">
          <p className="text-xs text-indigo-400 uppercase tracking-widest font-medium">Program Guidance</p>
          <p className="text-sm text-zinc-300">{RECOVERY_GUIDANCE.sleep}</p>
          <p className="text-sm text-zinc-300">{RECOVERY_GUIDANCE.active_recovery}</p>
          <p className="text-sm text-zinc-300">{RECOVERY_GUIDANCE.stress_management}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Today — {todayFormatted}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {fields.map(({ name, label, placeholder, step, max }) => (
                <div key={name} className="space-y-1">
                  <Label className="text-xs text-zinc-400">{label}</Label>
                  <Input {...register(name)} type="number" step={step} max={max} min="0"
                    className="bg-zinc-800 border-zinc-700" placeholder={placeholder} />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Notes</Label>
                <Input {...register('notes')} className="bg-zinc-800 border-zinc-700" placeholder="How are you feeling?" />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                {saving ? 'Saving…' : todayLog ? 'Update Today' : 'Save Today'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-base">Today's Snapshot</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#3f3f46" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 11 }} />
                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                  <div className="flex gap-3 text-xs">
                    {log.sleep_hours != null && <span className="text-indigo-400">{log.sleep_hours}h</span>}
                    {log.energy != null && <span className="text-yellow-400">Energy {log.energy}/10</span>}
                    {log.soreness != null && <span className="text-red-400">Soreness {log.soreness}/10</span>}
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
