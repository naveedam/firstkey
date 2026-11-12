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

export type OptionPurpose = 'landing' | 'rental'
export type OptionStatus = 'proposed' | 'shortlisted' | 'selected' | 'rejected'

export interface Property {
  id: string
  name: string
  kind: string
  locality: string | null
  lat: number | null
  lng: number | null
  nightly_rate: number | null
  monthly_rent: number | null
  deposit_months: number | null
  bhk: number | null
  furnished: boolean | null
}

export interface OptionRow {
  id: string
  journey_id: string
  purpose: OptionPurpose
  status: OptionStatus
  ops_note: string | null
  properties: Property | null
}

export interface Prefs {
  budget_min: number | null
  budget_max: number | null
  bhk: number | null
  furnished: boolean | null
  max_commute_min: number | null
  areas: string[]
  notes: string | null
}

export const KIND_LABEL: Record<string, string> = {
  serviced_apartment: 'Serviced apartment',
  hotel: 'Hotel or aparthotel',
  coliving: 'Co-living',
  pg: 'PG',
  furnished_flat: 'Furnished flat',
  unfurnished_flat: 'Unfurnished flat',
}

export const OPTION_STATUS_LABEL: Record<OptionStatus, string> = {
  proposed: 'New',
  shortlisted: 'Considering',
  selected: 'Chosen',
  rejected: 'Not for me',
}

export function priceLabel(p: Property, purpose: OptionPurpose): string {
  if (purpose === 'landing') return p.nightly_rate ? `${inr(p.nightly_rate)} a night` : 'Price on request'
  const rent = p.monthly_rent ? `${inr(p.monthly_rent)} a month` : 'Price on request'
  return p.deposit_months ? `${rent}, ${p.deposit_months} months deposit` : rent
}
