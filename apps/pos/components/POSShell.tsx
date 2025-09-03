import { ReactNode } from "react"

export function POSShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Global header intentionally removed on POS pages */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
