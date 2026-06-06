'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Charger } from '@/lib/types'
import { CHARGER_NOTIFICATIONS, CHARGER_DETAIL_DATA } from '@/lib/data'
import ChargerDetailSidebar from './ChargerDetailSidebar'
import ChargerSchematic from './ChargerSchematic'
import HealthPill from './HealthPill'
import StatePill from './StatePill'
import FreshnessTag from './FreshnessTag'

// ─── TimeScrubber (ported from H1Dash) ────────────────────────────────────────

const WINDOW_HOURS = 24
const TICKS = [0, 0.25, 0.5, 0.75, 1] as const
function tickLabel(frac: number) {
  if (frac === 1) return 'Now'
  return `−${Math.round((1 - frac) * WINDOW_HOURS)}h`
}

function TimeScrubber({ chargerNum }: { chargerNum: string }) {
  const [pos, setPos] = useState(1)
  const trackRef = useRef<HTMLDivElement>(null)
  const isLive = pos > 0.995

  const notifications = CHARGER_NOTIFICATIONS.filter(n => n.chargerId.endsWith(`-${chargerNum}`))
  const markers = notifications.map((n, i) => ({
    frac: 0.28 + i * 0.23,
    color: n.to === 'breakdown' ? 'bg-red-500' : 'bg-amber-400',
  }))

  const computePos = useCallback((clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    setPos(Math.max(0, Math.min(1, (clientX - left) / width)))
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    computePos(e.clientX)
    const move = (ev: MouseEvent) => computePos(ev.clientX)
    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <div className="shrink-0 flex items-center gap-5 px-6 border-b border-border bg-background select-none" style={{ height: 52 }}>
      <div className="w-32 shrink-0 flex items-center gap-2">
        {isLive ? (
          <>
            <span className="relative flex w-2 h-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 tracking-wider">LIVE</span>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-foreground">Historical</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div
          ref={trackRef}
          className="relative h-1.5 rounded-full cursor-pointer bg-border"
          onMouseDown={onMouseDown}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-foreground/25 pointer-events-none"
            style={{ width: `${pos * 100}%` }}
          />
          {markers.map((m, i) => (
            <span
              key={i}
              className={`absolute top-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${m.color}`}
              style={{ left: `${m.frac * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}
          <div
            className="absolute top-1/2 w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-md cursor-grab active:cursor-grabbing z-10 transition-shadow hover:shadow-lg"
            style={{ left: `${pos * 100}%`, transform: 'translate(-50%, -50%)' }}
            onMouseDown={onMouseDown}
          />
        </div>
        <div className="relative h-3 pointer-events-none">
          {TICKS.map(frac => (
            <span
              key={frac}
              className="absolute text-[9px] text-text-secondary"
              style={{
                left: `${frac * 100}%`,
                transform: frac === 0 ? 'none' : frac === 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {tickLabel(frac)}
            </span>
          ))}
        </div>
      </div>

      <div className="w-24 shrink-0 flex justify-end">
        {!isLive ? (
          <button
            onClick={() => setPos(1)}
            className="text-[10px] font-semibold text-text-secondary hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors hover:bg-muted"
          >
            Jump to live
          </button>
        ) : (
          <span className="text-[10px] text-text-secondary">Last 24h</span>
        )}
      </div>
    </div>
  )
}

// ─── Performance ──────────────────────────────────────────────────────────────

function getBarLabel(idx: number, n: number): string {
  const now = new Date()
  if (n === 12) {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - idx), 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - idx))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function perfColor(val: number, isGreen?: (v: number) => boolean): string | undefined {
  if (!isGreen) return undefined
  return isGreen(val) ? '#1a7a40' : '#b91c1c'
}

function MiniBarChart({ seed, n, lo, hi, target, targets, grouped, integer, unit, d2Lo, d2Hi, d2Unit, groupLabels }: {
  seed: number; n: number; lo: number; hi: number; target?: number; targets?: { value: number; color: string }[]; grouped?: true; integer?: true; unit?: string
  d2Lo?: number; d2Hi?: number; d2Unit?: string; groupLabels?: [string, string]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hovRef    = useRef<number | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const mk  = (s: number) => Array.from({ length: n }, (_, i) => {
    const v = lo + Math.abs(Math.sin(s * 127.1 + i * 311.7)) * (hi - lo)
    return integer ? Math.round(v) : v
  })
  // separate generator for d2 when it has its own value range
  const mk2 = (d2Lo != null && d2Hi != null)
    ? (s: number) => Array.from({ length: n }, (_, i) =>
        d2Lo + Math.abs(Math.sin(s * 127.1 + i * 311.7)) * (d2Hi - d2Lo)
      )
    : mk

  function paint(hov: number | null) {
    const el = canvasRef.current
    if (!el || el.offsetWidth === 0) return
    const dpr = window.devicePixelRatio || 1
    const W = el.offsetWidth, H = 44
    el.width = Math.round(W * dpr); el.height = Math.round(H * dpr)
    el.style.width = W + 'px'; el.style.height = H + 'px'
    const ctx = el.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    const d1 = mk(seed), d2 = grouped ? mk2(seed + 50) : []
    // normalize each series independently so neither dwarfs the other
    const mx1 = Math.max(...d1, target ?? 0, ...(targets?.map(t => t.value) ?? [])) * 1.15 || 1
    const mx2 = d2.length > 0 ? Math.max(...d2) * 1.15 || 1 : mx1
    let barEnd = W
    if (grouped) {
      const gGap = 3, bGap = 1
      const gW = Math.floor((W - gGap * (n - 1)) / n)
      const bw = Math.floor((gW - bGap) / 2)
      barEnd = (n - 1) * (gW + gGap) + gW
      d1.forEach((v, i) => {
        const x = i * (gW + gGap)
        const h1 = Math.max(1, Math.round((v / mx1) * (H - 2)))
        ctx.fillStyle = i === hov ? '#7ba3bd' : '#c5d5e8'
        ctx.fillRect(x, H - h1, bw, h1)
        const h2 = Math.max(1, Math.round((d2[i] / mx2) * (H - 2)))
        ctx.fillStyle = i === hov ? '#6890a8' : '#a8bdd4'
        ctx.fillRect(x + bw + bGap, H - h2, bw, h2)
      })
    } else {
      const gap = 2, bw = Math.floor((W - gap * (n - 1)) / n)
      barEnd = (n - 1) * (bw + gap) + bw
      d1.forEach((v, i) => {
        const bh = Math.max(1, Math.round((v / mx1) * (H - 2)))
        ctx.fillStyle = i === hov ? '#7ba3bd' : '#c5d5e8'
        ctx.fillRect(i * (bw + gap), H - bh, bw, bh)
      })
    }
    const lines = [
      ...(target !== undefined ? [{ value: target, color: '#e8a020' }] : []),
      ...(targets ?? []),
    ]
    if (lines.length > 0) {
      ctx.save()
      ctx.beginPath(); ctx.rect(0, 0, barEnd, H); ctx.clip()
      ctx.setLineDash([4, 3]); ctx.lineWidth = 1
      for (const line of lines) {
        const ty = Math.round(H - (line.value / mx1) * (H - 2)) + 0.5
        ctx.strokeStyle = line.color
        ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(barEnd, ty); ctx.stroke()
      }
      ctx.restore()
    }
  }

  useEffect(() => {
    const t = setTimeout(() => paint(null), 50)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const el = canvasRef.current
    if (!el) return
    const W = el.offsetWidth
    const x = e.clientX - el.getBoundingClientRect().left
    const d1 = mk(seed), d2 = grouped ? mk2(seed + 50) : []
    let idx: number
    if (grouped) {
      const gGap = 3, gW = Math.floor((W - gGap * (n - 1)) / n)
      idx = Math.max(0, Math.min(n - 1, Math.floor(x / (gW + gGap))))
    } else {
      const gap = 2, bw = Math.floor((W - gap * (n - 1)) / n)
      idx = Math.max(0, Math.min(n - 1, Math.floor(x / (bw + gap))))
    }
    if (idx !== hovRef.current) { hovRef.current = idx; paint(idx) }
    const v = d1[idx], v2 = grouped ? d2[idx] : undefined
    const fmt = (val: number) => integer ? String(Math.round(val)) : val < 10 ? val.toFixed(1) : String(Math.round(val))
    const u = unit ? ` ${unit}` : ''
    const label = getBarLabel(idx, n)
    setTip({
      x: e.clientX, y: e.clientY,
      text: v2 !== undefined
        ? groupLabels
          ? `${label} · ${groupLabels[0]}: ${fmt(v)}${u} · ${groupLabels[1]}: ${v2.toFixed(1)}${d2Unit ? ' ' + d2Unit : ''}`
          : `${label} · Crit: ${v.toFixed(1)}h · Non-crit: ${v2.toFixed(1)}h`
        : `${label}: ${fmt(v)}${u}`,
    })
  }

  function handleLeave() {
    if (hovRef.current !== null) { hovRef.current = null; paint(null) }
    setTip(null)
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full block" style={{ height: 44 }}
        onMouseMove={handleMove} onMouseLeave={handleLeave} />
      {grouped && groupLabels && (
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className="inline-block w-2.5 h-1.5 rounded-sm bg-[#c5d5e8]" />
            {groupLabels[0]}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className="inline-block w-2.5 h-1.5 rounded-sm bg-[#a8bdd4]" />
            {groupLabels[1]}
          </span>
        </div>
      )}
      {tip && (
        <div className="fixed pointer-events-none z-[9999] bg-foreground text-background text-[11px] font-medium px-2 py-1 rounded shadow whitespace-nowrap"
          style={{ left: tip.x + 12, top: tip.y - 32 }}>
          {tip.text}
        </div>
      )}
    </div>
  )
}

function PerfCard({ title, sub, chartSub, value, unit, chartUnit, isGreen, dual, thresh, seed, n, lo, hi, target, targets, grouped, integer, d2Lo, d2Hi, d2Unit, groupLabels }: {
  title: string; sub: string; chartSub: string
  value?: number; unit?: string; chartUnit?: string; isGreen?: (v: number) => boolean
  dual?: { label: string; value: number; unit: string; isGreen?: (v: number) => boolean }[]
  thresh?: { label: string; g: boolean }[]
  seed: number; n: number; lo: number; hi: number; target?: number; targets?: { value: number; color: string }[]; grouped?: true; integer?: true
  d2Lo?: number; d2Hi?: number; d2Unit?: string; groupLabels?: [string, string]
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="text-xs font-semibold text-foreground mb-1.5">{title}</div>
      <div className="text-[10px] text-text-secondary mb-1.5">{sub}</div>
      {dual ? (
        <div className="flex gap-5">
          {dual.map(d => (
            <div key={d.label}>
              <div className="text-[9px] uppercase tracking-wider text-text-secondary mb-0.5">{d.label}</div>
              <div className="text-xl font-semibold leading-none" style={{ color: perfColor(d.value, d.isGreen) }}>
                {d.value}<span className="text-xs font-normal text-text-secondary ml-0.5"> {d.unit}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-2xl font-semibold leading-none" style={{ color: perfColor(value!, isGreen) }}>
          {value}<span className="text-sm font-normal text-text-secondary ml-1">{unit}</span>
        </div>
      )}
      <div className="text-[9px] text-text-secondary mt-2 mb-0.5">{chartSub}</div>
      <MiniBarChart seed={seed} n={n} lo={lo} hi={hi} target={target} targets={targets} grouped={grouped} integer={integer} unit={chartUnit} d2Lo={d2Lo} d2Hi={d2Hi} d2Unit={d2Unit} groupLabels={groupLabels} />
      {thresh && (
        <div className="flex gap-1 flex-wrap mt-1.5">
          {thresh.map(t => (
            <span key={t.label} className={`text-[10px] px-1.5 py-0.5 rounded ${t.g ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main view ─────────────────────────────────────────────────────────────────

const SECTION_IDS = ['sec-info', 'sec-health', 'sec-perf', 'sec-svc']
const SCROLL_MARGIN = { scrollMarginTop: 108 }

export default function ChargerDetailView({
  charger,
  prev,
  next,
}: {
  charger: Charger
  prev: Charger | null
  next: Charger | null
}) {
  const [activeSection, setActiveSection] = useState('sec-info')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      let active = SECTION_IDS[0]
      for (const id of SECTION_IDS) {
        const sec = document.getElementById(id)
        if (sec && sec.getBoundingClientRect().top < 120) active = id
      }
      setActiveSection(active)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const detail = CHARGER_DETAIL_DATA[charger.num]

  return (
    <div className="flex h-full overflow-hidden">
      <ChargerDetailSidebar activeSection={activeSection} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 h-12 flex items-center px-6 border-b border-border bg-background">
          <div className="ml-auto flex items-center gap-1">
            {prev && (
              <Link
                href={`/charger/${prev.num}`}
                className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium border border-border rounded-lg text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft size={12} />
                Prev
              </Link>
            )}
            {next && (
              <Link
                href={`/charger/${next.num}`}
                className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium border border-border rounded-lg text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
              >
                Next
                <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </div>

        {/* Timeline */}
        <TimeScrubber chargerNum={charger.num} />

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar bg-muted/30">
          <div className="max-w-[1500px] mx-auto px-6 py-6 flex flex-col gap-6">

            {/* ── Charger info ── */}
            <section id="sec-info" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <h1 className="text-lg font-medium tracking-wide">
                    {charger.prefix}<strong className="font-bold">{charger.num}</strong>
                  </h1>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://maps.google.com/?q=${charger.lat},${charger.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs border border-border rounded-lg text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <MapPin size={12} />
                      Location
                    </a>
                    <FreshnessTag mins={charger.freshMins} />
                    <StatePill state={charger.state} />
                  </div>
                </div>
                {/* Profile grid */}
                <div className="border-t border-border px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-3.5">
                  {[
                    { label: 'Operator',     value: detail?.operator     ?? '—' },
                    { label: 'AMC Type',     value: detail?.amcType      ?? '—' },
                    { label: 'Model',        value: detail?.model        ?? '—' },
                    { label: 'Rated Power',  value: detail?.ratedPower   ?? '—' },
                    { label: 'Corridor',     value: charger.corridor          },
                    { label: 'Site',         value: charger.site              },
                    { label: 'Site ID',      value: detail?.siteId       ?? '—' },
                    { label: 'IoT Project',  value: detail?.iotProject   ?? '—' },
                    { label: 'Commissioned', value: detail?.commissioned ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
                      <span className="text-xs font-medium text-foreground truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Charger health ── */}
            <section id="sec-health" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                  <span className="text-sm font-semibold">Charger health</span>
                  <HealthPill status={charger.health} derationPct={charger.derationPct} />
                </div>
                <ChargerSchematic chargerNum={charger.num} />
              </div>
            </section>

            {/* ── Performance ── */}
            <section id="sec-perf" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <span className="text-sm font-semibold">Performance</span>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-3 gap-3">
                    <PerfCard title="Data Uptime" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={94.1} unit="%" chartUnit="%" isGreen={v => v >= 95}
                      thresh={[{label:'≥95%',g:true},{label:'<95%',g:false}]}
                      seed={1} n={30} lo={88} hi={100} target={95} />
                    <PerfCard title="Charger Uptime" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={97.2} unit="%" chartUnit="%" isGreen={v => v >= 98}
                      thresh={[{label:'≥98%',g:true},{label:'<98%',g:false}]}
                      seed={2} n={30} lo={92} hi={100} target={98} />
                    <PerfCard title="Charging Time" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={23} unit="min" chartUnit="min" isGreen={v => v < 25}
                      thresh={[{label:'<25m',g:true},{label:'≥25m',g:false}]}
                      seed={3} n={30} lo={16} hi={34} target={25} />
                    <PerfCard title="Session Success Rate" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={93.4} unit="%" chartUnit="%" isGreen={v => v >= 95}
                      thresh={[{label:'≥95%',g:true},{label:'<95%',g:false}]}
                      seed={4} n={30} lo={86} hi={99} target={95} />
                    <PerfCard title="Energy Sold" sub="This month" chartSub="Monthly · last 12 months"
                      dual={[
                        { label: 'Energy',  value: 221,  unit: 'MWh'   },
                        { label: 'Revenue', value: 39.8, unit: 'L INR' },
                      ]}
                      chartUnit="MWh" seed={6} n={12} lo={150} hi={290}
                      d2Lo={27} d2Hi={52} d2Unit="L INR" groupLabels={['MWh', 'L INR']} grouped />
                    <PerfCard title="Charger Efficiency" sub="This month" chartSub="Monthly · last 12 months"
                      value={89} unit="%" chartUnit="%" isGreen={v => v >= 85}
                      thresh={[{label:'≥85%',g:true},{label:'<85%',g:false}]}
                      seed={10} n={12} lo={78} hi={96} target={85} />
                    <PerfCard title="Queue Time" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={8} unit="min" chartUnit="min" isGreen={v => v <= 5}
                      thresh={[{label:'≤5m',g:true},{label:'>5m',g:false}]}
                      seed={7} n={30} lo={2} hi={15} target={5} />
                    <PerfCard title="Breakdowns" sub="This month" chartSub="Monthly · last 12 months"
                      value={1} unit="this month" isGreen={v => v === 0}
                      thresh={[{label:'0',g:true},{label:'≥1',g:false}]}
                      seed={8} n={12} lo={0} hi={4} integer />
                    <PerfCard title="Breakdown Duration" sub="This month" chartSub="Monthly · last 12 months"
                      dual={[
                        {label:'Critical',     value:1.8, unit:'h', isGreen: v => v <= 2},
                        {label:'Non-critical', value:6.2, unit:'h', isGreen: v => v <= 8},
                      ]}
                      thresh={[{label:'Crit ≤2h',g:true},{label:'Non-crit ≤8h',g:true}]}
                      seed={9} n={12} lo={0.5} hi={9}
                      targets={[{value:2,color:'#e8a020'},{value:8,color:'#e8a020'}]}
                      grouped />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Service history ── */}
            <section id="sec-svc" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Service history</span>
                  <span className="text-xs text-text-secondary">
                    Next service due in <span className="font-semibold text-foreground">42 days</span>
                  </span>
                </div>
                <div className="px-5 py-4">
                  <table className="w-full border-collapse">
                    <colgroup>
                      <col style={{ width: 160 }} />
                      <col style={{ width: 160 }} />
                      <col />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-border">
                        {['Date', 'Type', 'Report'].map(h => (
                          <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary pb-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: '21 Apr 2026', type: 'unscheduled' as const },
                        { date: '04 Feb 2026', type: 'unscheduled' as const },
                        { date: '10 Jan 2026', type: 'scheduled'   as const },
                      ].map(({ date, type }, i) => (
                        <tr key={i} className="border-b border-border last:border-b-0">
                          <td className="py-2.5 text-xs text-foreground">{date}</td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${type === 'scheduled' ? 'bg-neutral-100 text-neutral-600' : 'bg-amber-50 text-amber-700'}`}>
                              {type === 'scheduled' ? 'Scheduled' : 'Unscheduled'}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <a href="#" className="text-xs text-blue-500 hover:underline">View report →</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
