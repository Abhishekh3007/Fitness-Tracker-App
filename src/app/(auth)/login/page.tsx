'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, resetPassword } from '@/lib/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    router.push('/dashboard')
  }

  async function handleForgotPassword() {
    const email = getValues('email')
    if (!email) { toast.error('Enter your email first'); return }
    const { error } = await resetPassword(email)
    if (error) toast.error(error.message)
    else toast.success('Password reset email sent')
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Sign In</CardTitle>
        <CardDescription>Track your fitness journey</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')}
              className="bg-zinc-800 border-zinc-700" placeholder="you@example.com" />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')}
              className="bg-zinc-800 border-zinc-700" placeholder="••••••••" />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={handleForgotPassword}
              className="text-zinc-400 hover:text-white transition-colors">
              Forgot password?
            </button>
            <Link href="/signup" className="text-orange-400 hover:text-orange-300">
              Create account
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
