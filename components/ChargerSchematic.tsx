'use client'

import { useState, useEffect } from 'react'
import { X, Zap, ChevronRight } from 'lucide-react'
import type { HealthStatus } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Metric {
  label: string
  value: string
  unit?: string
  tbd?: boolean
}

interface SubsystemDef {
  id: string
  label: string
  schematicLabel: string
  style?: { left: string; top?: string; bottom?: string; width: string; height?: string }
  external?: boolean   // rendered outside the charger box
  circle?: boolean     // rendered as circle, skipped in main rect loop
  metrics: Metric[]
  gunStatus?: { label: string; value: string }[]
}

interface ChargerFault {
  dtc: string
  name: string
  subsystem: string    // human-readable, shown in table
  subsystemId: string  // used for filtering
  opsImpact: string
  ticketId: string
  reportedAt: string
}

// ── Subsystem layout & metrics ─────────────────────────────────────────────────
// Positions are % of container (aspect-ratio 2.4:1).
// Layout approximates the physical charger top-view: DB top-left, Fluid Skid
// center (visual only), Chillers right-center, Piles bottom-left, Post far right.

// Positions measured from the clean engineering drawing photo.
// Interior aspect ratio ≈ 2.4:1 (image ~1155×483, interior ~1131×469 px).
// Horizontal zones: DB 8-26% | gap 26-35% | Fluid Skid 35-54% | Chillers 55-81% | Post far-right
// Vertical zones:  DB top 5-46% | Piles bottom 62-92% | Chillers split 6-47% / 50-91%
const SUBSYSTEMS: SubsystemDef[] = [
  {
    id: 'db', label: 'Distribution Box', schematicLabel: 'Distribution\nBox',
    style: { left: '8%', top: '5%', width: '15%', height: '35%' },
    metrics: [
      { label: 'Input Voltage',   value: '415', unit: 'V'  },
      { label: 'Phase Balance',   value: '98',  unit: '%'  },
      { label: 'Breaker Temp',    value: '42',  unit: '°C' },
      { label: 'Leakage Current', value: '0.2', unit: 'A'  },
    ],
  },
  {
    id: 'chiller1', label: 'Chiller 1', schematicLabel: 'Chiller 1',
    style: { left: '55%', top: '21%', width: '26%', height: '18%' },
    metrics: [
      { label: 'Setpoint',          value: '22', unit: '°C' },
      { label: 'Actual Temp',       value: '23', unit: '°C' },
      { label: 'Compressor Load',   value: '68', unit: '%'  },
      { label: 'Refrigerant Pres.', value: '—',  tbd: true  },
    ],
  },
  {
    id: 'chiller2', label: 'Chiller 2', schematicLabel: 'Chiller 2',
    style: { left: '55%', top: '46%', width: '26%', height: '18%' },
    metrics: [
      { label: 'Setpoint',          value: '22', unit: '°C' },
      { label: 'Actual Temp',       value: '31', unit: '°C' },
      { label: 'Compressor Load',   value: '95', unit: '%'  },
      { label: 'Refrigerant Pres.', value: '—',  tbd: true  },
    ],
  },
  {
    id: 'fluidSkid', label: 'Fluid Skid', schematicLabel: 'Fluid\nSkid',
    style: { left: '35%', top: '11%', width: '19%', height: '78%' },
    metrics: [
      { label: 'Coolant Temp',   value: '24',  unit: '°C'    },
      { label: 'Coolant Flow',   value: '12.4', unit: 'L/min' },
      { label: 'Fluid Pressure', value: '2.1',  unit: 'bar'   },
      { label: 'Pump Status',    value: '—',    tbd: true      },
    ],
  },
  {
    id: 'pile1', label: 'Pile 1', schematicLabel: 'Pile 1',
    style: { left: '4%', top: '56%', width: '7%', height: '22%' },
    metrics: [
      { label: 'Output Voltage', value: '640', unit: 'V'  },
      { label: 'Output Current', value: '312', unit: 'A'  },
      { label: 'Temperature',    value: '38',  unit: '°C' },
      { label: 'Power Output',   value: '199', unit: 'kW' },
    ],
  },
  {
    id: 'pile2', label: 'Pile 2', schematicLabel: 'Pile 2',
    style: { left: '11%', top: '56%', width: '7%', height: '22%' },
    metrics: [
      { label: 'Output Voltage', value: '580', unit: 'V'  },
      { label: 'Output Current', value: '210', unit: 'A'  },
      { label: 'Temperature',    value: '61',  unit: '°C' },
      { label: 'Power Output',   value: '121', unit: 'kW' },
    ],
  },
  {
    id: 'pile3', label: 'Pile 3', schematicLabel: 'Pile 3',
    style: { left: '18%', top: '56%', width: '7%', height: '22%' },
    metrics: [
      { label: 'Output Voltage', value: '—' },
      { label: 'Output Current', value: '—' },
      { label: 'Temperature',    value: '—' },
      { label: 'Power Output',   value: '—' },
    ],
  },
  {
    id: 'dispenser', label: 'Dispenser', schematicLabel: 'Dispenser',
    style: { left: '25%', top: '56%', width: '7%', height: '22%' },
    metrics: [
      { label: 'Output Voltage', value: '—', tbd: true },
      { label: 'Output Current', value: '—', tbd: true },
      { label: 'Temperature',    value: '—', tbd: true },
      { label: 'Power Output',   value: '—', tbd: true },
    ],
  },
  {
    id: 'post', label: 'Post', schematicLabel: 'Post',
    style: { left: '65%', top: '76%', width: '27%', height: '13%' },
    metrics: [
      { label: 'Charging Guns', value: '—', tbd: true           },
      { label: 'Fluid Guns',    value: '—', tbd: true           },
      { label: 'Coolant Flow',  value: '12.4', unit: 'L/min'   },
      { label: 'Fluid Pressure', value: '2.1',  unit: 'bar'    },
    ],
    gunStatus: [
      { label: 'Gun 1',      value: 'Connected'    },
      { label: 'Gun 2',      value: 'Connected'    },
      { label: 'Gun 3',      value: 'Disconnected' },
      { label: 'Fluid Gun 1', value: 'Connected'   },
      { label: 'Fluid Gun 2', value: 'Connected'   },
    ],
  },
  {
    id: 'gun1', label: 'Gun 1', schematicLabel: 'G1', circle: true,
    style: { left: '68%', bottom: '2%', width: '4%' },
    metrics: [
      { label: 'Status',         value: 'Connected'  },
      { label: 'Output Voltage', value: '640', unit: 'V'  },
      { label: 'Output Current', value: '312', unit: 'A'  },
      { label: 'Temperature',    value: '38',  unit: '°C' },
    ],
  },
  {
    id: 'gun2', label: 'Gun 2', schematicLabel: 'G2', circle: true,
    style: { left: '77%', bottom: '2%', width: '4%' },
    metrics: [
      { label: 'Status',         value: 'Connected'  },
      { label: 'Output Voltage', value: '580', unit: 'V'  },
      { label: 'Output Current', value: '210', unit: 'A'  },
      { label: 'Temperature',    value: '45',  unit: '°C' },
    ],
  },
  {
    id: 'gun3', label: 'Gun 3', schematicLabel: 'G3', circle: true,
    style: { left: '86%', bottom: '2%', width: '4%' },
    metrics: [
      { label: 'Status',         value: 'Disconnected' },
      { label: 'Output Voltage', value: '—' },
      { label: 'Output Current', value: '—' },
      { label: 'Temperature',    value: '—' },
    ],
  },
  {
    id: 'grid', label: 'Grid', schematicLabel: 'Grid',
    external: true,
    metrics: [
      { label: 'Input Voltage',  value: '415',  unit: 'V'   },
      { label: 'Frequency',      value: '50.1', unit: 'Hz'  },
      { label: 'Phase Balance',  value: '99',   unit: '%'   },
      { label: 'Power Factor',   value: '0.98'              },
    ],
  },
]

