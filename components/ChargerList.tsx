import Link from 'next/link'
import type { Charger } from '@/lib/types'
import HealthPill from './HealthPill'
import StatePill from './StatePill'
import FreshnessTag from './FreshnessTag'

export default function ChargerList({ chargers }: { chargers: Charger[] }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-7 py-6">
      <div className="border border-border rounded-xl overflow-hidden">
        {chargers.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-secondary">
            No chargers match your filters
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[220px_160px_140px_1fr] items-center gap-4 px-5 h-9 bg-muted/40 border-b border-border text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              <div>Charger</div>
              <div>Charger health</div>
              <div>Charger state</div>
              <div>Data freshness</div>
            </div>
            {chargers.map(c => (
              <Link
                key={c.prefix + c.num}
                href={`/charger/${c.num}`}
                className="grid grid-cols-[220px_160px_140px_1fr] items-center gap-4 px-5 h-14 bg-background border-b border-border last:border-b-0 hover:bg-neutral-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm tracking-wide truncate">
                    <span className="font-medium text-text-secondary">{c.prefix}</span>
                    <strong className="font-bold">{c.num}</strong>
                  </div>
                  <div className="text-[11px] text-text-secondary truncate">{c.site} · {c.corridor}</div>
                </div>
                <div className="flex items-center"><HealthPill status={c.health} derationPct={c.derationPct} /></div>
                <div className="flex items-center"><StatePill state={c.state} /></div>
                <div className="flex items-center"><FreshnessTag mins={c.freshMins} /></div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
