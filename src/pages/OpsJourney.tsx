import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { actionFor } from '../lib/actions'
import {
  KIND_LABEL, OPTION_STATUS_LABEL, STAGE_LABEL, fmtDate, priceLabel,
  type OptionPurpose, type OptionRow, type Prefs, type Property, type Stage,
} from '../lib/types'

interface Detail {
  id: string
  stage: Stage
  needed_from: string | null
  employees: { full_name: string; email: string; from_city: string | null; office_name: string | null; family_size: number } | null
  companies: { name: string } | null
}

const STAGES = Object.keys(STAGE_LABEL) as Stage[]

export default function OpsJourney() {
  const { id } = useParams()
  const [j, setJ] = useState<Detail | null>(null)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [options, setOptions] = useState<OptionRow[]>([])
  const [props, setProps] = useState<Property[]>([])
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const [d, p, o, pr] = await Promise.all([
      supabase.from('journeys').select('id,stage,needed_from,employees(full_name,email,from_city,office_name,family_size),companies(name)').eq('id', id!).maybeSingle(),
      supabase.from('preferences').select('*').eq('journey_id', id!).maybeSingle(),
      supabase.from('journey_options').select('id,journey_id,purpose,status,ops_note,properties(*)').eq('journey_id', id!),
      supabase.from('properties').select('*').eq('status', 'approved').order('name'),
    ])
    setJ((d.data as unknown as Detail | null) ?? null)
    setPrefs((p.data as Prefs | null) ?? null)
    setOptions((o.data ?? []) as unknown as OptionRow[])
    setProps((pr.data ?? []) as Property[])
    setLoaded(true)
  }, [id])

  useEffect(() => { load() }, [load])

  async function changeStage(stage: Stage) {
    setError('')
    const { error: err } = await supabase.from('journeys').update({ stage, updated_at: new Date().toISOString() }).eq('id', id!)
    if (err) setError(err.message)
    else load()
  }

  async function propose(propertyId: string, purpose: OptionPurpose) {
    setError('')
    const { error: err } = await supabase.from('journey_options').insert({ journey_id: id, property_id: propertyId, purpose })
    if (err) setError(err.code === '23505' ? 'That property is already proposed for this purpose.' : err.message)
    else load()
  }

  async function withdraw(optionId: string) {
    setError('')
    const { error: err } = await supabase.from('journey_options').delete().eq('id', optionId)
    if (err) setError(err.message)
    else load()
  }

  if (!loaded) return <Layout title="Relocation"><p className="muted">Loading…</p></Layout>
  if (!j) return <Layout title="Relocation"><p className="error">This relocation doesn't exist or you can't see it. <Link to="/ops">Back to all relocations</Link></p></Layout>

  const has = (pid: string, purpose: OptionPurpose) => options.some(o => o.purpose === purpose && o.properties?.id === pid)
  const e = j.employees
  const todo = actionFor(j.stage, options.filter(o => o.status === 'selected').map(o => o.purpose))

  return (
    <Layout title={e?.full_name ?? 'Relocation'} action={<Link to="/ops" className="link">All relocations</Link>}>
      {error && <p className="error" role="alert">{error}</p>}
      {todo && <p className="notice">{todo}</p>}
      <p className="muted">{j.companies?.name}. {e?.email}. Moving from {e?.from_city || 'an unspecified city'}, office {e?.office_name || 'not set'}, {e?.family_size} {e?.family_size === 1 ? 'person' : 'people'}. {j.needed_from ? `Stay starts ${fmtDate(j.needed_from)}.` : 'Start date not set.'}</p>

      <section className="block">
        <h2>Stage</h2>
        <select className="inline" value={j.stage} onChange={ev => changeStage(ev.target.value as Stage)}>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>
      </section>

      <section className="block">
        <h2>What the employee asked for</h2>
        {prefs ? (
          <p>
            {prefs.budget_min || prefs.budget_max ? `Rent budget ${prefs.budget_min ?? 0} to ${prefs.budget_max ?? 'open'}. ` : 'No rent budget given. '}
            {prefs.bhk ? `${prefs.bhk} BHK. ` : ''}
            {prefs.furnished === true ? 'Furnished. ' : prefs.furnished === false ? 'Unfurnished. ' : ''}
            {prefs.max_commute_min ? `Up to ${prefs.max_commute_min} minutes to the office. ` : ''}
            {prefs.areas.length ? `Areas: ${prefs.areas.join(', ')}. ` : ''}
            {prefs.notes ?? ''}
          </p>
        ) : <p className="muted">The employee hasn't filled in their preferences yet.</p>}
      </section>

      <section className="block">
        <h2>Proposed to the employee</h2>
        {options.length === 0 ? <p className="muted">Nothing proposed yet. Add stays and homes below.</p> : (
          <ul className="rows">
            {options.map(o => o.properties && (
              <li key={o.id} className="opt-row">
                <div>
                  <strong>{o.properties.name}</strong>
                  <span className="muted"> {o.purpose === 'landing' ? 'Landing stay' : 'Home'}, {priceLabel(o.properties, o.purpose)}</span>
                </div>
                <span className={`badge ${o.status}`}>{OPTION_STATUS_LABEL[o.status]}</span>
                <button className="link" onClick={() => withdraw(o.id)}>Withdraw</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="block">
        <h2>Approved properties</h2>
        <ul className="rows">
          {props.map(p => (
            <li key={p.id} className="opt-row">
              <div>
                <strong>{p.name}</strong>
                <span className="muted"> {KIND_LABEL[p.kind] ?? p.kind}, {p.locality}</span>
              </div>
              <div className="btns">
                {p.nightly_rate && <button className="ghost" disabled={has(p.id, 'landing')} onClick={() => propose(p.id, 'landing')}>{has(p.id, 'landing') ? 'Proposed as stay' : 'Propose as stay'}</button>}
                {p.monthly_rent && <button className="ghost" disabled={has(p.id, 'rental')} onClick={() => propose(p.id, 'rental')}>{has(p.id, 'rental') ? 'Proposed as home' : 'Propose as home'}</button>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}
