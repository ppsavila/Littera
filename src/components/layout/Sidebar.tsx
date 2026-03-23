'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Users, LayoutDashboard } from 'lucide-react'

const navItems = [
  { href: '/essays',   label: 'Redações',  icon: FileText        },
  { href: '/students', label: 'Alunos',    icon: Users           },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex w-[220px] flex-col flex-shrink-0 h-full"
      style={{
        background: 'var(--littera-paper)',
        borderRight: '1px solid var(--littera-dust)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid var(--littera-dust)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-base flex-shrink-0"
          style={{
            background: 'var(--littera-forest)',
            color: '#fff',
          }}
        >
          L
        </div>
        <span
          className="font-display text-lg font-semibold"
          style={{ color: 'var(--littera-ink)' }}
        >
          Littera
        </span>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--littera-slate)', letterSpacing: '0.1em' }}
        >
          Menu
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
              style={
                active
                  ? {
                      background: 'var(--littera-forest-light)',
                      color: 'var(--littera-forest)',
                    }
                  : {
                      color: 'var(--littera-slate)',
                    }
              }
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: 'var(--littera-forest)' }}
                />
              )}
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ strokeWidth: active ? 2.5 : 1.75 }}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: '1px solid var(--littera-dust)' }}
      >
        <p className="text-xs" style={{ color: 'var(--littera-slate)' }}>
          Littera · v0.1
        </p>
      </div>
    </aside>
  )
}
