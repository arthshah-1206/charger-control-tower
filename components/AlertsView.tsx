'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CHARGERS } from '@/lib/data'
import type { HealthStatus } from '@/lib/types'
import { ACTIVE_FAULTS } from './ChargerSchematic'
import HealthPill from './HealthPill'

const HEALTH_ORDER: Record<HealthStatus, number> = { breakdown: 0, 'grid-down': 1, deration: 2, healthy: 3 }

const LEFT_BORDER: Record<HealthStatus, string> = {
  breakdown:   'border-l-red-500',
  'grid-down': 'border-l-sky-500',
  deration:    'border-l-amber-500',
  healthy:     'border-l-emerald-500',
}

const MONTHS: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }
function parseReportedAt(str: string): Date {
  const [d, m, y, time] = str.replace(',', '').split(' ')
  const [h, min] = time.split(':')
  return new Date(+y, MONTHS[m], +d, +h, +min)
}
function openForMins(r: string) { return Math.floor((Date.now() - parseReportedAt(r).getTime()) / 60000) }
function openFor(r: string) {
  const mins = openForMins(r)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}
function openForColor(r: string) {
  const mins = openForMins(r)
  if (mins > 480) return 'text-red-600'
  if (mins > 120) return 'text-amber-600'
  return 'text-emerald-600'
}

const opsImpactCls = (impact: string) =>
  impact === 'Breakdown' ? 'bg-red-50 text-red-700 border-red-200'
  : impact === 'Deration' ? 'bg-amber-50 text-amber-700 border-amber-200'
  : 'bg-neutral-100 text-neutral-600 border-neutral-200'

export default function AlertsView() {
  const [activeCorridor, setActiveCorridor] = useState('')
  const [activeSite, setActiveSite]         = useState('')
  const [openChargers, setOpenChargers] = useState<Set<string>>(new Set())

  const allUnhealthy = useMemo(() =>
    CHARGERS.filter(c => c.health !== 'healthy'),
    []
  )

  // Base: unhealthy chargers matching corridor + site
  const base = useMemo(() =>
    allUnhealthy.filter(c => {
      const matchCorridor = !activeCorridor || c.corridor === activeCorridor
      const matchSite     = !activeSite     || c.site === activeSite
      return matchCorridor && matchSite
    }),
    [allUnhealthy, activeCorridor, activeSite]
  )

  const filtered = useMemo(() =>
    [...base].sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]),
    [base]
  )

  const availableCorridors = useMemo(() =>
    [...new Set(allUnhealthy.filter(c => !activeSite || c.site === activeSite).map(c => c.corridor))].sort(),
    [allUnhealthy, activeSite]
  )
  const availableSites = useMemo(() =>
    [...new Set(allUnhealthy.filter(c => !activeCorridor || c.corridor === activeCorridor).map(c => c.site))].sort(),
    [allUnhealthy, activeCorridor]
  )

  const handleCorridorChange = (corridor: string) => {
    setActiveCorridor(corridor)
    if (activeSite) {
      const valid = new Set(allUnhealthy.filter(c => !corridor || c.corridor === corridor).map(c => c.site))
      if (!valid.has(activeSite)) setActiveSite('')
    }
  }
  const handleSiteChange = (site: string) => {
    setActiveSite(site)
    if (activeCorridor) {
      const valid = new Set(allUnhealthy.filter(c => !site || c.site === site).map(c => c.corridor))
      if (!valid.has(activeCorridor)) setActiveCorridor('')
    }
  }

  const toggleCharger = (num: string) => {
    setOpenChargers(prev => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num); else next.add(num)
      return next
    })
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/30">
      <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Page header with filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
            {filtered.length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                {filtered.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Dropdown value={activeCorridor} onChange={handleCorridorChange} placeholder="All corridors" options={availableCorridors} />
            <Dropdown value={activeSite}     onChange={handleSiteChange}     placeholder="All sites"     options={availableSites}     />
          </div>
        </div>

        {/* Charger list */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : filtered.map(c => {
                  const chargerId = c.prefix + c.num
                  const faults = ACTIVE_FAULTS[c.num] ?? []
                  const isOpen = openChargers.has(c.num)
                  return (
                    <div key={chargerId} className={`rounded-lg border border-border border-l-4 ${LEFT_BORDER[c.health]} overflow-hidden bg-background`}>
                      <div
                        onClick={() => toggleCharger(c.num)}
                        className="flex items-center gap-2.5 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        {isOpen
                          ? <ChevronDown size={13} className="text-text-secondary shrink-0" />
                          : <ChevronRight size={13} className="text-text-secondary shrink-0" />}
                        <Link
                          href={`/charger/${c.num}`}
                          onClick={e => e.stopPropagation()}
                          className="text-sm font-bold text-foreground hover:text-blue-600 transition-colors"
                        >
                          {chargerId}
                        </Link>
                        <span className="text-[11px] text-text-secondary">{c.site} · {c.corridor}</span>
                        <HealthPill status={c.health} derationPct={c.derationPct} />
                        <span className="w-px h-3.5 bg-border shrink-0" />
                        <span className="text-[11px] text-text-secondary">
                          {faults.length} {faults.length === 1 ? 'error' : 'errors'}
                        </span>
                      </div>

                      {isOpen && (
                        faults.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-text-secondary border-t border-border">
                            No active error codes
                          </div>
                        ) : (
                          <table className="w-full text-xs border-t border-border table-fixed">
                            <colgroup>
                              <col className="w-[180px]" />
                              <col className="w-[90px]" />
                              <col />
                              <col className="w-[180px]" />
                              <col className="w-[110px]" />
                              <col className="w-[150px]" />
                            </colgroup>
                            <thead>
                              <tr className="bg-muted/20">
                                <Th>Reported</Th>
                                <Th>DTC</Th>
                                <Th>Fault Name</Th>
                                <Th>Subsystem</Th>
                                <Th>Ops Impact</Th>
                                <Th>Service Ticket</Th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {faults.map((f, i) => (
                                <tr key={i} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-3.5 py-2.5 whitespace-nowrap text-foreground">
                                    {f.reportedAt}
                                    <span className="text-text-secondary mx-1">·</span>
                                    <span className={`font-medium ${openForColor(f.reportedAt)}`}>{openFor(f.reportedAt)}</span>
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono text-foreground">{f.dtc}</td>
                                  <td className="px-3.5 py-2.5 text-foreground">{f.name}</td>
                                  <td className="px-3.5 py-2.5 text-foreground">{f.subsystem}</td>
                                  <td className="px-3.5 py-2.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${opsImpactCls(f.opsImpact)}`}>
                                      {f.opsImpact}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                                      {f.ticketId} →
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      )}
                    </div>
                  )
          })}
        </div>

      </div>
    </div>
  )
}

function Dropdown({ value, onChange, placeholder, options }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center rounded-lg border border-border bg-background">
      <CheckCircle2 size={28} className="text-emerald-500 mb-2.5" />
      <p className="text-sm font-semibold">No results</p>
      <p className="text-xs text-text-secondary mt-1">No chargers match your filters</p>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="text-left px-3.5 py-2 font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
      {children}
    </th>
  )
}
