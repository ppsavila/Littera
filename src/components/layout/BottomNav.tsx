'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Users, Plus } from 'lucide-react'

const navItems = [
  { href: '/essays',   label: 'Redações', icon: FileText },
  { href: '/students', label: 'Alunos',   icon: Users    },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-stretch md:hidden z-40"
      style={{
        background: 'rgba(253,250,245,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--littera-dust)',
        boxShadow: '0 -2px 12px rgba(28,25,23,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all"
            style={{
              color: active ? 'var(--littera-forest)' : 'var(--littera-slate)',
              minHeight: 56,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{ strokeWidth: active ? 2.5 : 1.75 }}
            />
            <span className="text-xs font-medium">{label}</span>
            {active && (
              <span
                className="absolute bottom-0 w-8 h-0.5 rounded-full"
                style={{ background: 'var(--littera-forest)' }}
              />
            )}
          </Link>
        )
      })}

      {/* Centre FAB */}
      <Link
        href="/essays/new"
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center -mt-5"
          style={{
            background: 'var(--littera-forest)',
            boxShadow: '0 4px 14px rgba(26,77,58,0.40)',
            border: '2px solid var(--littera-parchment)',
          }}
        >
          <Plus className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--littera-slate)' }}>
          Nova
        </span>
      </Link>
    </nav>
  )
}
