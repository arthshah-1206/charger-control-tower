'use client'

import { useRef, useState, useEffect } from 'react'
import type { LockState, OperatorConnector, OperatorHealth, OperatorScreen, TileState } from './types'
import { Lock, LockOpen, Plug, TILE_ICON, Triangle } from './icons'

const TILE_LABEL: Record<keyof OperatorHealth, string> = {
  grid: 'Grid', master: 'Master', plumbing: 'Plumbing',
  pile1: 'Pile 1', pile2: 'Pile 2', pile3: 'Pile 3',
  gun1: 'Gun 1', gun2: 'Gun 2', gun3: 'Gun 3',
  chiller1: 'Chiller 1', chiller2: 'Chiller 2',
}

const HEALTH_ROWS: (keyof OperatorHealth)[][] = [
  ['grid', 'master', 'plumbing'],
  ['pile1', 'pile2', 'pile3'],
  ['gun1', 'gun2', 'gun3'],
]

const ARC = { vbW: 600, vbH: 300, r: 250, cx: 300, cy: 300, sx: 50, sy: 300, ex: 550, ey: 300 }
const ARC_LEN = Math.PI * ARC.r
const ARC_PATH = `M ${ARC.sx} ${ARC.sy} A ${ARC.r} ${ARC.r} 0 0 1 ${ARC.ex} ${ARC.ey}`

function SocArc({ soc }: { soc: number | null }) {
  const pct = soc === null ? 0 : Math.min(Math.max(soc, 0), 100)
  return (
    <div className="op-soc-wrap">
      <svg className="op-soc-arc" viewBox={`0 0 ${ARC.vbW} ${ARC.vbH}`} preserveAspectRatio="xMidYMin meet">
        <defs>
          <linearGradient id="op-socGrad" gradientUnits="userSpaceOnUse" x1="50" y1="0" x2="550" y2="0">
            <stop offset="0%"   stopColor="#E11D48" />
            <stop offset="50%"  stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <path className="op-arc-track" d={ARC_PATH} />
        <path className="op-arc-fill" d={ARC_PATH} style={{ strokeDasharray: ARC_LEN, strokeDashoffset: ARC_LEN * (1 - pct / 100) }} />
        <circle cx={ARC.sx} cy={ARC.sy} r={14} fill="#E11D48" />
      </svg>
      <div className="op-soc-center">
        <div className="op-big">
          {soc === null ? '—' : soc}
          {soc !== null && <span className="op-pct">%</span>}
        </div>
        <div className="op-lbl">SOC</div>
      </div>
    </div>
  )
}

const DOT_CLASS: Record<TileState, string> = { ok: 'ok', warn: 'warn', fault: 'fault', unknown: 'unknown' }
const TILE_BG:  Record<TileState, string> = { ok: '', warn: 'warn', fault: 'fault', unknown: '' }

function HealthCell({ tile, state }: { tile: keyof OperatorHealth; state: TileState }) {
  const Icon = TILE_ICON[tile]
  return (
    <div className={`op-h-cell ${TILE_BG[state]}`}>
      <span className="op-ic"><Icon size={18} strokeWidth={2} /></span>
      <span className="op-nm">{TILE_LABEL[tile]}</span>
      <span className={`op-dot ${DOT_CLASS[state]}`} />
    </div>
  )
}

function formatTimer(secs: number | null): string {
  if (secs === null) return '—'
  const m = Math.floor(secs / 60)
  if (m === 0) return `${secs} s`
  if (m < 60) return `${m} min`
  return m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} m`
}

function connectorStyle(lock: LockState) {
  switch (lock) {
    case 'locked':   return { cls: 'locked',   icon: Lock,     text: 'Locked',   dim: false }
    case 'remate':   return { cls: 'remate',   icon: Triangle, text: 'Re-mate',  dim: false }
    case 'checking': return { cls: 'unlocked', icon: null,     text: 'Checking', dim: true  }
    case 'canfault': return { cls: 'canfault', icon: Triangle, text: 'CAN fault',dim: true  }
    case 'dummy':    return { cls: 'dummy',    icon: Plug,     text: 'Connect',  dim: false }
    default:         return { cls: 'unlocked', icon: LockOpen, text: 'Unlocked', dim: false }
  }
}

function ConnectorCard({ label, connector }: { label: string; connector: OperatorConnector }) {
  const s = connectorStyle(connector.lock)
  const Icon = s.icon
  const flow = s.dim ? 0 : (connector.flow ?? 3)
  return (
    <div className={`op-conn ${s.cls}`}>
      <span className="op-ci">{Icon ? <Icon size={22} strokeWidth={2} /> : null}</span>
      <span className="op-cl">{label}</span>
      <span className="op-cs">{s.text}</span>
      <span className="op-flow">
        {[0, 1, 2].map((i) => <span key={i} className={`op-fb ${i < flow ? 'on' : ''}`} />)}
      </span>
    </div>
  )
}

export function OperatorDisplay({ screen }: { screen: OperatorScreen }) {
  const h = screen.health
  const c = screen.connectors
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.62)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      setScale(Math.max(0.4, Math.min(height / 950, width / 600)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="op-stage" ref={stageRef}>
      <div style={{ width: 600 * scale, height: 950 * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <div className="op-device">
            <div className="op-content">
              <div className="op-notch">{screen.chargerId}</div>
              <div className="op-gap-10" />
              <SocArc soc={screen.soc} />
              <div className="op-gap-6" />
              <div className="op-badge-area">
                {screen.isDerated && <span className="op-badge op-badge-derated">⚠ DERATED</span>}
              </div>
              <div className="op-gap-10" />
              <div className="op-dyn-grid">
                <div className="op-kv">
                  <div className="op-k">SESSION</div>
                  <div className="op-v">{screen.session?.id ?? '—'}</div>
                </div>
                <div className="op-kv">
                  <div className="op-k">TIMER</div>
                  <div className="op-v">{formatTimer(screen.session?.timerSecs ?? null)}</div>
                </div>
                <div className="op-kv">
                  <div className="op-k">PACK ID</div>
                  <div className="op-v">{screen.session?.packId ?? '—'}</div>
                </div>
              </div>
              <div className="op-gap-12" />
              <div className="op-health">
                {HEALTH_ROWS.map((row, ri) => (
                  <div key={ri} className="op-h-row">
                    {row.map((t) => <HealthCell key={t} tile={t} state={h[t]} />)}
                  </div>
                ))}
                <div className="op-h-row">
                  <HealthCell tile="chiller1" state={h.chiller1} />
                  <HealthCell tile="chiller2" state={h.chiller2} />
                  <div />
                </div>
              </div>
              <div className="op-gap-40" />
              <div className="op-conn-row">
                <ConnectorCard label="Gun 1"   connector={c.gun1}   />
                <ConnectorCard label="Gun 2"   connector={c.gun2}   />
                <ConnectorCard label="Gun 3"   connector={c.gun3}   />
                <ConnectorCard label="Fluid 1" connector={c.fluid1} />
                <ConnectorCard label="Fluid 2" connector={c.fluid2} />
              </div>
              <div className="op-gap-24" />
              <div className="op-prompt">{screen.session ? 'Charging in progress.' : 'Ready to charge'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
