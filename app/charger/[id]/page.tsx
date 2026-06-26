import { CHARGERS } from '@/lib/data'
import { notFound } from 'next/navigation'
import ChargerDetailView from '@/components/ChargerDetailView'

export default async function ChargerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const idx = CHARGERS.findIndex(c => c.num === id)
  if (idx === -1) notFound()
  return <ChargerDetailView charger={CHARGERS[idx]} />
}
