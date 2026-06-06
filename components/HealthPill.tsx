import type { HealthStatus } from '@/lib/types'

const CONFIG: Record<HealthStatus, { label: string; className: string; dot: string }> = {
  healthy:    { label: 'Healthy',   className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  deration:   { label: 'Deration',  className: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400'   },
  breakdown:  { label: 'Breakdown', className: 'bg-red-50 text-red-700',         dot: 'bg-red-500'     },
  'grid-down': { label: 'On DG',   className: 'bg-sky-50 text-sky-700',         dot: 'bg-sky-500'     },
}

export default function HealthPill({ status, derationPct }: { status: HealthStatus; derationPct?: number }) {
  const c = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
      {status === 'deration' && derationPct != null && (
        <>
          <span className="opacity-40">·</span>
          <span>{derationPct}%</span>
        </>
      )}
    </span>
  )
}
