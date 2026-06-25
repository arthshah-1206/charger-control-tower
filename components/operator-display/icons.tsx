import {
  Cpu, Droplet, Layers, Lock, LockOpen, Plug, Snowflake, Triangle, Zap,
  type LucideIcon,
} from 'lucide-react'
import type { OperatorHealth } from './types'

export const TILE_ICON: Record<keyof OperatorHealth, LucideIcon> = {
  grid:     Zap,
  master:   Cpu,
  plumbing: Droplet,
  pile1:    Layers,
  pile2:    Layers,
  pile3:    Layers,
  gun1:     Plug,
  gun2:     Plug,
  gun3:     Plug,
  chiller1: Snowflake,
  chiller2: Snowflake,
}

export { Lock, LockOpen, Plug, Triangle }
