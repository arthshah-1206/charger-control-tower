'use client'

import { Search, ChevronDown } from 'lucide-react'
import type { HealthStatus } from '@/lib/types'

export type HealthFilter = 'all' | HealthStatus

const PILLS: { value: HealthFilter; label: string }[] = [
  { value: 'all',        label: 'All'       },
  { value: 'healthy',    label: 'Healthy'   },
  { value: 'deration',   label: 'Deration'  },
  { value: 'breakdown',  label: 'Breakdown' },
  { value: 'grid-down',  label: 'On DG'     },
]

interface TopNavProps {
  searchQuery: string
  onSearchChange: (v: string) => void
  activeFilter: HealthFilter
  onFilterChange: (f: HealthFilter) => void
  activeCorridor: string
  onCorridorChange: (c: string) => void
  corridors: string[]
  activeSite: string
  onSiteChange: (s: string) => void
  sites: string[]
  counts: Record<HealthFilter, number>
}

export default function TopNav({
  searchQuery, onSearchChange,
  activeFilter, onFilterChange,
  activeCorridor, onCorridorChange, corridors,
  activeSite, onSiteChange,
  sites,
  counts,
}: TopNavProps) {
  return (
    <div className="shrink-0 h-12 flex items-center px-6 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-border rounded-lg bg-background hover:border-foreground/20 transition-colors w-56">
          <Search size={13} className="ml-3 text-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search ID, site, corridor…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="flex-1 h-8 px-2.5 bg-transparent text-xs placeholder:text-text-secondary focus:outline-none"
          />
        </div>

        <div className="w-px h-6 bg-border shrink-0" />

        <div className="flex items-center rounded-lg border border-border overflow-hidden shrink-0">
          {PILLS.map(p => {
            const active = activeFilter === p.value
            return (
              <button
                key={p.value}
                onClick={() => onFilterChange(p.value)}
                className={[
                  'h-8 px-3 text-xs font-medium border-r border-border last:border-r-0 flex items-center gap-1.5 transition-colors cursor-pointer',
                  active
                    ? 'bg-foreground text-white'
                    : 'bg-background text-text-secondary hover:text-foreground hover:bg-muted',
                ].join(' ')}
              >
                {p.label}
                <span className={`text-[11px] font-semibold tabular-nums ${active ? 'opacity-80' : 'opacity-60'}`}>
                  {counts[p.value]}
                </span>
              </button>
            )
          })}
        </div>

        <Dropdown
          value={activeCorridor}
          onChange={onCorridorChange}
          placeholder="All corridors"
          options={corridors}
        />

        <Dropdown
          value={activeSite}
          onChange={onSiteChange}
          placeholder="All sites"
          options={sites}
        />
      </div>
    </div>
  )
}

function Dropdown({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: readonly string[]
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 pl-3 pr-7 border border-border rounded-lg text-xs text-text-secondary bg-background appearance-none cursor-pointer focus:outline-none focus:border-neutral-300"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  )
}
