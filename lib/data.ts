import type { Charger, ChargerNotification } from './types'

export const CHARGERS: Charger[] = [
  { prefix: 'EXP-C-', num: '003', site: 'Undavelly',  corridor: 'BLR–HYD', health: 'breakdown', state: 'idle',     freshMins: 48,  lat: 16.435, lng: 80.495 },
  { prefix: 'EXP-C-', num: '005', site: 'CK Palli',   corridor: 'BLR–HYD', health: 'breakdown', state: 'idle',     freshMins: 127, lat: 14.730, lng: 77.985 },
  { prefix: 'EXP-C-', num: '004', site: 'CK Palli',   corridor: 'BLR–HYD', health: 'deration',  state: 'charging', freshMins: 1,   lat: 14.722, lng: 77.977, derationPct: 65 },
  { prefix: 'EXP-C-', num: '001', site: 'Penukonda',  corridor: 'BLR–HYD', health: 'healthy',   state: 'charging', freshMins: 0,   lat: 14.083, lng: 77.598 },
  { prefix: 'EXP-C-', num: '002', site: 'Penukonda',  corridor: 'BLR–HYD', health: 'grid-down', state: 'idle',     freshMins: 3,   lat: 14.089, lng: 77.606 },
  { prefix: 'EXP-C-', num: '006', site: 'Coimbatore', corridor: 'BLR–CBE', health: 'healthy',   state: 'idle',     freshMins: 5,   lat: 11.017, lng: 76.955 },
  { prefix: 'EXP-C-', num: '007', site: 'Hosur',      corridor: 'BLR–CBE', health: 'healthy',   state: 'idle',     freshMins: 2,   lat: 12.740, lng: 77.825 },
]

export const CORRIDORS = ['BLR–HYD', 'BLR–CBE'] as const

export const SITES = [...new Set(CHARGERS.map(c => c.site))].sort()

export const CHARGER_DETAIL_DATA: Record<string, {
  operator: string
  amcType: string
  model: string
  ratedPower: string
  siteId: string
  iotProject: string
  commissioned: string
}> = {
  '001': { operator: 'Atria Energy',    amcType: 'Full AMC',    model: 'H1', ratedPower: '1.6 MW', siteId: 'SITE-PNK-001', iotProject: 'PROJ-ATR-001', commissioned: '12 Jan 2026' },
  '002': { operator: 'Atria Energy',    amcType: 'Full AMC',    model: 'H1', ratedPower: '1.6 MW', siteId: 'SITE-PNK-001', iotProject: 'PROJ-ATR-001', commissioned: '15 Jan 2026' },
  '003': { operator: 'Atria Energy',    amcType: 'Partial AMC', model: 'H1', ratedPower: '1.6 MW', siteId: 'SITE-UND-001', iotProject: 'PROJ-ATR-001', commissioned: '20 Feb 2026' },
  '004': { operator: 'SunMobility',     amcType: 'Full AMC',    model: 'H1', ratedPower: '1.6 MW', siteId: 'SITE-CKP-001', iotProject: 'PROJ-SUN-002', commissioned: '05 Mar 2026' },
  '005': { operator: 'SunMobility',     amcType: 'Partial AMC', model: 'H1', ratedPower: '1.6 MW', siteId: 'SITE-CKP-001', iotProject: 'PROJ-SUN-002', commissioned: '08 Mar 2026' },
  '006': { operator: 'Exponent Energy', amcType: 'Full AMC',    model: 'H1', ratedPower: '1.6 MW', siteId: 'SITE-CBE-001', iotProject: 'PROJ-EXP-003', commissioned: '14 Apr 2026' },
  '007': { operator: 'Exponent Energy', amcType: 'Full AMC',    model: 'H1', ratedPower: '1.6 MW', siteId: 'SITE-HSR-001', iotProject: 'PROJ-EXP-003', commissioned: '18 Apr 2026' },
}

export const CHARGER_NOTIFICATIONS: ChargerNotification[] = [
  { id: 'cn1', chargerId: 'EXP-C-003', from: 'deration',  to: 'breakdown', time: '08:14' },
  { id: 'cn2', chargerId: 'EXP-C-005', from: 'healthy',   to: 'breakdown', time: '11:22' },
  { id: 'cn3', chargerId: 'EXP-C-004', from: 'healthy',   to: 'deration',  time: '14:35' },
]
