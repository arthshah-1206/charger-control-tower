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
    { sessionId: 'S-90350', packId: 'PK-4471', startSoc: 14, endSoc: 100, durationMins: 21, energyConsumedKwh: 159, energySoldKwh: 142, date: '25 Jun, 18:40', status: 'success'     },
    { sessionId: 'S-90341', packId: 'PK-3821', startSoc: 22, endSoc: 100, durationMins: 18, energyConsumedKwh: 143, energySoldKwh: 127, date: '25 Jun, 11:15', status: 'success'     },
    { sessionId: 'S-90332', packId: 'PK-5102', startSoc:  9, endSoc: 100, durationMins: 23, energyConsumedKwh: 168, energySoldKwh: 150, date: '25 Jun, 07:02', status: 'success'     },
    { sessionId: 'S-90321', packId: 'PK-4471', startSoc: 27, endSoc: 100, durationMins: 16, energyConsumedKwh: 133, energySoldKwh: 118, date: '24 Jun, 20:55', status: 'success'     },
    { sessionId: 'S-90312', packId: 'PK-3821', startSoc: 18, endSoc: 100, durationMins: 19, energyConsumedKwh: 148, energySoldKwh: 132, date: '24 Jun, 14:30', status: 'success'     },
    { sessionId: 'S-90303', packId: 'PK-5102', startSoc: 31, endSoc: 100, durationMins: 15, energyConsumedKwh: 126, energySoldKwh: 112, date: '24 Jun, 08:10', status: 'success'     },
    { sessionId: 'S-90294', packId: 'PK-4471', startSoc: 12, endSoc: 100, durationMins: 22, energyConsumedKwh: 164, energySoldKwh: 146, date: '23 Jun, 19:20', status: 'success'     },
    { sessionId: 'S-90285', packId: 'PK-3821', startSoc: 25, endSoc:  78, durationMins: 11, energyConsumedKwh:  89, energySoldKwh:  79, date: '23 Jun, 13:45', status: 'interrupted' },
    { sessionId: 'S-90276', packId: 'PK-5102', startSoc: 20, endSoc: 100, durationMins: 17, energyConsumedKwh: 137, energySoldKwh: 122, date: '23 Jun, 07:55', status: 'success'     },
    { sessionId: 'S-90267', packId: 'PK-4471', startSoc: 16, endSoc: 100, durationMins: 20, energyConsumedKwh: 153, energySoldKwh: 136, date: '22 Jun, 21:10', status: 'success'     },
    { sessionId: 'S-90258', packId: 'PK-3821', startSoc: 29, endSoc: 100, durationMins: 14, energyConsumedKwh: 120, energySoldKwh: 107, date: '22 Jun, 15:35', status: 'success'     },
    { sessionId: 'S-90249', packId: 'PK-5102', startSoc: 11, endSoc: 100, durationMins: 21, energyConsumedKwh: 158, energySoldKwh: 140, date: '22 Jun, 09:00', status: 'success'     },
    { sessionId: 'S-90233', packId: 'PK-4471', startSoc: 22, endSoc: 100, durationMins: 18, energyConsumedKwh: 142, energySoldKwh: 126, date: '09 Jun, 08:14', status: 'success'     },
    { sessionId: 'S-90218', packId: 'PK-3821', startSoc:  8, endSoc: 100, durationMins: 22, energyConsumedKwh: 166, energySoldKwh: 148, date: '08 Jun, 19:42', status: 'success'     },
    { sessionId: 'S-90201', packId: 'PK-5102', startSoc: 31, endSoc: 100, durationMins: 14, energyConsumedKwh: 121, energySoldKwh: 108, date: '08 Jun, 14:05', status: 'success'     },
  ],
  '002': [
    { sessionId: 'S-90348', packId: 'PK-7731', startSoc: 20, endSoc:  20, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '25 Jun, 17:30', status: 'failed'      },
    { sessionId: 'S-90339', packId: 'PK-8820', startSoc: 15, endSoc:  15, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '25 Jun, 09:45', status: 'failed'      },
    { sessionId: 'S-90319', packId: 'PK-9104', startSoc: 23, endSoc:  23, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '24 Jun, 16:20', status: 'failed'      },
    { sessionId: 'S-90310', packId: 'PK-7731', startSoc: 18, endSoc:  18, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '24 Jun, 08:55', status: 'failed'      },
    { sessionId: 'S-90292', packId: 'PK-8820', startSoc: 26, endSoc:  26, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '23 Jun, 14:10', status: 'failed'      },
    { sessionId: 'S-90283', packId: 'PK-9104', startSoc: 19, endSoc:  55, durationMins:  7, energyConsumedKwh:  49, energySoldKwh:  43, date: '22 Jun, 20:30', status: 'interrupted' },
    { sessionId: 'S-90229', packId: 'PK-7731', startSoc: 18, endSoc:  47, durationMins:  6, energyConsumedKwh:  42, energySoldKwh:  36, date: '09 Jun, 06:55', status: 'failed'      },
    { sessionId: 'S-90214', packId: 'PK-8820', startSoc: 26, endSoc:  26, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '08 Jun, 17:20', status: 'failed'      },
  ],
  '003': [
    { sessionId: 'S-90346', packId: 'PK-3301', startSoc: 17, endSoc:  17, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '25 Jun, 16:05', status: 'failed'      },
    { sessionId: 'S-90337', packId: 'PK-4412', startSoc: 24, endSoc:  24, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '25 Jun, 08:30', status: 'failed'      },
    { sessionId: 'S-90317', packId: 'PK-5508', startSoc: 21, endSoc:  21, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '24 Jun, 15:45', status: 'failed'      },
    { sessionId: 'S-90308', packId: 'PK-3301', startSoc: 13, endSoc:  41, durationMins:  5, energyConsumedKwh:  38, energySoldKwh:  34, date: '24 Jun, 09:20', status: 'interrupted' },
    { sessionId: 'S-90290', packId: 'PK-4412', startSoc: 28, endSoc:  28, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '23 Jun, 17:00', status: 'failed'      },
    { sessionId: 'S-90281', packId: 'PK-5508', startSoc: 19, endSoc:  19, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '22 Jun, 11:25', status: 'failed'      },
    { sessionId: 'S-90196', packId: 'PK-3301', startSoc: 16, endSoc:  16, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '08 Jun, 07:30', status: 'failed'      },
    { sessionId: 'S-90181', packId: 'PK-4412', startSoc: 29, endSoc:  71, durationMins:  9, energyConsumedKwh:  63, energySoldKwh:  56, date: '07 Jun, 18:10', status: 'interrupted' },
  ],
  '004': [
    { sessionId: 'S-90352', packId: 'PK-2291', startSoc: 16, endSoc: 100, durationMins: 22, energyConsumedKwh: 160, energySoldKwh: 140, date: '25 Jun, 19:15', status: 'success'     },
    { sessionId: 'S-90343', packId: 'PK-3104', startSoc: 24, endSoc:  88, durationMins: 14, energyConsumedKwh: 102, energySoldKwh:  89, date: '25 Jun, 12:40', status: 'interrupted' },
    { sessionId: 'S-90334', packId: 'PK-4883', startSoc: 19, endSoc: 100, durationMins: 20, energyConsumedKwh: 151, energySoldKwh: 132, date: '25 Jun, 06:55', status: 'success'     },
    { sessionId: 'S-90323', packId: 'PK-2291', startSoc: 28, endSoc: 100, durationMins: 17, energyConsumedKwh: 135, energySoldKwh: 118, date: '24 Jun, 21:10', status: 'success'     },
    { sessionId: 'S-90314', packId: 'PK-3104', startSoc: 11, endSoc: 100, durationMins: 23, energyConsumedKwh: 168, energySoldKwh: 147, date: '24 Jun, 14:50', status: 'success'     },
    { sessionId: 'S-90296', packId: 'PK-4883', startSoc: 22, endSoc:  74, durationMins: 10, energyConsumedKwh:  76, energySoldKwh:  66, date: '23 Jun, 18:35', status: 'interrupted' },
    { sessionId: 'S-90287', packId: 'PK-2291', startSoc: 17, endSoc: 100, durationMins: 21, energyConsumedKwh: 157, energySoldKwh: 137, date: '22 Jun, 20:00', status: 'success'     },
    { sessionId: 'S-90226', packId: 'PK-2291', startSoc: 20, endSoc: 100, durationMins: 19, energyConsumedKwh: 149, energySoldKwh: 133, date: '09 Jun, 07:50', status: 'success'     },
  ],
  '005': [
    { sessionId: 'S-90344', packId: 'PK-6612', startSoc: 22, endSoc:  22, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '25 Jun, 13:20', status: 'failed'      },
    { sessionId: 'S-90335', packId: 'PK-7703', startSoc: 18, endSoc:  18, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '25 Jun, 07:45', status: 'failed'      },
    { sessionId: 'S-90315', packId: 'PK-8801', startSoc: 25, endSoc:  25, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '24 Jun, 17:30', status: 'failed'      },
    { sessionId: 'S-90306', packId: 'PK-6612', startSoc: 14, endSoc:  14, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '23 Jun, 10:15', status: 'failed'      },
    { sessionId: 'S-90278', packId: 'PK-7703', startSoc: 20, endSoc:  20, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '22 Jun, 16:50', status: 'failed'      },
    { sessionId: 'S-90192', packId: 'PK-6612', startSoc: 23, endSoc:  23, durationMins:  0, energyConsumedKwh:   0, energySoldKwh:   0, date: '07 Jun, 14:55', status: 'failed'      },
  ],
  '006': [
    { sessionId: 'S-90354', packId: 'PK-1192', startSoc: 13, endSoc: 100, durationMins: 22, energyConsumedKwh: 162, energySoldKwh: 145, date: '25 Jun, 20:10', status: 'success'     },
    { sessionId: 'S-90345', packId: 'PK-2283', startSoc: 26, endSoc: 100, durationMins: 15, energyConsumedKwh: 125, energySoldKwh: 112, date: '25 Jun, 13:55', status: 'success'     },
    { sessionId: 'S-90336', packId: 'PK-3374', startSoc: 18, endSoc: 100, durationMins: 19, energyConsumedKwh: 147, energySoldKwh: 131, date: '25 Jun, 07:30', status: 'success'     },
    { sessionId: 'S-90325', packId: 'PK-1192', startSoc: 21, endSoc: 100, durationMins: 17, energyConsumedKwh: 136, energySoldKwh: 121, date: '24 Jun, 22:00', status: 'success'     },
    { sessionId: 'S-90316', packId: 'PK-2283', startSoc: 10, endSoc: 100, durationMins: 24, energyConsumedKwh: 174, energySoldKwh: 155, date: '24 Jun, 15:20', status: 'success'     },
    { sessionId: 'S-90298', packId: 'PK-3374', startSoc: 29, endSoc: 100, durationMins: 14, energyConsumedKwh: 119, energySoldKwh: 106, date: '23 Jun, 19:45', status: 'success'     },
    { sessionId: 'S-90289', packId: 'PK-1192', startSoc: 16, endSoc: 100, durationMins: 20, energyConsumedKwh: 152, energySoldKwh: 136, date: '22 Jun, 12:30', status: 'success'     },
    { sessionId: 'S-90241', packId: 'PK-1192', startSoc: 19, endSoc: 100, durationMins: 19, energyConsumedKwh: 145, energySoldKwh: 130, date: '09 Jun, 10:20', status: 'success'     },
  ],
  '007': [
    { sessionId: 'S-90356', packId: 'PK-5541', startSoc: 17, endSoc: 100, durationMins: 20, energyConsumedKwh: 154, energySoldKwh: 138, date: '25 Jun, 21:05', status: 'success'     },
    { sessionId: 'S-90347', packId: 'PK-6630', startSoc: 23, endSoc: 100, durationMins: 16, energyConsumedKwh: 130, energySoldKwh: 116, date: '25 Jun, 14:40', status: 'success'     },
    { sessionId: 'S-90338', packId: 'PK-7712', startSoc: 11, endSoc: 100, durationMins: 22, energyConsumedKwh: 163, energySoldKwh: 145, date: '25 Jun, 08:15', status: 'success'     },
    { sessionId: 'S-90327', packId: 'PK-5541', startSoc: 28, endSoc: 100, durationMins: 14, energyConsumedKwh: 120, energySoldKwh: 107, date: '24 Jun, 19:30', status: 'success'     },
    { sessionId: 'S-90318', packId: 'PK-6630', startSoc: 15, endSoc: 100, durationMins: 21, energyConsumedKwh: 158, energySoldKwh: 141, date: '24 Jun, 11:55', status: 'success'     },
    { sessionId: 'S-90300', packId: 'PK-7712', startSoc: 20, endSoc:  65, durationMins:  9, energyConsumedKwh:  66, energySoldKwh:  58, date: '23 Jun, 20:20', status: 'interrupted' },
    { sessionId: 'S-90291', packId: 'PK-5541', startSoc: 24, endSoc: 100, durationMins: 17, energyConsumedKwh: 138, energySoldKwh: 123, date: '22 Jun, 17:00', status: 'success'     },
    { sessionId: 'S-90243', packId: 'PK-5541', startSoc: 21, endSoc: 100, durationMins: 18, energyConsumedKwh: 143, energySoldKwh: 128, date: '09 Jun, 09:35', status: 'success'     },
  ],
}

export const CHARGER_NOTIFICATIONS: ChargerNotification[] = [
  { id: 'cn1', chargerId: 'EXP-C-003', from: 'deration',  to: 'breakdown', time: '08:14' },
  { id: 'cn2', chargerId: 'EXP-C-005', from: 'healthy',   to: 'breakdown', time: '11:22' },
  { id: 'cn3', chargerId: 'EXP-C-004', from: 'healthy',   to: 'deration',  time: '14:35' },
]
