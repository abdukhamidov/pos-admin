"use client"
import { ReactNode, type ComponentType, useState } from 'react'
import { cn, Button, Input } from '@mini/ui'
import { LayoutDashboard, Package, Tags, Users, BarChart3, LogOut, Building2, Boxes, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> }

const nav: NavItem[] = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/branches', label: 'Филиалы', icon: Building2 },
  { href: '/warehouses', label: 'Склады', icon: Boxes },
  { href: '/categories', label: 'Категории', icon: Tags },
  { href: '/products', label: 'Товары', icon: Package },
  { href: '/users', label: 'Пользователи', icon: Users },
  { href: '/reports', label: 'Отчёты', icon: BarChart3 },
]

export function AdminShell({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  async function logout() {
    try { await fetch('/api/logout', { method: 'POST' }) } catch {}
    window.location.href = '/login'
  }
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="border-r px-4 py-4 w-60 shrink-0 hidden md:block">
          <div className="px-2 py-1.5 text-sm font-semibold">WINSTRIKE BAR</div>
          <nav className="mt-2 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <a key={item.href} href={item.href} className={cn('flex items-center gap-2 rounded-md px-2 py-2 text-sm', active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
                  <item.icon className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-80')} />
                  <span>{item.label}</span>
                </a>
              )
            })}
            {/* Static link: Inventory */}
            <a
              href="/inventory"
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-2 text-sm',
                pathname === '/inventory' || pathname?.startsWith('/inventory')
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Boxes className={cn('h-4 w-4', pathname === '/inventory' || pathname?.startsWith('/inventory') ? 'opacity-100' : 'opacity-80')} />
              <span>Остатки</span>
            </a>
          </nav>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute left-0 top-0 h-full w-64 bg-background border-r p-4">
              <div className="px-2 py-1.5 text-sm font-semibold">WINSTRIKE BAR</div>
              <nav className="mt-2 space-y-1">
                {nav.map((item) => {
                  const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                  return (
                    <a key={item.href} href={item.href} className={cn('flex items-center gap-2 rounded-md px-2 py-2 text-sm', active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
                      <item.icon className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-80')} />
                      <span>{item.label}</span>
                    </a>
                  )
                })}
                {/* Static link: Inventory */}
                <a
                  href="/inventory"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-2 text-sm',
                    pathname === '/inventory' || pathname?.startsWith('/inventory')
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Boxes className={cn('h-4 w-4', pathname === '/inventory' || pathname?.startsWith('/inventory') ? 'opacity-100' : 'opacity-80')} />
                  <span>Остатки</span>
                </a>
              </nav>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex min-h-screen flex-col flex-1">
          <header className="flex items-center gap-3 h-14 border-b px-4">
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Input placeholder="Поиск" className="w-56 hidden sm:block" />
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" /> Выйти
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