// ── Per-charger subsystem health ───────────────────────────────────────────────

const CHARGER_HEALTH: Record<string, Record<string, HealthStatus>> = {
  '001': { db: 'healthy',   chiller1: 'healthy',   chiller2: 'healthy',   fluidSkid: 'healthy',   pile1: 'healthy',   pile2: 'healthy',   pile3: 'healthy',    dispenser: 'healthy',   post: 'healthy',   gun1: 'healthy',   gun2: 'healthy',   gun3: 'healthy',   grid: 'healthy'   },
  '002': { db: 'healthy',   chiller1: 'healthy',   chiller2: 'healthy',   fluidSkid: 'healthy',   pile1: 'healthy',   pile2: 'healthy',   pile3: 'healthy',    dispenser: 'healthy',   post: 'healthy',   gun1: 'healthy',   gun2: 'healthy',   gun3: 'healthy',   grid: 'healthy'   },
  '003': { db: 'healthy',   chiller1: 'healthy',   chiller2: 'healthy',   fluidSkid: 'deration',  pile1: 'healthy',   pile2: 'healthy',   pile3: 'breakdown',  dispenser: 'healthy',   post: 'breakdown', gun1: 'healthy',   gun2: 'breakdown', gun3: 'healthy',   grid: 'healthy'   },
  '004': { db: 'healthy',   chiller1: 'healthy',   chiller2: 'deration',  fluidSkid: 'deration',  pile1: 'healthy',   pile2: 'deration',  pile3: 'healthy',    dispenser: 'deration',  post: 'healthy',   gun1: 'healthy',   gun2: 'deration',  gun3: 'healthy',   grid: 'healthy'   },
  '005': { db: 'healthy',   chiller1: 'breakdown', chiller2: 'breakdown', fluidSkid: 'breakdown', pile1: 'breakdown', pile2: 'healthy',   pile3: 'healthy',    dispenser: 'breakdown', post: 'breakdown', gun1: 'breakdown', gun2: 'healthy',   gun3: 'breakdown', grid: 'breakdown' },
  '006': { db: 'healthy',   chiller1: 'healthy',   chiller2: 'healthy',   fluidSkid: 'healthy',   pile1: 'healthy',   pile2: 'healthy',   pile3: 'healthy',    dispenser: 'healthy',   post: 'healthy',   gun1: 'healthy',   gun2: 'healthy',   gun3: 'healthy',   grid: 'healthy'   },
  '007': { db: 'healthy',   chiller1: 'healthy',   chiller2: 'healthy',   fluidSkid: 'healthy',   pile1: 'healthy',   pile2: 'healthy',   pile3: 'healthy',    dispenser: 'healthy',   post: 'healthy',   gun1: 'healthy',   gun2: 'healthy',   gun3: 'healthy',   grid: 'healthy'   },
}

