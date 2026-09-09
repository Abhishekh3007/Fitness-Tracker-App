import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'FitTrack — Personal Fitness Tracker',
  description: 'Advanced 6-Day PPL Fat-Loss Program Tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        <QueryProvider>
          {children}
          <Toaster theme="dark" />
        </QueryProvider>
      </body>
    </html>
  )
}
