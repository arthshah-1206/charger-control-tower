'use client'

import { useRouter } from 'next/navigation'
import type { Charger } from '@/lib/types'
import HealthPill from './HealthPill'
import StatePill from './StatePill'
import FreshnessTag from './FreshnessTag'

export default function ChargerCard({
  charger: c,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  charger: Charger
  isHovered?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(`/charger/${c.num}`)}
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-150 ${
        isHovered
          ? 'border-foreground bg-foreground/[0.03] shadow-sm'
          : 'border-border hover:border-foreground/20 hover:bg-neutral-50 hover:shadow-sm'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm tracking-wide leading-tight">
            <span className="font-medium text-text-secondary">{c.prefix}</span><strong className="font-bold">{c.num}</strong>
          </div>
          <div className="text-xs text-text-secondary mt-0.5">{c.site} · {c.corridor}</div>
        </div>
        <HealthPill status={c.health} derationPct={c.derationPct} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <StatePill state={c.state} />
        <FreshnessTag mins={c.freshMins} />
      </div>
    </div>
  )
}