// ── Fault data ─────────────────────────────────────────────────────────────────

const ACTIVE_FAULTS: Record<string, ChargerFault[]> = {
  '003': [
    { dtc: '0x05 20', name: 'Post Contactor Weld Fault',       subsystem: 'Post',       subsystemId: 'post',      opsImpact: 'Breakdown', ticketId: 'SVC-2026-0842', reportedAt: '04 Jun 2026, 09:14' },
    { dtc: '0x03 12', name: 'Pile 3 IGBT Over-temperature',    subsystem: 'Pile 3',     subsystemId: 'pile3',     opsImpact: 'Breakdown', ticketId: 'SVC-2026-0841', reportedAt: '04 Jun 2026, 08:52' },
    { dtc: '0x02 01', name: 'Fluid Skid Flow Rate Low',        subsystem: 'Fluid Skid', subsystemId: 'fluidSkid', opsImpact: 'Deration',  ticketId: 'SVC-2026-0839', reportedAt: '03 Jun 2026, 14:52' },
  ],
  '004': [
    { dtc: '0x01 08', name: 'Chiller 2 Refrigerant Pressure',  subsystem: 'Chiller 2',  subsystemId: 'chiller2',  opsImpact: 'Deration',  ticketId: 'SVC-2026-0847', reportedAt: '04 Jun 2026, 14:35' },
    { dtc: '0x02 14', name: 'Fluid Skid Pump Speed Deviation', subsystem: 'Fluid Skid', subsystemId: 'fluidSkid', opsImpact: 'Deration',  ticketId: 'SVC-2026-0848', reportedAt: '03 Jun 2026, 14:22' },
  ],
  '005': [
    { dtc: '0x01 01', name: 'Chiller 1 Compressor Fault',      subsystem: 'Chiller 1',  subsystemId: 'chiller1',  opsImpact: 'Breakdown', ticketId: 'SVC-2026-0851', reportedAt: '04 Jun 2026, 11:22' },
    { dtc: '0x01 02', name: 'Chiller 2 Compressor Fault',      subsystem: 'Chiller 2',  subsystemId: 'chiller2',  opsImpact: 'Breakdown', ticketId: 'SVC-2026-0852', reportedAt: '04 Jun 2026, 11:22' },
    { dtc: '0x04 01', name: 'Pile 1 DC Bus Undervoltage',      subsystem: 'Pile 1',     subsystemId: 'pile1',     opsImpact: 'Breakdown', ticketId: 'SVC-2026-0853', reportedAt: '04 Jun 2026, 09:50' },
  ],
}

