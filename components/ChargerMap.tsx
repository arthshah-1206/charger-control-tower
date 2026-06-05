'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Charger } from '@/lib/types'

const HEALTH_COLOR = {
  healthy:    '#2a9d54',
  deration:   '#e8a020',
  breakdown:  '#dc2626',
  'grid-down': '#0ea5e9',
} as const

const HEALTH_LABEL = {
  healthy:    'Healthy',
  deration:   'Deration',
  breakdown:  'Breakdown',
  'grid-down': 'On DG',
} as const

const ICON_SIZE = 18

function makeIcon(health: keyof typeof HEALTH_COLOR, hovered: boolean) {
  const color = HEALTH_COLOR[health]
  const border = hovered ? '2.5px solid #111' : '2.5px solid white'
  const scale = hovered ? 'scale(1.25)' : 'scale(1)'
  const html = `<div style="
    width:${ICON_SIZE}px;height:${ICON_SIZE}px;border-radius:4px;
    background:${color};border:${border};
    box-shadow:0 1.5px 5px rgba(0,0,0,0.22);
    transform:${scale};
  "></div>`
  return L.divIcon({
    className: '',
    html,
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
  })
}

export default function ChargerMap({
  chargers,
  hoveredId,
}: {
  chargers: Charger[]
  hoveredId?: string | null
}) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, { center: [14.5, 78.8], zoom: 7, zoomControl: false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap ©CartoDB',
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'topleft' }).addTo(map)
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 50)
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    chargers.forEach(c => {
      const id = c.prefix + c.num
      const hovered = id === hoveredId
      const marker = L.marker([c.lat, c.lng], { icon: makeIcon(c.health, hovered) }).addTo(map)
      markersRef.current.push(marker)
    })
  }, [chargers, hoveredId])

  return (
    <div className="relative flex-1 min-w-0">
      <div ref={elRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 z-[400] bg-background border border-border rounded-lg px-3.5 py-2 flex items-center gap-3.5 text-xs text-neutral-500">
        {(['healthy', 'deration', 'breakdown', 'grid-down'] as const).map(h => (
          <span key={h} className="flex items-center gap-1.5">
            <span className="shrink-0 rounded-[3px]" style={{ width: 10, height: 10, background: HEALTH_COLOR[h] }} />
            {HEALTH_LABEL[h]}
          </span>
        ))}
      </div>
    </div>
  )
}
