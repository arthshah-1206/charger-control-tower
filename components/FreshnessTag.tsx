import { Wifi } from 'lucide-react'

function label(mins: number): string {
  if (mins < 1) return '30s ago'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  const r = mins % 60
  return r > 0 ? `${h}h ${r}m ago` : `${h}h ago`
}

function color(mins: number): string {
  if (mins <= 5)  return 'text-emerald-600'
  if (mins <= 15) return 'text-amber-600'
  return 'text-red-600'
}

export default function FreshnessTag({ mins }: { mins: number }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${color(mins)}`}>
      <Wifi size={10} />
      {label(mins)}
    </span>
  )
}