const HISTORY_FAULTS: Record<string, ChargerFault[]> = {
  '003': [
    { dtc: '0x00 50', name: 'IoT Comms Timeout',       subsystem: 'Global',           subsystemId: 'global', opsImpact: 'No Impact', ticketId: 'SVC-2026-0822', reportedAt: '02 Jun 2026, 14:10' },
    { dtc: '0x03 11', name: 'Pile 3 Thermal Derating', subsystem: 'Pile 3',           subsystemId: 'pile3',  opsImpact: 'Deration',  ticketId: 'SVC-2026-0815', reportedAt: '01 Jun 2026, 11:05' },
  ],
  '004': [
    { dtc: '0x01 10', name: 'DB Phase Imbalance',      subsystem: 'Distribution Box', subsystemId: 'db',     opsImpact: 'No Impact', ticketId: 'SVC-2026-0801', reportedAt: '28 May 2026, 09:45' },
  ],
  '005': [
    { dtc: '0x05 21', name: 'Post Insulation Resistance Low', subsystem: 'Post',  subsystemId: 'post',   opsImpact: 'Breakdown', ticketId: 'SVC-2026-0830', reportedAt: '30 May 2026, 16:22' },
    { dtc: '0x00 50', name: 'IoT Comms Timeout',       subsystem: 'Global',       subsystemId: 'global', opsImpact: 'No Impact', ticketId: 'SVC-2026-0818', reportedAt: '28 May 2026, 10:30' },
  ],
}

// ── Visual style maps ──────────────────────────────────────────────────────────

const HEALTH_BG: Record<HealthStatus, string> = {
  healthy:    'bg-emerald-100 border-emerald-300',
  deration:   'bg-amber-100  border-amber-300',
  breakdown:  'bg-red-100    border-red-300',
  'grid-down': 'bg-sky-100   border-sky-300',
}
const HEALTH_TEXT: Record<HealthStatus, string> = {
  healthy:    'text-emerald-900',
  deration:   'text-amber-900',
  breakdown:  'text-red-900',
  'grid-down': 'text-sky-900',
}
const HEALTH_DOT: Record<HealthStatus, string> = {
  healthy:    'bg-emerald-500',
  deration:   'bg-amber-400',
  breakdown:  'bg-red-500',
  'grid-down': 'bg-sky-500',
}
const opsImpactCls = (impact: string) =>
  impact === 'Breakdown' ? 'bg-red-50 text-red-700'
  : impact === 'Deration' ? 'bg-amber-50 text-amber-700'
  : 'bg-neutral-100 text-neutral-600'

// ── Fault tree ─────────────────────────────────────────────────────────────────

interface FaultComponent {
  id: string
  label: string
  status: HealthStatus
  detail?: string
}
interface FaultEquipment {
  id: string
  label: string
  status: HealthStatus
  components: FaultComponent[]
}

const PILE_EQ: FaultEquipment[] = [
  { id: 'power_module',   label: 'Power Module',   status: 'healthy', components: [
    { id: 'igbt_module',  label: 'IGBT Module',    status: 'healthy' },
    { id: 'gate_driver',  label: 'Gate Driver',    status: 'healthy' },
  ]},
  { id: 'energy_storage', label: 'Energy Storage', status: 'healthy', components: [
    { id: 'dc_capacitor', label: 'DC Bus Capacitor',  status: 'healthy' },
    { id: 'precharge',    label: 'Pre-charge Circuit', status: 'healthy' },
  ]},
  { id: 'pile_protection', label: 'Protection',    status: 'healthy', components: [
    { id: 'overcurrent_protection', label: 'Overcurrent Protection', status: 'healthy' },
    { id: 'thermal_protection',     label: 'Thermal Protection',     status: 'healthy' },
  ]},
]

const CHILLER_EQ: FaultEquipment[] = [
  { id: 'compressor', label: 'Compressor',  status: 'healthy', components: [
    { id: 'compressor_motor',    label: 'Compressor Motor',    status: 'healthy' },
    { id: 'refrigerant_circuit', label: 'Refrigerant Circuit', status: 'healthy' },
  ]},
  { id: 'condenser',  label: 'Condenser',   status: 'healthy', components: [
    { id: 'condenser_fan',  label: 'Condenser Fan',  status: 'healthy' },
    { id: 'condenser_coil', label: 'Condenser Coil', status: 'healthy' },
  ]},
  { id: 'controls',   label: 'Controls',    status: 'healthy', components: [
    { id: 'thermostat',      label: 'Thermostat',      status: 'healthy' },
    { id: 'pressure_switch', label: 'Pressure Switch', status: 'healthy' },
  ]},
]

