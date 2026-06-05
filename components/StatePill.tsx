import type { ChargerState } from '@/lib/types'

export default function StatePill({ state }: { state: ChargerState }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-neutral-600 bg-neutral-100">
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-neutral-400" />
      {state === 'charging' ? 'Charging' : 'Idle'}
    </span>
  )
}
