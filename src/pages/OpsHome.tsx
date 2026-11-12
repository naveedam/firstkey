import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import JourneyList from '../components/JourneyList'
import { actionFor } from '../lib/actions'
import { useJourneys } from '../lib/journeys'
import { supabase } from '../lib/supabase'

export default function OpsHome() {
  const { rows, loading, error } = useJourneys()
  const [chosen, setChosen] = useState<{ journey_id: string; purpose: string }[]>([])

  useEffect(() => {
    supabase.from('journey_options').select('journey_id,purpose').eq('status', 'selected')
      .then(({ data }) => setChosen((data ?? []) as { journey_id: string; purpose: string }[]))
  }, [])

  const flags = useMemo(() => {
    const out: Record<string, string> = {}
    for (const r of rows) {
      const a = actionFor(r.stage, chosen.filter(c => c.journey_id === r.id).map(c => c.purpose))
      if (a) out[r.id] = a
    }
    return out
  }, [rows, chosen])

  const waiting = Object.keys(flags).length

  return (
    <Layout title="All relocations">
      {error && <p className="error">{error}</p>}
      {waiting > 0 && <p className="notice">{waiting} {waiting === 1 ? 'relocation needs' : 'relocations need'} your attention.</p>}
      {loading ? <p className="muted">Loading relocations…</p> : (
        <JourneyList
          rows={rows}
          showCompany
          href={r => `/ops/journeys/${r.id}`}
          flags={flags}
          empty="No relocations yet. They appear here when a company's HR team raises a request."
        />
      )}
    </Layout>
  )
}