const GUN_EQ: FaultEquipment[] = [
  { id: 'connector',  label: 'Connector',  status: 'healthy', components: [
    { id: 'contact_pins',   label: 'Contact Pins',      status: 'healthy' },
    { id: 'locking_mech',   label: 'Locking Mechanism', status: 'healthy' },
  ]},
  { id: 'electronics', label: 'Electronics', status: 'healthy', components: [
    { id: 'pp_resistor', label: 'PP Resistor', status: 'healthy' },
    { id: 'cp_circuit',  label: 'CP Circuit',  status: 'healthy' },
  ]},
  { id: 'gun_cooling', label: 'Cooling',    status: 'healthy', components: [
    { id: 'cooling_jacket',  label: 'Liquid Cooling Jacket', status: 'healthy' },
    { id: 'gun_temp_sensor', label: 'Temp Sensor',           status: 'healthy' },
  ]},
]

const FAULT_TREE_TEMPLATE: Record<string, FaultEquipment[]> = {
  db: [
    { id: 'incoming_supply', label: 'Incoming Supply',    status: 'healthy', components: [
      { id: 'main_breaker', label: 'Main Breaker',              status: 'healthy' },
      { id: 'elp',          label: 'Earth Leakage Protection',  status: 'healthy' },
    ]},
    { id: 'bus_bar',  label: 'Bus Bar Assembly', status: 'healthy', components: [
      { id: 'phase_a', label: 'Phase A Bus', status: 'healthy' },
      { id: 'phase_b', label: 'Phase B Bus', status: 'healthy' },
      { id: 'phase_c', label: 'Phase C Bus', status: 'healthy' },
    ]},
    { id: 'protection', label: 'Protection Relays', status: 'healthy', components: [
      { id: 'overcurrent_relay', label: 'Overcurrent Relay', status: 'healthy' },
      { id: 'earth_fault_relay', label: 'Earth Fault Relay', status: 'healthy' },
    ]},
  ],
  fluidSkid: [
    { id: 'pump_assembly',  label: 'Pump Assembly',   status: 'healthy', components: [
      { id: 'coolant_pump', label: 'Coolant Pump', status: 'healthy' },
      { id: 'motor_drive',  label: 'Motor Drive',  status: 'healthy' },
    ]},
    { id: 'heat_exchanger', label: 'Heat Exchanger', status: 'healthy', components: [
      { id: 'hx_core',     label: 'HX Core',     status: 'healthy' },
      { id: 'inlet_valve', label: 'Inlet Valve', status: 'healthy' },
    ]},
    { id: 'fs_sensors', label: 'Sensors', status: 'healthy', components: [
      { id: 'temp_sensor',     label: 'Temp Sensor',     status: 'healthy' },
      { id: 'pressure_sensor', label: 'Pressure Sensor', status: 'healthy' },
      { id: 'flow_meter',      label: 'Flow Meter',      status: 'healthy' },
    ]},
  ],
  chiller1: CHILLER_EQ, chiller2: CHILLER_EQ,
  pile1: PILE_EQ, pile2: PILE_EQ, pile3: PILE_EQ,
  dispenser: [
    { id: 'charging_interface', label: 'Charging Interface', status: 'healthy', components: [
      { id: 'connector_lock', label: 'Connector Lock',      status: 'healthy' },
      { id: 'comm_module',    label: 'Communication Module', status: 'healthy' },
    ]},
    { id: 'power_path', label: 'Power Path', status: 'healthy', components: [
      { id: 'output_contactor', label: 'Output Contactor', status: 'healthy' },
      { id: 'current_sensor',   label: 'Current Sensor',   status: 'healthy' },
    ]},
    { id: 'safety', label: 'Safety Systems', status: 'healthy', components: [
      { id: 'estop', label: 'Emergency Stop',     status: 'healthy' },
      { id: 'gfm',   label: 'Ground Fault Monitor', status: 'healthy' },
    ]},
  ],
  post: [
    { id: 'power_dist', label: 'Power Distribution', status: 'healthy', components: [
      { id: 'output_bus',       label: 'Output Bus',       status: 'healthy' },
      { id: 'cable_management', label: 'Cable Management', status: 'healthy' },
    ]},
    { id: 'post_comm', label: 'Communication', status: 'healthy', components: [
      { id: 'controller_unit',    label: 'Controller Unit',    status: 'healthy' },
      { id: 'network_interface',  label: 'Network Interface',  status: 'healthy' },
    ]},
    { id: 'cooling_interface', label: 'Cooling Interface', status: 'healthy', components: [
      { id: 'coolant_manifold', label: 'Coolant Manifold', status: 'healthy' },
      { id: 'post_flow_sensor', label: 'Flow Sensor',      status: 'healthy' },
    ]},
  ],
  gun1: GUN_EQ, gun2: GUN_EQ, gun3: GUN_EQ,
  grid: [
    { id: 'supply',   label: 'Grid Supply', status: 'healthy', components: [
      { id: 'incoming_voltage', label: 'Incoming Voltage', status: 'healthy' },
      { id: 'phase_balance',    label: 'Phase Balance',    status: 'healthy' },
    ]},
    { id: 'metering', label: 'Metering',    status: 'healthy', components: [
      { id: 'energy_meter',  label: 'Energy Meter',           status: 'healthy' },
      { id: 'power_quality', label: 'Power Quality Analyzer', status: 'healthy' },
    ]},
  ],
}

