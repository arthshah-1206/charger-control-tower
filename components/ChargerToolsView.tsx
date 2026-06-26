'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Maximize2, Minimize2, Monitor } from 'lucide-react'
import type { Charger } from '@/lib/types'
import { OperatorDisplay } from './operator-display/OperatorDisplay'
import { operatorScreenFromCharger } from './operator-display/fromCharger'

const TABS = [{ id: 'operator-display', label: 'Operator Display', icon: Monitor }] as const
type TabId = (typeof TABS)[number]['id']

const HEADER_TINT: Record<string, string> = {
  healthy:    'border-l-emerald-500 bg-emerald-50',
  deration:   'border-l-amber-500   bg-amber-50',
  breakdown:  'border-l-red-500     bg-red-50',
  'grid-down':'border-l-sky-500     bg-sky-50',
}

export default function ChargerToolsView({ charger }: { charger: Charger }) {
  const [tab, setTab] = useState<TabId>('operator-display')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const tabBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      tabBodyRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const screen = operatorScreenFromCharger(charger)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <div className={`shrink-0 border-b border-border border-l-4 ${HEADER_TINT[charger.health] ?? ''}`}>
        <div className="flex items-center gap-3 px-5 h-12">
          <Link
            href={`/charger/${charger.num}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} className="shrink-0" />
            Back to charger
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-semibold">
            Console
            <span className="text-text-secondary font-normal"> · {charger.prefix}{charger.num}</span>
          </span>
          <div className="ml-auto">
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-3">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                  active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-text-secondary hover:text-foreground'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab body */}
      <div ref={tabBodyRef} className="flex-1 overflow-hidden bg-muted/30 flex items-center justify-center p-4">
        {tab === 'operator-display' && <OperatorDisplay screen={screen} />}
      </div>
    </div>
  )
}
