import type { ReactNode } from 'react'
import PhaseTrack from './PhaseTrack'
import { PAYER_LABEL, STAGE_LABEL, fmtDate, type JourneyRow } from '../lib/types'

export default function JourneyList({ rows, showCompany = false, empty }: { rows: JourneyRow[]; showCompany?: boolean; empty: ReactNode }) {
  if (rows.length === 0) return <div className="empty">{empty}</div>
  return (
    <ul className="rows">
      {rows.map(r => (
        <li key={r.id} className="row">
          <div className="who-col">
            <strong>{r.employees?.full_name ?? 'Unknown employee'}</strong>
            <span className="muted">{showCompany ? r.companies?.name : r.employees?.email}</span>
          </div>
          <div className="stage-col">
            <span>{STAGE_LABEL[r.stage]}</span>
            <PhaseTrack stage={r.stage} />
          </div>
          <div className="meta-col">
            <span>Stay starts {fmtDate(r.needed_from)}</span>
            <span className="muted">Landing: {PAYER_LABEL[r.landing_payer]}. Rent: {PAYER_LABEL[r.rental_payer]}.</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