type CompOverride = { status: HealthStatus; detail?: string }
const FAULT_OVERRIDES: Record<string, Record<string, Record<string, CompOverride>>> = {
  '003': {
    pile3:     { igbt_module:  { status: 'breakdown', detail: 'Gate fault detected'    } },
    post:      { output_bus:   { status: 'breakdown', detail: 'Supply interrupted'     } },
    fluidSkid: { coolant_pump: { status: 'deration',  detail: 'Flow reduced 30%'       } },
  },
  '004': {
    chiller2:  { compressor_motor:   { status: 'deration', detail: 'Temp 31°C vs setpoint 22°C'  } },
    pile2:     { thermal_protection: { status: 'deration', detail: 'Thermal derating active'      } },
    fluidSkid: { flow_meter:         { status: 'deration', detail: 'Reading unstable'             } },
    dispenser: { output_contactor:   { status: 'deration', detail: 'Contact resistance elevated'  } },
  },
  '005': {
    chiller1:  { compressor_motor: { status: 'breakdown', detail: 'Compressor fault'     },
                 condenser_fan:    { status: 'breakdown', detail: 'Fan motor failed'      } },
    chiller2:  { compressor_motor: { status: 'breakdown', detail: 'Compressor fault'     } },
    pile1:     { igbt_module:      { status: 'breakdown', detail: 'Comm timeout'         } },
    post:      { output_bus:       { status: 'breakdown', detail: 'Grid supply lost'     } },
    gun1:      { contact_pins:     { status: 'breakdown', detail: 'Contact resistance high' } },
    gun3:      { cp_circuit:       { status: 'breakdown', detail: 'CP signal lost'       } },
    grid:      { incoming_voltage: { status: 'breakdown', detail: 'Supply interrupted'   } },
  },
}

function getFaultTree(chargerNum: string, subsystemId: string): FaultEquipment[] {
  const template = FAULT_TREE_TEMPLATE[subsystemId]
  if (!template) return []
  const overrides = FAULT_OVERRIDES[chargerNum]?.[subsystemId] ?? {}
  return template.map(equip => {
    const components = equip.components.map(comp => ({
      ...comp,
      ...(overrides[comp.id] ?? {}),
    }))
    const worst = components.some(c => c.status === 'breakdown') ? 'breakdown'
                : components.some(c => c.status === 'deration')  ? 'deration'
                : 'healthy'
    return { ...equip, status: worst as HealthStatus, components }
  })
}

