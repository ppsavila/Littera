'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Users, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/essays',   label: 'Redações',  icon: FileText },
  { href: '/students', label: 'Alunos',    icon: Users    },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 h-full transition-all duration-200"
      style={{
        width: collapsed ? 48 : 220,
        background: 'var(--littera-paper)',
        borderRight: '1px solid var(--littera-dust)',
        overflow: 'hidden',
      }}
    >
      {/* Logo / toggle row */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--littera-dust)',
          height: 52,
          padding: collapsed ? '0 8px' : '0 12px 0 20px',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-base flex-shrink-0"
              style={{ background: 'var(--littera-forest)', color: '#fff' }}
            >
              L
            </div>
            <span
              className="font-display text-lg font-semibold whitespace-nowrap"
              style={{ color: 'var(--littera-ink)' }}
            >
              Litterando
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'var(--littera-slate)' }}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 pt-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="flex items-center rounded-lg text-sm font-medium transition-all relative group"
              style={{
                gap: collapsed ? 0 : 12,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                ...(active
                  ? { background: 'var(--littera-forest-light)', color: 'var(--littera-forest)' }
                  : { color: 'var(--littera-slate)' }),
              }}
            >
              {active && !collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: 'var(--littera-forest)' }}
                />
              )}
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ strokeWidth: active ? 2.5 : 1.75 }}
              />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA */}
      <div
        className="px-1.5 pb-2 flex-shrink-0"
        style={{ borderTop: '1px solid var(--littera-dust)', paddingTop: 8 }}
      >
        <Link
          href="/pricing"
          title={collapsed ? 'Ver planos' : undefined}
          className="flex items-center rounded-lg text-sm font-medium transition-all"
          style={{
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--littera-forest)',
            background: 'var(--littera-forest-faint)',
          }}
        >
          <Zap className="w-4 h-4 flex-shrink-0" style={{ strokeWidth: 2 }} />
          {!collapsed && 'Ver planos'}
        </Link>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--littera-dust)' }}
        >
          <p className="text-xs" style={{ color: 'var(--littera-slate)' }}>
            Litterando · v0.1
          </p>
        </div>
      )}
    </aside>
  )
}
