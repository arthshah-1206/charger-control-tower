import type { Charger, ChargerNotification, ChargingSession, SessionRecord } from './types'

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

export const LIVE_SESSIONS: Record<string, ChargingSession> = {
  '001': {
    sessionId: 'S-90244',
    packId: 'PK-3821',
    startSoc: 18,
    currentSoc: 72,
    durationMins: 14,
    energyKwh: 89,
    guns: [
      { id: 'gun1', locked: true },
      { id: 'gun2', locked: true },
      { id: 'gun3', locked: true },
    ],
  },
  '004': {
    sessionId: 'S-90237',
    packId: 'PK-4471',
    startSoc: 12,
    currentSoc: 100,
    durationMins: 18,
    energyKwh: 142,
    guns: [
      { id: 'gun1', locked: true },
      { id: 'gun2', locked: true },
      { id: 'gun3', locked: true },
    ],
  },
}

export const CHARGER_SESSIONS: Record<string, SessionRecord[]> = {
  '001': [
    { sessionId: 'S-90233', packId: 'PK-4471', startSoc: 22, endSoc: 100, durationMins: 18, energyConsumedKwh: 142, energySoldKwh: 126, date: '09 Jun, 08:14', status: 'success'     },
    { sessionId: 'S-90218', packId: 'PK-3821', startSoc:  8, endSoc: 100, durationMins: 22, energyConsumedKwh: 166, energySoldKwh: 148, date: '08 Jun, 19:42', status: 'success'     },
    { sessionId: 'S-90201', packId: 'PK-5102', startSoc: 31, endSoc: 100, durationMins: 14, energyConsumedKwh: 121, energySoldKwh: 108, date: '08 Jun, 14:05', status: 'success'     },
    { sessionId: 'S-90187', packId: 'PK-4471', startSoc: 15, endSoc: 100, durationMins: 20, energyConsumedKwh: 155, energySoldKwh: 138, date: '08 Jun, 08:33', status: 'success'     },
    { sessionId: 'S-90172', packId: 'PK-3821', startSoc: 19, endSoc: 100, durationMins: 17, energyConsumedKwh: 138, energySoldKwh: 123, date: '07 Jun, 20:11', status: 'success'     },
  ],
  '002': [
    { sessionId: 'S-90229', packId: 'PK-7731', startSoc: 18, endSoc:  47, durationMins:  6, energyConsumedKwh:  42, energySoldKwh:  36, date: '09 Jun, 06:55', status: 'failed'      },
    { sessionId: 'S-90214', packId: 'PK-8820', startSoc: 26, endSoc:  26, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '08 Jun, 17:20', status: 'failed'      },
    { sessionId: 'S-90198', packId: 'PK-7731', startSoc: 12, endSoc:  68, durationMins: 13, energyConsumedKwh:  87, energySoldKwh:  77, date: '08 Jun, 11:40', status: 'interrupted' },
    { sessionId: 'S-90183', packId: 'PK-9104', startSoc: 34, endSoc: 100, durationMins: 13, energyConsumedKwh: 115, energySoldKwh: 103, date: '08 Jun, 06:15', status: 'success'     },
    { sessionId: 'S-90168', packId: 'PK-8820', startSoc: 21, endSoc: 100, durationMins: 18, energyConsumedKwh: 140, energySoldKwh: 125, date: '07 Jun, 18:50', status: 'success'     },
  ],
  '003': [
    { sessionId: 'S-90196', packId: 'PK-3301', startSoc: 16, endSoc:  16, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '08 Jun, 07:30', status: 'failed'      },
    { sessionId: 'S-90181', packId: 'PK-4412', startSoc: 29, endSoc:  71, durationMins:  9, energyConsumedKwh:  63, energySoldKwh:  56, date: '07 Jun, 18:10', status: 'interrupted' },
    { sessionId: 'S-90166', packId: 'PK-3301', startSoc: 11, endSoc: 100, durationMins: 22, energyConsumedKwh: 163, energySoldKwh: 146, date: '07 Jun, 12:05', status: 'success'     },
    { sessionId: 'S-90151', packId: 'PK-5508', startSoc: 24, endSoc: 100, durationMins: 17, energyConsumedKwh: 135, energySoldKwh: 121, date: '07 Jun, 07:48', status: 'success'     },
    { sessionId: 'S-90136', packId: 'PK-4412', startSoc: 38, endSoc: 100, durationMins: 12, energyConsumedKwh: 108, energySoldKwh:  97, date: '06 Jun, 19:22', status: 'success'     },
  ],
  '004': [
    { sessionId: 'S-90226', packId: 'PK-2291', startSoc: 20, endSoc: 100, durationMins: 19, energyConsumedKwh: 149, energySoldKwh: 133, date: '09 Jun, 07:50', status: 'success'     },
    { sessionId: 'S-90211', packId: 'PK-3104', startSoc: 14, endSoc: 100, durationMins: 21, energyConsumedKwh: 161, energySoldKwh: 144, date: '08 Jun, 18:30', status: 'success'     },
    { sessionId: 'S-90195', packId: 'PK-2291', startSoc: 25, endSoc:  82, durationMins: 12, energyConsumedKwh:  86, energySoldKwh:  76, date: '08 Jun, 12:15', status: 'interrupted' },
    { sessionId: 'S-90180', packId: 'PK-4883', startSoc: 10, endSoc: 100, durationMins: 23, energyConsumedKwh: 170, energySoldKwh: 151, date: '08 Jun, 07:44', status: 'success'     },
    { sessionId: 'S-90165', packId: 'PK-3104', startSoc: 30, endSoc: 100, durationMins: 14, energyConsumedKwh: 119, energySoldKwh: 106, date: '07 Jun, 19:05', status: 'success'     },
  ],
  '005': [
    { sessionId: 'S-90192', packId: 'PK-6612', startSoc: 23, endSoc:  23, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '07 Jun, 14:55', status: 'failed'      },
    { sessionId: 'S-90177', packId: 'PK-7703', startSoc: 17, endSoc:  52, durationMins:  7, energyConsumedKwh:  51, energySoldKwh:  45, date: '07 Jun, 09:10', status: 'interrupted' },
    { sessionId: 'S-90162', packId: 'PK-6612', startSoc: 32, endSoc:  32, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '06 Jun, 20:30', status: 'failed'      },
    { sessionId: 'S-90147', packId: 'PK-8801', startSoc:  9, endSoc: 100, durationMins: 24, energyConsumedKwh: 174, energySoldKwh: 156, date: '06 Jun, 14:45', status: 'success'     },
    { sessionId: 'S-90132', packId: 'PK-7703', startSoc: 27, endSoc: 100, durationMins: 16, energyConsumedKwh: 129, energySoldKwh: 115, date: '06 Jun, 09:00', status: 'success'     },
  ],
  '006': [
    { sessionId: 'S-90241', packId: 'PK-1192', startSoc: 19, endSoc: 100, durationMins: 19, energyConsumedKwh: 145, energySoldKwh: 130, date: '09 Jun, 10:20', status: 'success'     },
    { sessionId: 'S-90225', packId: 'PK-2283', startSoc: 25, endSoc: 100, durationMins: 16, energyConsumedKwh: 128, energySoldKwh: 115, date: '08 Jun, 21:05', status: 'success'     },
    { sessionId: 'S-90209', packId: 'PK-1192', startSoc: 13, endSoc: 100, durationMins: 21, energyConsumedKwh: 158, energySoldKwh: 141, date: '08 Jun, 15:30', status: 'success'     },
    { sessionId: 'S-90193', packId: 'PK-3374', startSoc: 30, endSoc: 100, durationMins: 14, energyConsumedKwh: 120, energySoldKwh: 107, date: '08 Jun, 09:55', status: 'success'     },
    { sessionId: 'S-90178', packId: 'PK-2283', startSoc: 22, endSoc: 100, durationMins: 18, energyConsumedKwh: 139, energySoldKwh: 124, date: '07 Jun, 21:40', status: 'success'     },
  ],
  '007': [
    { sessionId: 'S-90243', packId: 'PK-5541', startSoc: 21, endSoc: 100, durationMins: 18, energyConsumedKwh: 143, energySoldKwh: 128, date: '09 Jun, 09:35', status: 'success'     },
    { sessionId: 'S-90228', packId: 'PK-6630', startSoc: 15, endSoc: 100, durationMins: 21, energyConsumedKwh: 157, energySoldKwh: 140, date: '08 Jun, 20:10', status: 'success'     },
    { sessionId: 'S-90212', packId: 'PK-5541', startSoc: 28, endSoc: 100, durationMins: 15, energyConsumedKwh: 124, energySoldKwh: 111, date: '08 Jun, 14:25', status: 'success'     },
    { sessionId: 'S-90197', packId: 'PK-7712', startSoc: 11, endSoc: 100, durationMins: 22, energyConsumedKwh: 162, energySoldKwh: 145, date: '08 Jun, 08:50', status: 'success'     },
    { sessionId: 'S-90182', packId: 'PK-6630', startSoc: 33, endSoc: 100, durationMins: 13, energyConsumedKwh: 114, energySoldKwh: 102, date: '07 Jun, 20:15', status: 'success'     },
  ],
}

export const CHARGER_NOTIFICATIONS: ChargerNotification[] = [
  { id: 'cn1', chargerId: 'EXP-C-003', from: 'deration',  to: 'breakdown', time: '08:14' },
  { id: 'cn2', chargerId: 'EXP-C-005', from: 'healthy',   to: 'breakdown', time: '11:22' },
  { id: 'cn3', chargerId: 'EXP-C-004', from: 'healthy',   to: 'deration',  time: '14:35' },
]
