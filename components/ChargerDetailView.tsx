'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Video, ExternalLink } from 'lucide-react'
import type { Charger } from '@/lib/types'
import { CHARGER_NOTIFICATIONS, CHARGER_DETAIL_DATA, CHARGER_SESSIONS, LIVE_SESSIONS, PACK_BUS_MAP, bytebeamSessionUrl } from '@/lib/data'
import { OperatorDisplay } from './operator-display/OperatorDisplay'
import { operatorScreenFromCharger } from './operator-display/fromCharger'
import LiveSessionPanel from './LiveSessionPanel'
import ChargerDetailSidebar from './ChargerDetailSidebar'
import ChargerSchematic, { CameraTimeline } from './ChargerSchematic'
import HealthPill from './HealthPill'
import StatePill from './StatePill'
import FreshnessTag from './FreshnessTag'

// ─── SOC Gauge ────────────────────────────────────────────────────────────────

function SocGauge({ current, className }: { current: number; className?: string }) {
  // Semicircle: 180° (left) → CW through 270° (top) → 0° (right), sweep=1
  const cx = 50, cy = 48, r = 40
  const toRad = (deg: number) => deg * Math.PI / 180
  const pt = (deg: number): [number, number] => [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))]

  const [sx, sy] = pt(180)  // left
  const [ex, ey] = pt(0)    // right
  const trackPath = `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`

  const clamped = Math.min(Math.max(current, 0), 99.99)
  const fillAngle = 180 + (clamped / 100) * 180
  const [fx, fy] = pt(fillAngle)
  const fillPath = `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 0 1 ${fx.toFixed(1)} ${fy.toFixed(1)}`

  return (
    <svg viewBox="0 0 100 60" className={className ?? 'w-20 h-auto shrink-0'} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="soc-grad" x1={sx.toFixed(1)} y1="0" x2={ex.toFixed(1)} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="35%"  stopColor="#f97316" />
          <stop offset="65%"  stopColor="#eab308" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path d={trackPath} fill="none" stroke="#e5e7eb" strokeWidth="7" strokeLinecap="round" />
      {current > 0 && (
        <path d={fillPath} fill="none" stroke="url(#soc-grad)" strokeWidth="7" strokeLinecap="round" />
      )}
      <text x="50" y="45" textAnchor="middle" fontSize="22" fontWeight="700" fontFamily="inherit" fill="currentColor">
        {current}<tspan fontSize="12" fontWeight="600">%</tspan>
      </text>
      <text x="50" y="57" textAnchor="middle" fontSize="8" fontFamily="inherit" fill="#9ca3af">
        SOC
      </text>
    </svg>
  )
}

// ─── Performance ──────────────────────────────────────────────────────────────

function getBarLabel(idx: number, n: number): string {
  const now = new Date()
  if (n === 12) {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - idx), 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  if (n <= 6) {
    const weeksAgo = n - 1 - idx
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weeksAgo * 7)
    return 'Wk ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - idx))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function perfColor(val: number, isGreen?: (v: number) => boolean): string | undefined {
  if (!isGreen) return undefined
  return isGreen(val) ? '#059669' : '#dc2626'
}