const HEALTH_PILL_CLS: Record<HealthStatus, string> = {
  healthy:    'bg-emerald-100 text-emerald-700',
  deration:   'bg-amber-100   text-amber-700',
  breakdown:  'bg-red-100     text-red-700',
  'grid-down': 'bg-sky-100    text-sky-700',
}
const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy', deration: 'Deration', breakdown: 'Breakdown', 'grid-down': 'On DG',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ChargerSchematic({ chargerNum }: { chargerNum: string }) {
  const [selectedId,        setSelectedId]        = useState<string | null>(null)
  const [faultTab,          setFaultTab]          = useState<'active' | 'history'>('active')
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!selectedId) { setExpandedEquipment(new Set()); return }
    const tree = getFaultTree(chargerNum, selectedId)
    setExpandedEquipment(new Set(tree.filter(e => e.status !== 'healthy').map(e => e.id)))
  }, [selectedId, chargerNum])

  const healthMap     = CHARGER_HEALTH[chargerNum]    ?? CHARGER_HEALTH['001']
  const dgOn          = healthMap['grid'] === 'breakdown'
  const connectorColor = dgOn ? 'border-amber-400' : 'border-emerald-400'
  const activeFaults  = ACTIVE_FAULTS[chargerNum]     ?? []
  const historyFaults = HISTORY_FAULTS[chargerNum]    ?? []
  const allFaults     = faultTab === 'active' ? activeFaults : historyFaults
  const visibleFaults = selectedId
    ? allFaults.filter(f => f.subsystemId === selectedId)
    : allFaults

  const selected = SUBSYSTEMS.find(s => s.id === selectedId) ?? null

  return (
    <>
      {/* ── Schematic ── */}
      <div className="px-5 py-4 border-b border-border">
        {/* Outer wrapper — top padding creates space for Grid badge above the charger boundary */}
        <div className="relative" style={{ paddingTop: 40 }}>

          {/* Grid + DG pills — above DB (DB center-x = 15.5%) */}
          <div
            className="absolute z-10 flex items-center gap-1.5 -translate-x-1/2"
            style={{ top: 2, left: '15.5%' }}
          >
            <button
              onClick={() => setSelectedId(prev => prev === 'grid' ? null : 'grid')}
              className={[
                'inline-flex items-center gap-1.5 px-2.5 h-7 border-2 rounded-full text-[9px] font-bold cursor-pointer transition-all',
                HEALTH_BG[healthMap['grid'] ?? 'healthy'],
                HEALTH_TEXT[healthMap['grid'] ?? 'healthy'],
                selectedId === 'grid' ? 'border-foreground shadow-md scale-105' : 'hover:scale-105 hover:shadow-sm',
              ].join(' ')}
            >
              <Zap size={9} />
              Grid
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${HEALTH_DOT[healthMap['grid'] ?? 'healthy']}`} />
            </button>

            <div className={[
              'inline-flex items-center gap-1.5 px-2.5 h-7 border-2 rounded-full text-[9px] font-bold select-none',
              dgOn
                ? 'bg-amber-100 border-amber-400 text-amber-800'
                : 'bg-neutral-100 border-neutral-300 text-neutral-400',
            ].join(' ')}>
              DG
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dgOn ? 'bg-amber-500' : 'bg-neutral-300'}`} />
              <span className="text-[8px] font-normal">{dgOn ? 'On' : 'Off'}</span>
            </div>
          </div>

          {/* Connector: from below pills (≈30px) down to schematic top edge */}
          <div
            className={`absolute border-l border-dashed pointer-events-none ${connectorColor}`}
            style={{ left: '15.5%', top: 30, bottom: 0 }}
          />

          {/* Charger interior */}
          <div
            className="relative w-full rounded-lg overflow-hidden bg-neutral-100"
            style={{ aspectRatio: '2.4 / 1' }}
          >
            {/* Connector inside schematic: top edge → into DB center */}
            <div
              className={`absolute border-l border-dashed pointer-events-none ${connectorColor}`}
              style={{ left: '15.5%', top: 0, height: '23%' }}
            />

            {/* Clickable subsystems — rectangles */}
            {SUBSYSTEMS.filter(s => !s.external && !s.circle).map(s => {
              const health     = healthMap[s.id] ?? 'healthy'
              const isSelected = selectedId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(prev => prev === s.id ? null : s.id)}
                  style={s.style}
                  className={[
                    'absolute rounded-md border-2 flex flex-col items-center justify-center focus:outline-none',
                    'transition-all duration-150 cursor-pointer',
                    HEALTH_BG[health],
                    isSelected
                      ? 'border-foreground shadow-md z-10 scale-[1.04]'
                      : 'hover:scale-[1.04] hover:shadow-sm hover:z-10',
                  ].join(' ')}
                >
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full shrink-0 ${HEALTH_DOT[health]}`} />
                  <span className={`text-[11px] font-bold text-center px-1 leading-snug whitespace-pre-line ${HEALTH_TEXT[health]}`}>
                    {s.schematicLabel}
                  </span>
                </button>
              )
            })}

            {/* Gun circles — below Post, clickable with RAG status */}
            {SUBSYSTEMS.filter(s => s.circle).map(s => {
              const health     = healthMap[s.id] ?? 'healthy'
              const isSelected = selectedId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(prev => prev === s.id ? null : s.id)}
                  style={{ ...s.style, bottom: '1%', aspectRatio: '1' }}
                  className={[
                    'absolute rounded-full border-2 flex items-center justify-center focus:outline-none',
                    'transition-all duration-150 cursor-pointer',
                    HEALTH_BG[health],
                    isSelected
                      ? 'border-foreground shadow-md z-10 scale-[1.1]'
                      : 'hover:scale-[1.1] hover:shadow-sm hover:z-10',
                  ].join(' ')}
                >
                  <span className={`text-[9px] font-bold leading-none ${HEALTH_TEXT[health]}`}>
                    {s.schematicLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── Subsystem detail — replaces hint when selected ── */}
      <div className="px-5 py-4 border-b border-border bg-muted/20">
        {!selected ? (
          <p className="text-center text-xs text-text-secondary">
            Select a subsystem above to see details
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${HEALTH_DOT[healthMap[selected.id] ?? 'healthy']}`} />
                <span className="text-xs font-semibold">{selected.label}</span>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1 rounded text-text-secondary hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={13} />
              </button>
            </div>
            {(() => {
              const tree = getFaultTree(chargerNum, selected.id)
              if (!tree.length) return null
              return (
                <div className="space-y-1">
                  {tree.map(equip => {
                    const expanded = expandedEquipment.has(equip.id)
                    const toggle = () => setExpandedEquipment(prev => {
                      const next = new Set(prev)
                      expanded ? next.delete(equip.id) : next.add(equip.id)
                      return next
                    })
                    return (
                      <div key={equip.id} className="rounded-lg overflow-hidden border border-border">
                        <button
                          onClick={toggle}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <ChevronRight size={11} className={`text-text-secondary shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
                          <span className={`w-2 h-2 rounded-full shrink-0 ${HEALTH_DOT[equip.status]}`} />
                          <span className="text-xs font-medium text-foreground">{equip.label}</span>
                        </button>
                        {expanded && (
                          <div className="flex flex-wrap gap-1.5 px-3 pt-1.5 pb-2.5 border-t border-border bg-muted/20">
                            {equip.components.map(comp => (
                              <span key={comp.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-xs text-foreground">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${HEALTH_DOT[comp.status]}`} />
                                {comp.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* ── Fault codes ── */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Fault codes
            </p>
            {selected && (
              <button
                onClick={() => setSelectedId(null)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-foreground/8 text-foreground hover:bg-foreground/12 transition-colors"
              >
                {selected.label}
                <X size={9} />
              </button>
            )}
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(['active', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFaultTab(tab)}
                className={[
                  'flex items-center gap-1.5 h-7 px-3 text-xs font-medium transition-colors cursor-pointer border-r border-border last:border-r-0',
                  faultTab === tab
                    ? 'bg-foreground text-white'
                    : 'bg-background text-text-secondary hover:text-foreground hover:bg-muted',
                ].join(' ')}
              >
                {tab === 'active' ? 'Active' : 'History'}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${faultTab === tab ? 'bg-white/20 text-white' : 'bg-muted text-text-secondary'}`}>
                  {tab === 'active' ? activeFaults.length : historyFaults.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {visibleFaults.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-secondary border border-border rounded-lg">
            No faults
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Reported', 'DTC', 'Fault Name', 'Subsystem', 'Ops Impact', 'Service Ticket'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary px-3.5 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleFaults.map((f, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3.5 py-2.5 text-xs text-foreground whitespace-nowrap">{f.reportedAt}</td>
                    <td className="px-3.5 py-2.5 text-xs text-foreground">{f.dtc}</td>
                    <td className="px-3.5 py-2.5 text-xs text-foreground">{f.name}</td>
                    <td className="px-3.5 py-2.5 text-xs text-foreground">{f.subsystem}</td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${opsImpactCls(f.opsImpact)}`}>
                        {f.opsImpact}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <a href="#" className="text-xs text-blue-500 hover:underline">{f.ticketId} →</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
