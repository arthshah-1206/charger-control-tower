'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import type { ChargingSession, Charger, SessionRecord } from '@/lib/types'

const TARGET_MINS = 25
const RATE_PER_KWH = 15

function pad2(n: number) { return String(n).padStart(2, '0') }
function fmtClock(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` }
function fmtTimer(secs: number) { return `${pad2(Math.floor(secs / 60))}:${pad2(secs % 60)}` }

export default function LiveSessionPanel({
  session,
  elapsed,
  lastSession,
}: {
  session: ChargingSession | null
  charger: Charger
  elapsed: number
  lastSession?: SessionRecord | null
}) {
  const [startTime] = useState(() => new Date(Date.now() - (session?.durationMins ?? 0) * 60 * 1000))

  if (!session) {
    if (!lastSession) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
            <Zap size={18} className="text-text-secondary" />
          </div>
          <p className="text-sm font-semibold text-text-secondary">No active session</p>
        </div>
      )
    }
    const ls = lastSession
    const lsRevenue = Math.round(ls.energySoldKwh * RATE_PER_KWH)
    const lsSocDelta = ls.endSoc - ls.startSoc
    const lsProgressPct = Math.min((ls.durationMins / TARGET_MINS) * 100, 100)
    return (
      <div className="flex flex-col gap-3.5 p-5 overflow-y-auto [:fullscreen_&]:h-full">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold tracking-tight">{ls.sessionId}</p>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-text-secondary border border-border">Last</span>
          </div>
          <p className="text-xs text-text-secondary tabular-nums mt-0.5">{ls.date}</p>
        </div>
        <div className="bg-muted/40 border border-border rounded-xl px-5 py-4 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40" style={{ background: 'linear-gradient(to right, #888, transparent)' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Total charging time</p>
          <p className="text-5xl font-bold tabular-nums leading-none mb-4 text-foreground">{fmtTimer(ls.durationMins * 60)}</p>
          <div className="w-full px-2">
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${lsProgressPct}%`, background: 'linear-gradient(to right, #888, #aaa)' }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-secondary">0</span>
              <span className="text-[10px] text-text-secondary">25 min</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-3 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-20" style={{ background: 'linear-gradient(to right, #888, transparent)' }} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5">State of charge</p>
            <div className="flex items-start gap-2.5">
              <span className="text-3xl font-bold tabular-nums leading-none">
                {ls.startSoc}<span className="text-xs font-normal text-text-secondary">%</span>
              </span>
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <span className="text-lg leading-none text-border">→</span>
                <span className="text-[9px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap" style={{ color: '#CC8800', background: '#FFF8E6', border: '1px solid #FFD985' }}>
                  ▲{lsSocDelta}%
                </span>
              </div>
              <span className="text-3xl font-bold tabular-nums leading-none">
                {ls.endSoc}<span className="text-xs font-normal text-text-secondary">%</span>
              </span>
            </div>
          </div>
          <div className="col-span-3 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-20" style={{ background: 'linear-gradient(to right, #888, transparent)' }} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5">Current</p>
            <span className="text-3xl font-bold tabular-nums leading-none text-text-secondary">–</span>
          </div>
          <div className="col-span-2 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-20" style={{ background: 'linear-gradient(to right, #888, transparent)' }} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5">kWh dispensed</p>
            <span className="text-2xl font-bold tabular-nums leading-none">
              {ls.energySoldKwh}<span className="text-xs font-normal text-text-secondary ml-1">kWh</span>
            </span>
          </div>
          <div className="col-span-2 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-20" style={{ background: 'linear-gradient(to right, #888, transparent)' }} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5">Revenue earned</p>
            <span className="text-2xl font-bold tabular-nums leading-none">₹{lsRevenue}</span>
          </div>
          <div className="col-span-2 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-20" style={{ background: 'linear-gradient(to right, #888, transparent)' }} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5">Charger efficiency</p>
            <span className="text-2xl font-bold tabular-nums leading-none">
              92<span className="text-xs font-normal text-text-secondary ml-1">%</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  const socDelta = session.currentSoc - session.startSoc
  const progressPct = Math.min((elapsed / (TARGET_MINS * 60)) * 100, 100)
  const revenue = Math.round(session.energyKwh * RATE_PER_KWH)
  const nowStr = fmtClock(new Date(startTime.getTime() + elapsed * 1000))

  return (
    <div className="flex flex-col gap-3.5 p-5 overflow-y-auto [:fullscreen_&]:h-full [:fullscreen_&]:gap-5 [:fullscreen_&]:p-7">
      {/* Session header */}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-base font-bold tracking-tight [:fullscreen_&]:text-xl">{session.sessionId}</p>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
        </div>
        <p className="text-xs text-text-secondary tabular-nums mt-0.5 [:fullscreen_&]:text-sm">
          {fmtClock(startTime)} → {nowStr}
        </p>
      </div>

      {/* Time hero */}
      <div className="bg-muted/40 border border-border rounded-xl px-5 py-4 text-center relative overflow-hidden [:fullscreen_&]:py-7">
        <div className="absolute top-0 left-0 right-0 h-[2px] opacity-70" style={{ background: 'linear-gradient(to right, #FFB000, transparent)' }} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2 [:fullscreen_&]:text-sm [:fullscreen_&]:mb-3">Charging time</p>
        <p className="text-5xl font-bold tabular-nums leading-none mb-4 [:fullscreen_&]:text-7xl [:fullscreen_&]:mb-6" style={{ color: '#FFB000' }}>{fmtTimer(elapsed)}</p>
        <div className="w-full px-2">
          <div className="h-1.5 bg-border rounded-full overflow-hidden [:fullscreen_&]:h-2">
            <div
              className="h-full rounded-full transition-[width] duration-1000"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(to right, #CC8800, #FFB000)' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-text-secondary [:fullscreen_&]:text-sm">0</span>
            <span className="text-[10px] text-text-secondary [:fullscreen_&]:text-sm">25 min</span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-6 gap-2 [:fullscreen_&]:gap-3">
        {/* SOC */}
        <div className="col-span-3 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden [:fullscreen_&]:p-7">
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40" style={{ background: 'linear-gradient(to right, #FFB000, transparent)' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5 [:fullscreen_&]:text-sm [:fullscreen_&]:mb-4">State of charge</p>
          <div className="flex items-start gap-2.5 [:fullscreen_&]:gap-4">
            <span className="text-3xl font-bold tabular-nums leading-none [:fullscreen_&]:text-5xl">
              {session.startSoc}<span className="text-xs font-normal text-text-secondary [:fullscreen_&]:text-base">%</span>
            </span>
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <span className="text-lg leading-none text-border [:fullscreen_&]:text-3xl">→</span>
              <span className="text-[9px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap [:fullscreen_&]:text-xs" style={{ color: '#CC8800', background: '#FFF8E6', border: '1px solid #FFD985' }}>
                ▲{socDelta}%
              </span>
            </div>
            <span className="text-3xl font-bold tabular-nums leading-none [:fullscreen_&]:text-5xl" style={{ color: '#FFB000' }}>
              {session.currentSoc}<span className="text-xs font-normal text-text-secondary [:fullscreen_&]:text-base">%</span>
            </span>
          </div>
        </div>

        {/* Current */}
        <div className="col-span-3 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden [:fullscreen_&]:p-7">
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40" style={{ background: 'linear-gradient(to right, #FFB000, transparent)' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5 [:fullscreen_&]:text-sm [:fullscreen_&]:mb-4">Current</p>
          <span className="text-3xl font-bold tabular-nums leading-none [:fullscreen_&]:text-5xl" style={{ color: '#FFB000' }}>
            148<span className="text-xs font-normal text-text-secondary ml-1 [:fullscreen_&]:text-base">A</span>
          </span>
        </div>

        {/* kWh */}
        <div className="col-span-2 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden [:fullscreen_&]:p-7">
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40" style={{ background: 'linear-gradient(to right, #FFB000, transparent)' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5 [:fullscreen_&]:text-sm [:fullscreen_&]:mb-4">kWh dispensed</p>
          <span className="text-2xl font-bold tabular-nums leading-none [:fullscreen_&]:text-4xl" style={{ color: '#FFB000' }}>
            {session.energyKwh}<span className="text-xs font-normal text-text-secondary ml-1 [:fullscreen_&]:text-sm">kWh</span>
          </span>
        </div>

        {/* Revenue */}
        <div className="col-span-2 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden [:fullscreen_&]:p-7">
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40" style={{ background: 'linear-gradient(to right, #FFB000, transparent)' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5 [:fullscreen_&]:text-sm [:fullscreen_&]:mb-4">Revenue earned</p>
          <span className="text-2xl font-bold tabular-nums leading-none [:fullscreen_&]:text-4xl" style={{ color: '#FFB000' }}>₹{revenue}</span>
        </div>

        {/* Efficiency */}
        <div className="col-span-2 bg-muted/40 border border-border rounded-xl p-5 relative overflow-hidden [:fullscreen_&]:p-7">
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40" style={{ background: 'linear-gradient(to right, #FFB000, transparent)' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2.5 [:fullscreen_&]:text-sm [:fullscreen_&]:mb-4">Charger efficiency</p>
          <span className="text-2xl font-bold tabular-nums leading-none [:fullscreen_&]:text-4xl" style={{ color: '#FFB000' }}>
            92<span className="text-xs font-normal text-text-secondary ml-1 [:fullscreen_&]:text-sm">%</span>
          </span>
        </div>
      </div>
    </div>
  )
}
