import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PhaseTrack from './PhaseTrack'
import { PAYER_LABEL, STAGE_LABEL, fmtDate, type JourneyRow } from '../lib/types'

export default function JourneyList({ rows, showCompany = false, href, empty }: {
  rows: JourneyRow[]; showCompany?: boolean; href?: (r: JourneyRow) => string; empty: ReactNode
}) {
  if (rows.length === 0) return <div className="empty">{empty}</div>
  return (
    <ul className="rows">
      {rows.map(r => {
        const name = r.employees?.full_name ?? 'Unknown employee'
        return (
          <li key={r.id} className="row">
            <div className="who-col">
              <strong>{href ? <Link to={href(r)}>{name}</Link> : name}</strong>
              <span className="muted">{showCompany ? r.companies?.name : r.employees?.email}</span>
            </div>
            <div className="stage-col">
              <span>{STAGE_LABEL[r.stage]}</span>
              <PhaseTrack stage={r.stage} />
            </div>
            <div className="meta-col">
              <span>{r.needed_from ? `Stay starts ${fmtDate(r.needed_from)}` : 'Start date not set'}</span>
              <span className="muted">Landing: {PAYER_LABEL[r.landing_payer]}. Rent: {PAYER_LABEL[r.rental_payer]}.</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
