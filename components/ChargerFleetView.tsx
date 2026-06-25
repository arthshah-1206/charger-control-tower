'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { CHARGERS } from '@/lib/data'
import type { HealthStatus } from '@/lib/types'
import TopNav, { type HealthFilter } from './TopNav'
import Sidebar, { type View } from './Sidebar'
import ChargerList from './ChargerList'
import ChargerCard from './ChargerCard'
import AnalyticsView from './AnalyticsView'

const ChargerMap = dynamic(() => import('./ChargerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-muted flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 size={20} className="animate-spin text-text-secondary" />
        <span className="text-xs text-text-secondary">Loading map…</span>
      </div>
    </div>
  ),
})

const HEALTH_ORDER: Record<HealthStatus, number> = { breakdown: 0, 'grid-down': 1, deration: 2, healthy: 3 }

export default function ChargerFleetView() {
  const [mainTab, setMainTab] = useState<'fleet' | 'analytics'>('fleet')
  const [currentView, setCurrentView] = useState<View>('map')
  const [activeFilter, setActiveFilter] = useState<HealthFilter>('all')
  const [activeCorridor, setActiveCorridor] = useState('')
  const [activeSite, setActiveSite] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const base = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[–—]/g, '-')
    const q = norm(searchQuery)
    return CHARGERS.filter(c => {
      const matchCorridor = !activeCorridor || c.corridor === activeCorridor
      const matchSite = !activeSite || c.site === activeSite
      const matchSearch = !q
        || norm(c.prefix + c.num).includes(q)
        || norm(c.site).includes(q)
        || norm(c.corridor).includes(q)
      return matchCorridor && matchSite && matchSearch
    })
  }, [activeCorridor, activeSite, searchQuery])

  const filtered = useMemo(() =>
    base.filter(c => activeFilter === 'all' || c.health === activeFilter),
    [base, activeFilter]
  )

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]),
    [filtered]
  )

  const counts: Record<HealthFilter, number> = useMemo(() => ({
    all:          base.length,
    healthy:      base.filter(c => c.health === 'healthy').length,
    deration:     base.filter(c => c.health === 'deration').length,
    breakdown:    base.filter(c => c.health === 'breakdown').length,
    'grid-down':  base.filter(c => c.health === 'grid-down').length,
  }), [base])

  const availableSites = useMemo(() =>
    [...new Set(
      CHARGERS
        .filter(c => !activeCorridor || c.corridor === activeCorridor)
        .map(c => c.site)
    )].sort(),
    [activeCorridor]
  )

  const availableCorridors = useMemo(() =>
    [...new Set(
      CHARGERS
        .filter(c => !activeSite || c.site === activeSite)
        .map(c => c.corridor)
    )].sort(),
    [activeSite]
  )

  const handleCorridorChange = (corridor: string) => {
    setActiveCorridor(corridor)
    if (activeSite) {
      const valid = new Set(
        CHARGERS.filter(c => !corridor || c.corridor === corridor).map(c => c.site)
      )
      if (!valid.has(activeSite)) setActiveSite('')
    }
  }

  const handleSiteChange = (site: string) => {
    setActiveSite(site)
    if (activeCorridor) {
      const valid = new Set(
        CHARGERS.filter(c => !site || c.site === site).map(c => c.corridor)
      )
      if (!valid.has(activeCorridor)) setActiveCorridor('')
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        mainTab={mainTab}
        onMainTabChange={setMainTab}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {mainTab === 'analytics' ? (
          <AnalyticsView />
        ) : (
          <>
            <TopNav
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              activeCorridor={activeCorridor}
              onCorridorChange={handleCorridorChange}
              corridors={availableCorridors}
              activeSite={activeSite}
              onSiteChange={handleSiteChange}
              sites={availableSites}
              counts={counts}
            />

            <main className="flex-1 overflow-hidden flex flex-col">
              {currentView === 'list' ? (
                <ChargerList chargers={sorted} />
              ) : (
                <div className="flex flex-1 overflow-hidden">
                  <div className="w-[380px] shrink-0 border-r border-border flex flex-col overflow-hidden px-4 pt-4">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-3 pb-4 pr-1 -mr-1">
                      {sorted.length === 0 ? (
                        <div className="py-12 text-center text-sm text-text-secondary">
                          No chargers match your filters
                        </div>
                      ) : (
                        sorted.map(c => (
                          <ChargerCard
                            key={c.prefix + c.num}
                            charger={c}
                            isHovered={hoveredId === c.prefix + c.num}
                            onMouseEnter={() => setHoveredId(c.prefix + c.num)}
                            onMouseLeave={() => setHoveredId(null)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                  <ChargerMap chargers={sorted} hoveredId={hoveredId} />
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  )
}
