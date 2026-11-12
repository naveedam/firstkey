import Layout from '../components/Layout'
import PhaseTrack from '../components/PhaseTrack'
import { useJourneys } from '../lib/journeys'
import { STAGE_LABEL, fmtDate } from '../lib/types'

export default function EmployeeHome() {
  const { rows, loading, error } = useJourneys()
  const j = rows[0]
  return (
    <Layout title="Your relocation">
      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : !j ? (
        <div className="empty">No relocation is set up for you yet. Your HR team creates one when your joining details are ready.</div>
      ) : (
        <section className="stack wide">
          <p className="lede">{STAGE_LABEL[j.stage]}. Your stay starts {fmtDate(j.needed_from)}.</p>
          <PhaseTrack stage={j.stage} labels />
          <p className="muted">Your housing team will share stay and home options here as they are ready.</p>
        </section>
      )}
    </Layout>
  )
}
