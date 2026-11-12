import { PHASES, STAGE_LABEL, phaseOf, type Stage } from '../lib/types'

/** Four-segment track showing how far a relocation has progressed. */
export default function PhaseTrack({ stage, labels = false }: { stage: Stage; labels?: boolean }) {
  const at = phaseOf(stage)
  return (
    <div className="track" role="img" aria-label={`${STAGE_LABEL[stage]}. ${at >= 0 ? `Phase ${at + 1} of 4: ${PHASES[at]}` : 'Cancelled'}`}>
      {PHASES.map((p, i) => (
        <div key={p} className="seg">
          <span className={i <= at ? 'fill on' : 'fill'} />
          {labels && <span className={i === at ? 'seg-label now' : 'seg-label'}>{p}</span>}
        </div>
      ))}
    </div>
  )
}
