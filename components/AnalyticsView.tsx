'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Check, ExternalLink } from 'lucide-react'
import { CHARGERS, CHARGER_SESSIONS, CHARGER_AVAILABILITY, PACK_BUS_MAP, bytebeamSessionUrl } from '@/lib/data'
import type { SessionRecord } from '@/lib/types'

type Period = 'today' | 'week' | 'month' | 'custom'

const MONTHS: Record<string, number> = {
  Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
  Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11,
}

function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\s+(\w+),\s+(\d+):(\d+)/)
  if (!m) return null
  const mo = MONTHS[m[2]]
  if (mo === undefined) return null
  return new Date(2026, mo, +m[1], +m[3], +m[4])
}

function fromInput(s: string): Date | null {
  if (!s) return null
  const [y, mo, d] = s.split('-').map(Number)
  return new Date(y, mo - 1, d)
}

function inRange(d: Date, period: Period, customFrom: string, customTo: string): boolean {
  if (period === 'today') return d.getFullYear() === 2026 && d.getMonth() === 5 && d.getDate() === 25
  if (period === 'week')  return d >= new Date(2026, 5, 23) && d <= new Date(2026, 5, 25, 23, 59)
  if (period === 'month') return d >= new Date(2026, 5, 1)  && d <= new Date(2026, 5, 25, 23, 59)
  const f = fromInput(customFrom), t = fromInput(customTo)
  if (!f || !t) return false
  return d >= f && d <= new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59)
}

function periodMins(period: Period, customFrom: string, customTo: string): number {
  if (period === 'today')  return 24 * 60
  if (period === 'week')   return 3 * 24 * 60
  if (period === 'month')  return 25 * 24 * 60
  const f = fromInput(customFrom), t = fromInput(customTo)
  if (!f || !t) return 24 * 60
  const days = Math.max(1, Math.round((t.getTime() - f.getTime()) / 86400000) + 1)
  return days * 24 * 60
}

function eff(s: SessionRecord): number | null {
  return s.energyConsumedKwh > 0 ? Math.round((s.energySoldKwh / s.energyConsumedKwh) * 100) : null
}

function fmtDur(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60), m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// RAG: charging time ≤25m green, ≤35m amber, >35m red
function ragTime(mins: number | null): string {
  if (mins === null) return ''
  if (mins <= 25) return 'text-emerald-600'
  if (mins <= 35) return 'text-amber-600'
  return 'text-red-600'
}
// RAG: efficiency ≥85% green, ≥75% amber, <75% red
function ragEff(pct: number | null): string {
  if (pct === null) return ''
  if (pct >= 85) return 'text-emerald-600'
  if (pct >= 75) return 'text-amber-600'
  return 'text-red-600'
}
// RAG: generic percentage with configurable thresholds (higher = better)
function ragPct(pct: number | null, hi: number, lo: number): string {
  if (pct === null) return ''
  if (pct >= hi) return 'text-emerald-600'
  if (pct >= lo) return 'text-amber-600'
  return 'text-red-600'
}

const PRESET_LABELS: Record<Exclude<Period, 'custom'>, string> = {
  today: 'Today · 25 Jun 2026',
  week:  '23 Jun – 25 Jun 2026',
  month: '1 Jun – 25 Jun 2026',
}

const PRESETS: { p: Period; label: string }[] = [
  { p: 'today', label: 'Today'      },
  { p: 'week',  label: 'This week'  },
  { p: 'month', label: 'This month' },
  { p: 'custom', label: 'Custom'    },
]

// ── Multi-select dropdown ─────────────────────────────────────────────────────