function MiniBarChart({ seed, n, lo, hi, target, targets, grouped, stacked, integer, unit, d2Lo, d2Hi, d2Unit, d3Lo, d3Hi, groupLabels }: {
  seed: number; n: number; lo: number; hi: number; target?: number; targets?: { value: number; color: string }[]; grouped?: true; stacked?: true; integer?: true; unit?: string
  d2Lo?: number; d2Hi?: number; d2Unit?: string; d3Lo?: number; d3Hi?: number; groupLabels?: string[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hovRef    = useRef<number | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const mk  = (s: number) => Array.from({ length: n }, (_, i) => {
    const v = lo + Math.abs(Math.sin(s * 127.1 + i * 311.7)) * (hi - lo)
    return integer ? Math.round(v) : v
  })
  const mk2 = (d2Lo != null && d2Hi != null)
    ? (s: number) => Array.from({ length: n }, (_, i) =>
        d2Lo + Math.abs(Math.sin(s * 127.1 + i * 311.7)) * (d2Hi - d2Lo)
      )
    : mk
  const mk3 = (d3Lo != null && d3Hi != null)
    ? (s: number) => Array.from({ length: n }, (_, i) =>
        d3Lo + Math.abs(Math.sin(s * 127.1 + i * 311.7)) * (d3Hi - d3Lo)
      )
    : null

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
    const d1 = mk(seed)
    const d2 = (grouped || stacked) ? mk2(seed + 50) : []
    const d3 = (stacked && mk3) ? mk3(seed + 100) : []
    // stacked: normalize by sum so bars represent totals; grouped: normalize series independently
    const sums = stacked ? d1.map((v, i) => v + (d2[i] || 0) + (d3[i] || 0)) : d1
    const mx1 = Math.max(...sums, target ?? 0, ...(targets?.map(t => t.value) ?? [])) * 1.15 || 1
    const mx2 = d2.length > 0 && !stacked ? Math.max(...d2) * 1.15 || 1 : mx1
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
    } else if (stacked) {
      const gap = 2, bw = Math.floor((W - gap * (n - 1)) / n)
      barEnd = (n - 1) * (bw + gap) + bw
      const has3 = d3.length > 0
      d1.forEach((v, i) => {
        const x = i * (bw + gap)
        const h1 = Math.max(1, Math.round((v / mx1) * (H - 2)))
        const h2 = Math.max(0, Math.round(((d2[i] || 0) / mx1) * (H - 2)))
        const h3 = has3 ? Math.max(0, Math.round(((d3[i] || 0) / mx1) * (H - 2))) : 0
        ctx.fillStyle = i === hov ? '#7ba3bd' : '#c5d5e8'
        ctx.fillRect(x, H - h1, bw, h1)
        if (h2 > 0) {
          ctx.fillStyle = i === hov ? '#5a8fab' : '#8fb8d0'
          ctx.fillRect(x, H - h1 - h2, bw, h2)
        }
        if (h3 > 0) {
          ctx.fillStyle = i === hov ? '#3a6f8f' : '#5a8fab'
          ctx.fillRect(x, H - h1 - h2 - h3, bw, h3)
        }
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
      ...(target !== undefined ? [{ value: target, color: '#059669' }] : []),
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
    const d1 = mk(seed)
    const d2 = (grouped || stacked) ? mk2(seed + 50) : []
    const d3 = (stacked && mk3) ? mk3(seed + 100) : []
    let idx: number
    if (grouped) {
      const gGap = 3, gW = Math.floor((W - gGap * (n - 1)) / n)
      idx = Math.max(0, Math.min(n - 1, Math.floor(x / (gW + gGap))))
    } else {
      const gap = 2, bw = Math.floor((W - gap * (n - 1)) / n)
      idx = Math.max(0, Math.min(n - 1, Math.floor(x / (bw + gap))))
    }
    if (idx !== hovRef.current) { hovRef.current = idx; paint(idx) }
    const v = d1[idx], v2 = (grouped || stacked) ? d2[idx] : undefined, v3 = d3.length ? d3[idx] : undefined
    const fmt = (val: number) => integer ? String(Math.round(val)) : val < 10 ? val.toFixed(1) : String(Math.round(val))
    const u = unit ? ` ${unit}` : ''
    const label = getBarLabel(idx, n)
    const tipText = v3 !== undefined && groupLabels
      ? `${label} · ${groupLabels[0]}:${fmt(v)} · ${groupLabels[1]}:${fmt(v2!)} · ${groupLabels[2]}:${fmt(v3)}`
      : v2 !== undefined
        ? groupLabels
          ? `${label} · ${groupLabels[0]}: ${fmt(v)}${u} · ${groupLabels[1]}: ${v2.toFixed(1)}${d2Unit ? ' ' + d2Unit : ''}`
          : `${label} · Crit: ${v.toFixed(1)}h · Non-crit: ${v2.toFixed(1)}h`
        : `${label}: ${fmt(v)}${u}`
    setTip({ x: e.clientX, y: e.clientY, text: tipText })
  }

  function handleLeave() {
    if (hovRef.current !== null) { hovRef.current = null; paint(null) }
    setTip(null)
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full block" style={{ height: 44 }}
        onMouseMove={handleMove} onMouseLeave={handleLeave} />
      {(grouped || stacked) && groupLabels && (
        <div className="flex gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className="inline-block w-2.5 h-1.5 rounded-sm bg-[#c5d5e8]" />
            {groupLabels[0]}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className={`inline-block w-2.5 h-1.5 rounded-sm ${stacked && !grouped ? 'bg-[#8fb8d0]' : 'bg-[#a8bdd4]'}`} />
            {groupLabels[1]}
          </span>
          {groupLabels[2] && (
            <span className="flex items-center gap-1 text-[10px] text-text-secondary">
              <span className="inline-block w-2.5 h-1.5 rounded-sm bg-[#5a8fab]" />
              {groupLabels[2]}
            </span>
          )}
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

function PerfCard({ title, sub, chartSub, value, unit, chartUnit, isGreen, dual, seed, n, lo, hi, target, targets, grouped, stacked, integer, d2Lo, d2Hi, d2Unit, d3Lo, d3Hi, groupLabels }: {
  title: string; sub: string; chartSub: string
  value?: number; unit?: string; chartUnit?: string; isGreen?: (v: number) => boolean
  dual?: { label: string; value: number; unit: string; isGreen?: (v: number) => boolean }[]
  seed: number; n: number; lo: number; hi: number; target?: number; targets?: { value: number; color: string }[]; grouped?: true; stacked?: true; integer?: true
  d2Lo?: number; d2Hi?: number; d2Unit?: string; d3Lo?: number; d3Hi?: number; groupLabels?: string[]
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
      <MiniBarChart seed={seed} n={n} lo={lo} hi={hi} target={target} targets={targets} grouped={grouped} stacked={stacked} integer={integer} unit={chartUnit} d2Lo={d2Lo} d2Hi={d2Hi} d2Unit={d2Unit} d3Lo={d3Lo} d3Hi={d3Hi} groupLabels={groupLabels} />
    </div>
  )
}

// ─── Main view ─────────────────────────────────────────────────────────────────

function ragTime(mins: number | null): string {
  if (mins === null) return 'text-foreground'
  if (mins <= 25) return 'text-emerald-600'
  if (mins <= 35) return 'text-amber-600'
  return 'text-red-600'
}
function ragEff(pct: number | null): string {
  if (pct === null) return 'text-foreground'
  if (pct >= 85) return 'text-emerald-600'
  if (pct >= 75) return 'text-amber-600'
  return 'text-red-600'
}

const SECTION_IDS = ['sec-info', 'sec-health', 'sec-live', 'sec-session', 'sec-perf', 'sec-svc']
const SCROLL_MARGIN = { scrollMarginTop: 72 }

const HEADER_TINT: Record<string, string> = {
  healthy:    'border-l-emerald-500 bg-emerald-50',
  deration:   'border-l-amber-500   bg-amber-50',
  breakdown:  'border-l-red-500     bg-red-50',
  'grid-down':'border-l-sky-500     bg-sky-50',
}

export default function ChargerDetailView({
  charger,
}: {
  charger: Charger
}) {
  const [activeSection, setActiveSection] = useState('sec-info')
  const [sessionDateFilter, setSessionDateFilter] = useState<string>(() => new Date().toISOString().split('T')[0])
  const scrollRef = useRef<HTMLDivElement>(null)

  const liveSession = LIVE_SESSIONS[charger.num] ?? null
  const [elapsed, setElapsed] = useState(() => (liveSession?.durationMins ?? 0) * 60)
  useEffect(() => {
    if (!liveSession) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [liveSession])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
        setActiveSection(SECTION_IDS[SECTION_IDS.length - 1])
        return
      }
      const containerTop = el.getBoundingClientRect().top
      const threshold = containerTop + 80
      let active = SECTION_IDS[0]
      for (const id of SECTION_IDS) {
        const sec = document.getElementById(id)
        if (sec && sec.getBoundingClientRect().top <= threshold) active = id
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

        {/* Single-row header */}
        <div className={`shrink-0 flex items-center gap-4 px-6 border-b border-border border-l-4 select-none ${HEADER_TINT[charger.health] ?? ''}`} style={{ height: 60 }}>
          <h1 className="text-xl font-light tracking-wide shrink-0">
            <span className="text-text-secondary">{charger.prefix}</span><strong className="font-bold">{charger.num}</strong>
          </h1>
          <StatePill state={charger.state} />
          <FreshnessTag mins={charger.freshMins} />
          <div className="flex-1" />
          <CameraTimeline chargerNum={charger.num} variant="header" />
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar bg-muted/30">
          <div className="max-w-[1500px] mx-auto px-6 py-6 flex flex-col gap-6">

            {/* ── Charger info ── */}
            <section id="sec-info" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <span className="text-base font-semibold">Charger info</span>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-3.5">
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
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Location</span>
                    <a
                      href={`https://maps.google.com/?q=${charger.lat},${charger.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                    >
                      <MapPin size={11} className="shrink-0 text-text-secondary" />
                      {charger.lat.toFixed(4)}, {charger.lng.toFixed(4)}
                    </a>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">CCTV</span>
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                    >
                      <Video size={11} className="shrink-0 text-text-secondary" />
                      View all cameras
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Charger health ── */}
            <section id="sec-health" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                  <span className="text-base font-semibold">Charger health</span>
                  <HealthPill status={charger.health} derationPct={charger.derationPct} />
                </div>
                <ChargerSchematic chargerNum={charger.num} />
              </div>
            </section>

            {/* ── Live session ── */}
            {(() => {
              const baseScreen = operatorScreenFromCharger(charger)
              const screen = baseScreen.session
                ? { ...baseScreen, session: { ...baseScreen.session, timerSecs: elapsed } }
                : baseScreen
              return (
                <section id="sec-live" style={SCROLL_MARGIN}>
                  <div className="bg-background border border-border rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                      <span className="text-base font-semibold">Live session</span>
                      {liveSession && (
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex w-2 h-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 tracking-wider">LIVE</span>
                        </div>
                      )}
                    </div>
                    <div className="flex divide-x divide-border" style={{ height: 480 }}>
                      <div className="w-[380px] shrink-0 bg-muted/20">
                        <OperatorDisplay screen={screen} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <LiveSessionPanel session={liveSession} charger={charger} elapsed={elapsed} />
                      </div>
                    </div>
                  </div>
                </section>
              )
            })()}

            {/* ── Charging sessions ── */}
            <section id="sec-session" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <span className="text-base font-semibold">Session history</span>
                  <input
                    type="date"
                    value={sessionDateFilter}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setSessionDateFilter(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-foreground [font-family:inherit]"
                  />
                </div>
                <div className="px-5 py-5 flex flex-col gap-3">
                  {(() => {
                    const allSessions = CHARGER_SESSIONS[charger.num] ?? []
                    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                    const toSessionDate = (iso: string) => {
                      const [, m, d] = iso.split('-')
                      return `${d} ${MONTHS_SHORT[parseInt(m) - 1]}`
                    }
                    const filtered = allSessions.filter(s => s.date.startsWith(toSessionDate(sessionDateFilter)))

                    return (
                      <>
                        {/* Sessions table */}
                        {filtered.length === 0 ? (
                          <p className="text-sm text-text-secondary py-8 text-center">No sessions for this date</p>
                        ) : <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-muted border-b border-border">
                                {['Date', 'Bus', 'SOC', 'Charging time', 'Energy Sold', 'Efficiency'].map(h => (
                                  <th key={h} className="text-left text-[9px] font-semibold uppercase tracking-wider text-text-secondary px-3 py-2 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((s, i) => {
                                const efficiency = s.energyConsumedKwh > 0
                                  ? Math.round((s.energySoldKwh / s.energyConsumedKwh) * 100)
                                  : null
                                return (
                                  <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                                      <a href={bytebeamSessionUrl(s.sessionId)} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-text-secondary hover:text-blue-600 transition-colors">
                                        {s.date}
                                        <ExternalLink size={11} className="shrink-0 opacity-40 group-hover:opacity-100" />
                                      </a>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-foreground">{PACK_BUS_MAP[s.packId] ?? s.packId}</td>
                                    <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{s.startSoc}% → {s.endSoc}%</td>
                                    <td className="px-3 py-2 text-xs text-foreground">{s.durationMins} min</td>
                                    <td className="px-3 py-2 text-xs text-foreground">{s.energySoldKwh} kWh</td>
                                    <td className={`px-3 py-2 text-xs font-medium ${ragEff(efficiency)}`}>
                                      {efficiency !== null ? `${efficiency}%` : '—'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>}
                      </>
                    )
                  })()}
                </div>
              </div>
            </section>

            {/* ── Performance ── */}
            <section id="sec-perf" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <span className="text-base font-semibold">Performance</span>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-3 gap-3">
                    <PerfCard title="Charger Uptime" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={97.2} unit="%" chartUnit="%" isGreen={v => v >= 98}
                      seed={2} n={30} lo={92} hi={100} target={98} />
                    <PerfCard title="Data Uptime" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={98.8} unit="%" chartUnit="%" isGreen={v => v > 99.5}
                      seed={1} n={30} lo={96} hi={100} target={99.5} />
                    <PerfCard title="Power Availability" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      dual={[
                        { label: 'Grid + DG', value: 99.4, unit: '%', isGreen: v => v >= 99 },
                        { label: 'DG active', value: 1.1,  unit: '%' },
                      ]}
                      seed={11} n={30} lo={90} hi={99} target={99}
                      stacked d2Lo={0} d2Hi={8} d2Unit="%" groupLabels={['Grid', 'DG']} />
                    <PerfCard title="Utilization" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={68} unit="%" chartUnit="%" isGreen={v => v >= 60}
                      seed={12} n={30} lo={35} hi={85} target={60} />
                    <PerfCard title="Session Success Rate" sub="30-day rolling avg" chartSub="Charging time split · last 30 days"
                      value={93.4} unit="%" isGreen={v => v > 98}
                      seed={4} n={30} lo={55} hi={78}
                      stacked d2Lo={12} d2Hi={28} d3Lo={2} d3Hi={10}
                      groupLabels={['<25m', '25-45m', '>45m']} target={94} />
                    <PerfCard title="Charging Time" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      dual={[
                        { label: 'Avg time',      value: 23, unit: 'min', isGreen: v => v < 25 },
                        { label: 'Avg start SOC', value: 42, unit: '%' },
                      ]}
                      seed={3} n={30} lo={16} hi={34} target={25} chartUnit="min" />
                    <PerfCard title="Energy Sold" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      dual={[
                        { label: 'Energy',  value: 221,  unit: 'MWh'   },
                        { label: 'Revenue', value: 39.8, unit: 'L INR' },
                      ]}
                      chartUnit="MWh" seed={6} n={30} lo={4} hi={12} />
                    <PerfCard title="Charger Efficiency" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      dual={[
                        { label: 'Overall',  value: 89, unit: '%', isGreen: v => v >= 80 },
                        { label: 'Session',  value: 94, unit: '%', isGreen: v => v >= 85 },
                      ]}
                      chartUnit="%" seed={10} n={30} lo={79} hi={91} target={80} />
                    <PerfCard title="Queue Time" sub="30-day rolling avg" chartSub="Daily · last 30 days"
                      value={8} unit="min" chartUnit="min" isGreen={v => v <= 5}
                      seed={7} n={30} lo={2} hi={15} target={5} />
                    <PerfCard title="Breakdowns" sub="This month" chartSub="Monthly · last 12 months"
                      value={1} unit="this month" isGreen={v => v === 0}
                      seed={8} n={12} lo={0} hi={4} integer />
                    <PerfCard title="Breakdown Duration" sub="This month" chartSub="Monthly · last 12 months"
                      dual={[
                        {label:'Critical',     value:1.8, unit:'h', isGreen: v => v <= 2},
                        {label:'Non-critical', value:6.2, unit:'h', isGreen: v => v <= 8},
                      ]}
                      seed={9} n={12} lo={0.5} hi={9}
                      targets={[{value:2,color:'#059669'},{value:8,color:'#059669'}]}
                      grouped />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Service history ── */}
            <section id="sec-svc" style={SCROLL_MARGIN}>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <span className="text-base font-semibold">Service history</span>
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
