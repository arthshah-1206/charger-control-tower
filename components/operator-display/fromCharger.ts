import type { Charger } from '@/lib/types'
import { LIVE_SESSIONS } from '@/lib/data'
import { CHARGER_HEALTH } from '@/components/ChargerSchematic'
import type { OperatorScreen, TileState } from './types'

function tile(h: string | undefined): TileState {
  if (h === 'healthy')               return 'ok'
  if (h === 'deration')              return 'warn'
  if (h === 'breakdown' || h === 'grid-down') return 'fault'
  return 'unknown'
}

export function operatorScreenFromCharger(charger: Charger): OperatorScreen {
  const health  = CHARGER_HEALTH[charger.num] ?? {}
  const session = LIVE_SESSIONS[charger.num] ?? null

  return {
    activityId: null,
    screenId:   0x101,
    soc:        session?.currentSoc ?? null,
    isDerated:  charger.health === 'deration',
    chargerId:  `${charger.prefix}${charger.num}`,
    session: session ? {
      id:        session.sessionId,
      timerSecs: session.durationMins * 60,
      packId:    session.packId,
    } : null,
    health: {
      grid:     charger.health === 'grid-down' ? 'fault' : 'ok',
      master:   tile(health.db),
      plumbing: tile(health.fluidCirculation),
      pile1:    tile(health.pile1),
      pile2:    tile(health.pile2),
      pile3:    tile(health.pile3),
      gun1:     tile(health.gun1),
      gun2:     tile(health.gun2),
      gun3:     tile(health.gun3),
      chiller1: tile(health.chiller1),
      chiller2: tile(health.chiller2),
    },
    connectors: {
      gun1:   { lock: session?.guns.find(g => g.id === 'gun1')?.locked ? 'locked' : 'unlocked', flow: 3 },
      gun2:   { lock: session?.guns.find(g => g.id === 'gun2')?.locked ? 'locked' : 'unlocked', flow: 3 },
      gun3:   { lock: session?.guns.find(g => g.id === 'gun3')?.locked ? 'locked' : 'unlocked', flow: 3 },
      fluid1: { lock: 'unlocked', flow: 3 },
      fluid2: { lock: 'unlocked', flow: 3 },
    },
  }
}
