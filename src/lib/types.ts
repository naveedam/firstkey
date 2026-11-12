export type Role = 'ops' | 'hr_admin' | 'employee'
export type Payer = 'company' | 'employee' | 'split'
export type Stage =
  | 'requested' | 'approved' | 'landing_booked' | 'checked_in'
  | 'rental_search' | 'shortlisted' | 'lease_signed' | 'moved_in'
  | 'closed' | 'cancelled'

export interface Profile { id: string; company_id: string | null; role: Role; full_name: string | null }

export interface Policy {
  id: string
  company_id: string
  name: string
  landing_stay_covered: boolean
  landing_max_days: number
  landing_max_per_night: number | null
  rental_payer: Payer
  rental_max_monthly: number | null
  approval_above: number | null
}

export interface JourneyRow {
  id: string
  stage: Stage
  landing_payer: Payer
  rental_payer: Payer
  needed_from: string | null
  created_at: string
  employees: { full_name: string; email: string } | null
  companies: { name: string } | null
}

export const PHASES = ['Request', 'Landing stay', 'Home search', 'Settled'] as const

export const STAGE_LABEL: Record<Stage, string> = {
  requested: 'Requested',
  approved: 'Approved',
  landing_booked: 'Landing stay booked',
  checked_in: 'Checked in',
  rental_search: 'Searching for a home',
  shortlisted: 'Homes shortlisted',
  lease_signed: 'Lease signed',
  moved_in: 'Moved in',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

/** Index of the phase a stage belongs to (0-3), or -1 when cancelled. */
export function phaseOf(s: Stage): number {
  switch (s) {
    case 'requested': case 'approved': return 0
    case 'landing_booked': case 'checked_in': return 1
    case 'rental_search': case 'shortlisted': return 2
    case 'lease_signed': case 'moved_in': case 'closed': return 3
    default: return -1
  }
}

export const PAYER_LABEL: Record<Payer, string> = {
  company: 'Company pays',
  employee: 'Employee pays',
  split: 'Shared',
}

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

export const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'
