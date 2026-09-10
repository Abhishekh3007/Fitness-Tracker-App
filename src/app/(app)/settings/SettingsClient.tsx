'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertProfile, upsertSettings } from '@/lib/services/data'
import { createClient } from '@/lib/supabase/client'
import { GOAL_CONFIG } from '@/data/program'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/services/auth'
import type { Profile, UserSettings, Goal } from '@/types'

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  height: z.coerce.number().min(0).optional(),
  age: z.coerce.number().min(0).optional(),
  starting_weight: z.coerce.number().min(0).optional(),
  target_weight: z.coerce.number().min(0).optional(),
  current_weight: z.coerce.number().min(0).optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

interface Props {
  userId: string
  email: string
  profile: Profile | null
  settings: UserSettings | null
}

export function SettingsClient({ userId, email, profile, settings }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [goal, setGoal] = useState<Goal>((profile?.goal as Goal) ?? 'fat_loss')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(settings?.weight_unit ?? 'kg')
  const [calorieTarget, setCalorieTarget] = useState(settings?.calorie_target?.toString() ?? '')
  const [proteinTarget, setProteinTarget] = useState(settings?.protein_target?.toString() ?? '')

  const { register, handleSubmit } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      height: profile?.height ?? undefined,
      age: profile?.age ?? undefined,
      starting_weight: profile?.starting_weight ?? undefined,
      target_weight: profile?.target_weight ?? undefined,
      current_weight: profile?.current_weight ?? undefined,
    },
  })

  async function onSave(data: ProfileForm) {
    setSaving(true)
    const [p, s] = await Promise.all([
      upsertProfile({ user_id: userId, ...data, goal }),
      upsertSettings({
        user_id: userId,
        weight_unit: weightUnit,
        calorie_target: calorieTarget ? parseFloat(calorieTarget) : null,
        protein_target: proteinTarget ? parseFloat(proteinTarget) : null,
      }),
    ])
    setSaving(false)
    if (p.error || s.error) { toast.error(p.error?.message ?? s.error?.message ?? 'Failed to save'); return }
    toast.success('Settings saved!')
    router.refresh()
  }

  async function handleExport() {
    const supabase = createClient()
    const [sessions, weights, nutrition, recovery] = await Promise.all([
      supabase.from('workout_sessions').select('*, exercise_logs(*), cardio_logs(*)').eq('user_id', userId),
      supabase.from('weight_logs').select('*').eq('user_id', userId),
      supabase.from('nutrition_logs').select('*').eq('user_id', userId),
      supabase.from('recovery_logs').select('*').eq('user_id', userId),
    ])
    const blob = new Blob([JSON.stringify({
      exported_at: new Date().toISOString(),
      workout_sessions: sessions.data ?? [],
      weight_logs: weights.data ?? [],
      nutrition_logs: nutrition.data ?? [],
      recovery_logs: recovery.data ?? [],
    }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fittrack-export.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported!')
  }

  async function handleDeleteAccount() {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return
    await signOut()
    router.push('/login')
  }

  const goals: { value: Goal; label: string; desc: string }[] = [
    { value: 'fat_loss', label: GOAL_CONFIG.fat_loss.label, desc: GOAL_CONFIG.fat_loss.description },
    { value: 'muscle_gain', label: GOAL_CONFIG.muscle_gain.label, desc: GOAL_CONFIG.muscle_gain.description },
    { value: 'maintenance', label: GOAL_CONFIG.maintenance.label, desc: GOAL_CONFIG.maintenance.description },
  ]

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Goal selector */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-white text-base">Training Goal</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {goals.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${goal === g.value ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}
            >
              <p className={`font-semibold text-sm ${goal === g.value ? 'text-orange-400' : 'text-zinc-300'}`}>{g.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{g.desc}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-white text-base">Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <p className="text-sm text-zinc-500">{email}</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { name: 'name' as const, label: 'Name', type: 'text', full: true },
                { name: 'age' as const, label: 'Age', type: 'number' },
                { name: 'height' as const, label: 'Height (cm)', type: 'number' },
                { name: 'starting_weight' as const, label: 'Starting Weight (kg)', type: 'number' },
                { name: 'current_weight' as const, label: 'Current Weight (kg)', type: 'number' },
                { name: 'target_weight' as const, label: 'Target Weight (kg)', type: 'number' },
              ]).map(({ name, label, type, full }) => (
                <div key={name} className={`space-y-1 ${full ? 'col-span-2' : ''}`}>
                  <Label className="text-xs text-zinc-400">{label}</Label>
                  <Input {...register(name)} type={type} className="bg-zinc-800 border-zinc-700" />
                </div>
              ))}
            </div>

            <Separator className="bg-zinc-800" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Weight Unit</Label>
                <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as 'kg' | 'lbs')}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Calorie Target (kcal)</Label>
                <Input value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)}
                  type="number" className="bg-zinc-800 border-zinc-700" placeholder="e.g. 2200" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-zinc-400">Protein Target (g)</Label>
                <Input value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)}
                  type="number" className="bg-zinc-800 border-zinc-700" placeholder="e.g. 180" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-white text-base">Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={handleExport}>
            Export Data (JSON)
          </Button>
          <Separator className="bg-zinc-800" />
          <Button variant="outline" className="w-full border-red-900 text-red-400 hover:bg-red-950" onClick={handleDeleteAccount}>
            Sign Out & Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