function MultiSelectDropdown({ items, selected, onChange, allLabel, renderItem }: {
  items: string[]
  selected: string[]
  onChange: (v: string[]) => void
  allLabel: string
  renderItem: (item: string) => string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const word = allLabel.split(' ').slice(1).join(' ')
  const isAll = selected.length === 0
  const label = isAll ? allLabel
    : selected.length === 1 ? renderItem(selected[0])
    : `${selected.length} ${word}`

  const toggle = (n: string) =>
    onChange(selected.includes(n) ? selected.filter(x => x !== n) : [...selected, n])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
      >
        {label}
        <ChevronDown size={12} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 min-w-[160px] bg-background border border-border rounded-lg shadow-lg py-1">
          <button
            onClick={() => { onChange([]); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors cursor-pointer"
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isAll ? 'bg-foreground border-foreground' : 'border-border'}`}>
              {isAll && <Check size={10} className="text-background" />}
            </span>
            {allLabel}
          </button>
          <div className="my-1 h-px bg-border" />
          {items.map(n => {
            const checked = selected.includes(n)
            return (
              <button key={n} onClick={() => toggle(n)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors cursor-pointer"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-foreground border-foreground' : 'border-border'}`}>
                  {checked && <Check size={10} className="text-background" />}
                </span>
                {renderItem(n)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsView() {
  const [period, setPeriod] = useState<Period>('today')
  const [customFrom, setCustomFrom] = useState('2026-06-01')
  const [customTo, setCustomTo]     = useState('2026-06-25')
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [selectedNums, setSelectedNums] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const sites = useMemo(() => [...new Set(CHARGERS.map(c => c.site))].sort(), [])

  const siteFiltered = useMemo(() =>
    selectedSites.length === 0 ? CHARGERS : CHARGERS.filter(c => selectedSites.includes(c.site)),
    [selectedSites]
  )

  const availableNums = useMemo(() => siteFiltered.map(c => c.num), [siteFiltered])

  const handleSiteChange = (newSites: string[]) => {
    setSelectedSites(newSites)
    const validNums = new Set(
      CHARGERS.filter(c => newSites.length === 0 || newSites.includes(c.site)).map(c => c.num)
    )
    setSelectedNums(prev => prev.filter(n => validNums.has(n)))
  }

  const visible = useMemo(() => {
    const base = siteFiltered
    return selectedNums.length === 0 ? base : base.filter(c => selectedNums.includes(c.num))
  }, [siteFiltered, selectedNums])

  const pMins = useMemo(() => periodMins(period, customFrom, customTo), [period, customFrom, customTo])

  const rows = useMemo(() => visible.map(charger => {
    const sessions = (CHARGER_SESSIONS[charger.num] ?? []).filter(s => {
      const d = parseDate(s.date)
      return d !== null && inRange(d, period, customFrom, customTo)
    })
    const n = sessions.length
    const totalEnergy = sessions.reduce((a, s) => a + s.energySoldKwh, 0)
    const avgMins = n > 0 ? Math.round(sessions.reduce((a, s) => a + s.durationMins, 0) / n) : null
    const effs = sessions.map(eff).filter((e): e is number => e !== null)
    const effVal = effs.length > 0 ? Math.round(effs.reduce((a, b) => a + b) / effs.length) : null
    const successN = sessions.filter(s => s.status === 'success').length
    const successRate = n > 0 ? Math.round((successN / n) * 100) : null
    const totalChargingMins = sessions.reduce((a, s) => a + s.durationMins, 0)
    const utilizationPct = Math.round(Math.min((totalChargingMins / pMins) * 100, 100))
    const avail = CHARGER_AVAILABILITY[charger.num]
    return {
      charger, sessions, totalEnergy, avgMins, effVal, successRate, utilizationPct,
      chargerUptimePct: avail?.chargerUptimePct ?? null,
      dataUptimePct:    avail?.dataUptimePct    ?? null,
      powerAvailPct:    avail?.powerAvailPct    ?? null,
    }
  }), [visible, period, customFrom, customTo, pMins])

  const agg = useMemo(() => {
    const all = rows.flatMap(r => r.sessions)
    const n = all.length
    const effs = all.map(eff).filter((e): e is number => e !== null)
    const successN = all.filter(s => s.status === 'success').length
    const withAvail = rows.filter(r => r.chargerUptimePct !== null)
    const avgOf = (key: 'chargerUptimePct' | 'dataUptimePct' | 'powerAvailPct' | 'utilizationPct') =>
      rows.length > 0 ? Math.round(rows.reduce((a, r) => a + (r[key] ?? 0), 0) / rows.length) : null
    return {
      sessions:         n,
      successRate:      n > 0 ? Math.round((successN / n) * 100) : null,
      avgMins:          n > 0 ? Math.round(all.reduce((a, s) => a + s.durationMins, 0) / n) : null,
      energy:           all.reduce((a, s) => a + s.energySoldKwh, 0),
      effVal:           effs.length > 0 ? Math.round(effs.reduce((a, b) => a + b) / effs.length) : null,
      chargerUptimePct: withAvail.length > 0 ? avgOf('chargerUptimePct') : null,
      dataUptimePct:    withAvail.length > 0 ? avgOf('dataUptimePct')    : null,
      powerAvailPct:    withAvail.length > 0 ? avgOf('powerAvailPct')    : null,
      utilizationPct:   avgOf('utilizationPct'),
    }
  }, [rows])

  const toggle = (num: string) =>
    setExpanded(prev => { const s = new Set(prev); if (s.has(num)) s.delete(num); else s.add(num); return s })

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/30">
      <div className="max-w-[1100px] mx-auto px-6 py-6 flex flex-col gap-5">

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-0.5 bg-background border border-border rounded-lg p-1">
            {PRESETS.map(({ p, label }) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`h-7 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  period === p ? 'bg-foreground text-background' : 'text-text-secondary hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {period === 'custom' ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer"
              />
              <span className="text-xs text-text-secondary">→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomTo(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer"
              />
            </div>
          ) : (
            <span className="text-xs text-text-secondary">{PRESET_LABELS[period]}</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <MultiSelectDropdown
              items={sites}
              selected={selectedSites}
              onChange={handleSiteChange}
              allLabel="All sites"
              renderItem={s => s}
            />
            <MultiSelectDropdown
              items={availableNums}
              selected={selectedNums}
              onChange={setSelectedNums}
              allLabel="All chargers"
              renderItem={n => `EXP-C-${n}`}
            />
          </div>
        </div>

        {/* Aggregate metrics card — two rows */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {/* Row 1: session performance — Sessions + success combined, then time / energy / efficiency */}
          <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
            {/* Sessions cell — success rate as sub-line */}
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Sessions</p>
              <p className="text-2xl font-bold tabular-nums leading-none text-foreground">{agg.sessions}</p>
              {agg.successRate != null && (
                <p className={`text-xs font-medium mt-1 ${ragPct(agg.successRate, 90, 75)}`}>
                  {agg.successRate}% success
                </p>
              )}
            </div>
            {[
              { label: 'Avg charging time', value: agg.avgMins != null ? fmtDur(agg.avgMins) : '—', unit: '',    color: ragTime(agg.avgMins) },
              { label: 'Energy sold',       value: String(agg.energy),                               unit: 'kWh', color: ''                  },
              { label: 'Avg efficiency',    value: agg.effVal != null ? `${agg.effVal}` : '—',       unit: agg.effVal != null ? '%' : '',  color: ragEff(agg.effVal) },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{label}</p>
                <p className={`text-2xl font-bold tabular-nums leading-none ${color || 'text-foreground'}`}>
                  {value}<span className="text-sm font-normal text-text-secondary ml-1">{unit}</span>
                </p>
              </div>
            ))}
          </div>
          {/* Row 2: operational metrics */}
          <div className="grid grid-cols-4 divide-x divide-border bg-muted/20">
            {[
              { label: 'Charger uptime',     value: agg.chargerUptimePct != null ? `${agg.chargerUptimePct}` : '—', unit: agg.chargerUptimePct != null ? '%' : '', color: ragPct(agg.chargerUptimePct, 95, 85) },
              { label: 'Data uptime',        value: agg.dataUptimePct    != null ? `${agg.dataUptimePct}`    : '—', unit: agg.dataUptimePct    != null ? '%' : '', color: ragPct(agg.dataUptimePct,    95, 85) },
              { label: 'Power availability', value: agg.powerAvailPct    != null ? `${agg.powerAvailPct}`    : '—', unit: agg.powerAvailPct    != null ? '%' : '', color: ragPct(agg.powerAvailPct,    95, 85) },
              { label: 'Utilization',        value: agg.utilizationPct   != null ? `${agg.utilizationPct}`   : '—', unit: agg.utilizationPct   != null ? '%' : '', color: ''                                   },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="px-6 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">{label}</p>
                <p className={`text-xl font-bold tabular-nums leading-none ${color || 'text-foreground'}`}>
                  {value}<span className="text-sm font-normal text-text-secondary ml-1">{unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Per-charger rows */}
        <div className="flex flex-col gap-4">
          {rows.map(({ charger, sessions, totalEnergy, avgMins, effVal, successRate, chargerUptimePct }) => {
            const isOpen = expanded.has(charger.num)
            const has = sessions.length > 0
            return (
              <div key={charger.num} className="bg-background border border-neutral-200 rounded-xl overflow-hidden shadow-sm">

                <button
                  onClick={() => has && toggle(charger.num)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors bg-neutral-100 ${has ? 'hover:bg-neutral-200 cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="w-[13px] shrink-0 text-text-secondary">
                    {has && (isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight">{charger.prefix}{charger.num}</span>
                    <span className="text-xs text-text-secondary mt-0.5">{charger.site}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Sessions</p>
                      <p className="text-sm font-bold tabular-nums">{sessions.length}</p>
                      {successRate != null && (
                        <p className={`text-[10px] font-medium ${ragPct(successRate, 90, 75)}`}>{successRate}% success</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Uptime</p>
                      <p className={`text-sm font-bold tabular-nums ${ragPct(chargerUptimePct, 95, 85)}`}>{chargerUptimePct != null ? `${chargerUptimePct}%` : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Avg time</p>
                      <p className={`text-sm font-bold tabular-nums ${ragTime(avgMins)}`}>{avgMins != null ? fmtDur(avgMins) : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Energy</p>
                      <p className="text-sm font-bold tabular-nums">{totalEnergy > 0 ? `${totalEnergy} kWh` : '—'}</p>
                    </div>
                    <div className="text-right w-20">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Efficiency</p>
                      <p className={`text-sm font-bold tabular-nums ${ragEff(effVal)}`}>{effVal != null ? `${effVal}%` : '—'}</p>
                    </div>
                  </div>
                </button>

                {has && isOpen && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          {['Time', 'Bus', 'SOC', 'Charging time', 'Energy sold', 'Efficiency'].map(h => (
                            <th key={h} className="text-left text-[9px] font-bold uppercase tracking-wider text-text-secondary px-4 py-2 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s, i) => {
                          const e = eff(s)
                          return (
                            <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                                <a href={bytebeamSessionUrl(s.sessionId)} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-text-secondary hover:text-blue-600 transition-colors">
                                  {s.date}
                                  <ExternalLink size={11} className="shrink-0 opacity-40 group-hover:opacity-100" />
                                </a>
                              </td>
                              <td className="px-4 py-2.5 text-xs">{PACK_BUS_MAP[s.packId] ?? s.packId}</td>
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap">{s.startSoc}% → {s.endSoc}%</td>
                              <td className={`px-4 py-2.5 text-xs whitespace-nowrap font-medium ${ragTime(s.durationMins)}`}>{fmtDur(s.durationMins)}</td>
                              <td className="px-4 py-2.5 text-xs">{s.energySoldKwh} kWh</td>
                              <td className={`px-4 py-2.5 text-xs font-medium ${ragEff(e)}`}>{e != null ? `${e}%` : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!has && (
                  <div className="border-t border-border px-[52px] py-2.5 text-xs text-text-secondary">
                    No sessions in this period
                  </div>
                )}

              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
