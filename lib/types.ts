export type HealthStatus = 'healthy' | 'deration' | 'breakdown' | 'grid-down'
export type ChargerState = 'charging' | 'idle'

export interface ChargerNotification {
  id: string
  chargerId: string
  from: HealthStatus
  to: HealthStatus
  time: string
}

export type SessionStatus = 'success' | 'interrupted' | 'failed'

export interface SessionRecord {
  sessionId: string
  packId: string
  startSoc: number
  endSoc: number
  durationMins: number
  energyConsumedKwh: number
  energySoldKwh: number
  date: string
  status: SessionStatus
}

export interface ChargingSession {
  sessionId: string
  packId: string
  startSoc: number
  currentSoc: number
  durationMins: number
  energyKwh: number
  guns: { id: 'gun1' | 'gun2' | 'gun3'; locked: boolean }[]
}

export interface Charger {
  prefix: string
  num: string
  site: string
  corridor: string
  health: HealthStatus
  state: ChargerState
  freshMins: number
  lat: number
  lng: number
  derationPct?: number  // % of rated capacity still available; only set when health === 'deration'
}
