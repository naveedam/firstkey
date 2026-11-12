import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import JourneyList from '../components/JourneyList'
import { useJourneys } from '../lib/journeys'

export default function HrHome() {
  const { rows, loading, error } = useJourneys()
  return (
    <Layout title="Relocations" action={<Link to="/hr/new" className="primary btn">New request</Link>}>
      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading relocations…</p> : (
        <JourneyList
          rows={rows}
          empty={<>No requests yet. <Link to="/hr/new">Start one for a new joiner.</Link></>}
        />
      )}
    </Layout>
  )
}
