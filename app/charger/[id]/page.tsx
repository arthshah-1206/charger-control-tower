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
  const prev = idx > 0 ? CHARGERS[idx - 1] : null
  const next = idx < CHARGERS.length - 1 ? CHARGERS[idx + 1] : null
  return <ChargerDetailView charger={CHARGERS[idx]} prev={prev} next={next} />
}
