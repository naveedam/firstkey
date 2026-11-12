import type { Stage } from './types'

/** What ops still needs to do, given the stage and which kinds of option the employee has chosen. */
export function actionFor(stage: Stage, chosen: string[]): string | null {
  if (chosen.includes('landing') && (stage === 'requested' || stage === 'approved')) {
    return 'The employee chose a stay. Confirm the booking, then set the stage to Landing stay booked.'
  }
  const leaseDone = ['lease_signed', 'moved_in', 'closed', 'cancelled'].includes(stage)
  if (chosen.includes('rental') && !leaseDone) {
    return 'The employee chose a home. Confirm the lease, then set the stage to Lease signed.'
  }
  return null
}
