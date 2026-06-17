'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Bell, User, Info, Activity, BarChart2, FileText, Zap } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CHARGER_NOTIFICATIONS } from '@/lib/data'
import type { HealthStatus } from '@/lib/types'

const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy:    'Healthy',
  deration:   'Deration',
  breakdown:  'Breakdown',
  'grid-down': 'On DG',
}

const HEALTH_COLOR: Record<HealthStatus, string> = {
  healthy:    'text-emerald-600',
  deration:   'text-amber-600',
  breakdown:  'text-red-600',
  'grid-down': 'text-sky-600',
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)
  const unread = CHARGER_NOTIFICATIONS.filter(n => !read.has(n.id)).length

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markAllRead = () => setRead(new Set(CHARGER_NOTIFICATIONS.map(n => n.id)))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-lg text-text-secondary hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <Bell size={15} strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-background">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-9 left-0 z-[600] w-72 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold">Alerts</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-text-secondary hover:text-foreground transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {CHARGER_NOTIFICATIONS.map(n => {
              const isRead = read.has(n.id)
              return (
                <div
                  key={n.id}
                  onClick={() => setRead(p => new Set([...p, n.id]))}
                  className={`flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 transition-colors cursor-pointer ${isRead ? 'opacity-50' : ''}`}
                >
                  <div>
                    <div className="text-xs font-semibold text-foreground">{n.chargerId}</div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      <span className={HEALTH_COLOR[n.from]}>{HEALTH_LABEL[n.from]}</span>
                      <span className="mx-1">→</span>
                      <span className={HEALTH_COLOR[n.to]}>{HEALTH_LABEL[n.to]}</span>
                      <span className="ml-1.5">· {n.time}</span>
                    </div>
                  </div>
                  {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'sec-info',    label: 'Charger info',    icon: Info      },
  { id: 'sec-health',  label: 'Charger health',  icon: Activity  },
  { id: 'sec-session', label: 'Charging sessions', icon: Zap       },
  { id: 'sec-perf',    label: 'Performance',     icon: BarChart2 },
  { id: 'sec-svc',     label: 'Service history', icon: FileText  },
]

export default function ChargerDetailSidebar({
  activeSection,
}: {
  activeSection: string
}) {
  return (
    <aside className="w-44 shrink-0 border-r border-border flex flex-col">
      <div className="flex items-center justify-between px-3 border-b border-border" style={{ height: 60 }}>
        <Link href="/"><Image src="/exponent-logo.svg" alt="Exponent" width={80} height={16} className="h-4 w-auto" priority /></Link>
        <NotificationBell />
      </div>

      <div className="py-2 px-2 border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs font-medium text-text-secondary hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <ArrowLeft size={13} className="shrink-0" />
          All chargers
        </Link>
      </div>

      <nav className="flex-1 pt-1 px-2">
        <p className="px-2.5 text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1 mt-2">
          Sections
        </p>
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={[
              'w-full flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              activeSection === id
                ? 'bg-foreground text-white'
                : 'text-text-secondary hover:bg-muted hover:text-foreground',
            ].join(' ')}
          >
            <Icon size={13} className="shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-2 pb-3 border-t border-border pt-2">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-text-secondary hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-foreground text-white flex items-center justify-center shrink-0">
            <User size={12} />
          </div>
          <span className="text-[11px] font-medium truncate">admin</span>
        </button>
      </div>
    </aside>
  )
}
