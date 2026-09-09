import { Activity } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <Activity className="h-7 w-7 text-orange-500" />
        <span className="text-2xl font-bold text-white">FitTrack</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
