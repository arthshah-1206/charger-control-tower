export type HealthStatus = 'healthy' | 'deration' | 'breakdown' | 'grid-down'
export type ChargerState = 'charging' | 'idle'

export interface ChargerNotification {
  id: string
  chargerId: string
  from: HealthStatus
  to: HealthStatus
  time: string
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
