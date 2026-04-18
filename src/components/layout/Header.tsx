'use client'

import { ROLE_LABELS } from '@/lib/utils'
import type { Role } from '@prisma/client'

interface HeaderProps {
  title: string
  subtitle?: string
  userName?: string | null
  userRole: Role
}

export default function Header({ title, subtitle, userName, userRole }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-graphite-900/50 backdrop-blur-sm">
      <div>
        <h1 className="text-white font-semibold text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-white/80 text-sm font-medium">{userName || 'User'}</p>
          <p className="text-white/30 text-xs font-mono">{ROLE_LABELS[userRole]}</p>
        </div>
        <div className="w-8 h-8 gradient-core-flow rounded-full flex items-center justify-center text-white font-bold text-sm">
          {(userName?.[0] || 'U').toUpperCase()}
        </div>
      </div>
    </header>
  )
}
