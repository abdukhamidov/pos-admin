import '../app/globals.css'
import type { Metadata } from 'next'
import { POSShell } from '@/components/POSShell'

export const metadata: Metadata = {
  title: 'Mini CRM — POS',
  description: 'Point of Sale',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background text-foreground">
        <POSShell>{children}</POSShell>
      </body>
    </html>
  )
}
