export type TileState = 'ok' | 'warn' | 'fault' | 'unknown'
export type LockState = 'locked' | 'unlocked' | 'remate' | 'checking' | 'canfault' | 'dummy'

export interface OperatorSession {
  id: string | null
  timerSecs: number | null
  packId: string | null
}

export interface OperatorHealth {
  grid: TileState
  master: TileState
  plumbing: TileState
  pile1: TileState
  pile2: TileState
  pile3: TileState
  gun1: TileState
  gun2: TileState
  gun3: TileState
  chiller1: TileState
  chiller2: TileState
}

export interface OperatorConnector {
  lock: LockState
  flow: number
}

export interface OperatorConnectors {
  gun1: OperatorConnector
  gun2: OperatorConnector
  gun3: OperatorConnector
  fluid1: OperatorConnector
  fluid2: OperatorConnector
}

export interface OperatorScreen {
  activityId: number | null
  screenId: number
  soc: number | null
  isDerated: boolean
  chargerId: string
  session: OperatorSession | null
  health: OperatorHealth
  connectors: OperatorConnectors
}
