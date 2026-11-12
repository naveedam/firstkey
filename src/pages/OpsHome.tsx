import Layout from '../components/Layout'
import JourneyList from '../components/JourneyList'
import { useJourneys } from '../lib/journeys'

export default function OpsHome() {
  const { rows, loading, error } = useJourneys()
  return (
    <Layout title="All relocations">
      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading relocations…</p> : (
        <JourneyList rows={rows} showCompany empty="No relocations yet. They appear here when a company's HR team raises a request." />
      )}
    </Layout>
  )
}
