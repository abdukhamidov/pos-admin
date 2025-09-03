import '../app/globals.css'
import type { Metadata } from 'next'
import { AdminShell } from '@/components/AdminShell'
import { Toaster } from '@mini/ui'
import { ToastBridge } from '@/components/ToastBridge'

export const metadata: Metadata = {
  title: 'Mini CRM — Admin',
  description: 'Admin panel for Mini CRM',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background text-foreground">
        <AdminShell>{children}</AdminShell>
        <Toaster />
        <ToastBridge />
      </body>
    </html>
  )
}
