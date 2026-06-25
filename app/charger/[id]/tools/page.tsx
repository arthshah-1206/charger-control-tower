import { CHARGERS } from '@/lib/data'
import { notFound } from 'next/navigation'
import ChargerToolsView from '@/components/ChargerToolsView'

export default async function ChargerToolsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const charger = CHARGERS.find(c => c.num === id)
  if (!charger) notFound()
  return <ChargerToolsView charger={charger} />
}
