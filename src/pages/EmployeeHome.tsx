import { Suspense, lazy, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import Layout from '../components/Layout'
import type { Pin } from '../components/MapView'
import PhaseTrack from '../components/PhaseTrack'
import { useJourneys } from '../lib/journeys'
import { supabase } from '../lib/supabase'
import { KIND_LABEL, OPTION_STATUS_LABEL, STAGE_LABEL, fmtDate, inr, priceLabel, type OptionRow, type OptionStatus } from '../lib/types'

const MapView = lazy(() => import('../components/MapView'))

const pinLabel = (o: OptionRow) =>
  o.properties ? (o.purpose === 'landing' ? `${inr(o.properties.nightly_rate ?? 0)}/night` : `${inr(o.properties.monthly_rent ?? 0)}/mo`) : ''

export default function EmployeeHome() {
  const { rows, loading, error } = useJourneys()
  const j = rows[0]
  const [options, setOptions] = useState<OptionRow[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [pf, setPf] = useState({ budget_min: '', budget_max: '', bhk: '', furnished: '', max_commute_min: '', areas: '', notes: '' })
  const [saved, setSaved] = useState(false)

  const loadAll = useCallback(async () => {
    if (!j) return
    const [o, p] = await Promise.all([
      supabase.from('journey_options').select('id,journey_id,purpose,status,ops_note,properties(*)').eq('journey_id', j.id),
      supabase.from('preferences').select('*').eq('journey_id', j.id).maybeSingle(),
    ])
    setOptions((o.data ?? []) as unknown as OptionRow[])
    if (p.data) {
      const d = p.data as Record<string, unknown>
      setPf({
        budget_min: d.budget_min ? String(d.budget_min) : '', budget_max: d.budget_max ? String(d.budget_max) : '',
        bhk: d.bhk ? String(d.bhk) : '', furnished: d.furnished === true ? 'yes' : d.furnished === false ? 'no' : '',
        max_commute_min: d.max_commute_min ? String(d.max_commute_min) : '',
        areas: ((d.areas as string[]) ?? []).join(', '), notes: (d.notes as string) ?? '',
      })
    }
  }, [j])

  useEffect(() => { loadAll() }, [loadAll])

  async function savePrefs(e: FormEvent) {
    e.preventDefault()
    if (!j) return
    setMsg('')
    const num = (s: string) => (s ? Number(s) : null)
    const { error: err } = await supabase.from('preferences').upsert({
      journey_id: j.id,
      budget_min: num(pf.budget_min), budget_max: num(pf.budget_max), bhk: num(pf.bhk),
      furnished: pf.furnished === 'yes' ? true : pf.furnished === 'no' ? false : null,
      max_commute_min: num(pf.max_commute_min),
      areas: pf.areas.split(',').map(s => s.trim()).filter(Boolean),
      notes: pf.notes.trim() || null,
    })
    if (err) setMsg(err.message)
    else { setSaved(true); setMsg('') }
  }

  async function setStatus(id: string, status: OptionStatus) {
    setMsg('')
    const { error: err } = await supabase.from('journey_options').update({ status }).eq('id', id)
    if (err) setMsg(err.message)
    else loadAll()
  }

  const pins: Pin[] = useMemo(() => options.flatMap(o =>
    o.properties?.lat != null && o.properties.lng != null && o.status !== 'rejected'
      ? [{ id: o.id, lat: o.properties.lat, lng: o.properties.lng, label: pinLabel(o) }] : []), [options])

  const section = (purpose: 'landing' | 'rental', title: string, hint: string) => {
    const list = options.filter(o => o.purpose === purpose && o.properties)
    return (
      <section className="block">
        <h2>{title}</h2>
        {list.length === 0 ? <p className="muted">{hint}</p> : list.map(o => {
          const p = o.properties!
          return (
            <article key={o.id} className={o.id === active ? 'opt active' : 'opt'} onClick={() => setActive(o.id)}>
              <div className="opt-top">
                <strong>{p.name}</strong>
                <span className={`badge ${o.status}`}>{OPTION_STATUS_LABEL[o.status]}</span>
              </div>
              <p className="muted">{KIND_LABEL[p.kind] ?? p.kind}, {p.locality}</p>
              <p>{priceLabel(p, purpose)}</p>
              {o.ops_note && <p className="muted">{o.ops_note}</p>}
              <div className="btns">
                {o.status !== 'selected' && <button className="primary small" onClick={ev => { ev.stopPropagation(); setStatus(o.id, 'selected') }}>Choose this</button>}
                {o.status === 'selected' && <button className="ghost" onClick={ev => { ev.stopPropagation(); setStatus(o.id, 'shortlisted') }}>Change my mind</button>}
                {o.status !== 'rejected' && o.status !== 'selected' && <button className="ghost" onClick={ev => { ev.stopPropagation(); setStatus(o.id, 'rejected') }}>Not for me</button>}
                {o.status === 'rejected' && <button className="ghost" onClick={ev => { ev.stopPropagation(); setStatus(o.id, 'shortlisted') }}>Reconsider</button>}
              </div>
            </article>
          )
        })}
      </section>
    )
  }

  const f = (k: keyof typeof pf) => (e: { target: { value: string } }) => { setSaved(false); setPf({ ...pf, [k]: e.target.value }) }

  return (
    <Layout title="Your relocation">
      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : !j ? (
        <div className="empty">No relocation is set up for you yet. Your HR team creates one when your joining details are ready.</div>
      ) : (
        <>
          <p className="lede">{STAGE_LABEL[j.stage]}. {j.needed_from ? `Your stay starts ${fmtDate(j.needed_from)}.` : "Your stay start date hasn't been set yet."}</p>
          <div className="wide"><PhaseTrack stage={j.stage} labels /></div>
          {msg && <p className="error" role="alert">{msg}</p>}

          <div className="cols">
            <div>
              <section className="block">
                <h2>What you're looking for</h2>
                <form onSubmit={savePrefs} className="grid">
                  <label>Rent budget, from (₹)<input type="number" min={0} value={pf.budget_min} onChange={f('budget_min')} /></label>
                  <label>Rent budget, up to (₹)<input type="number" min={0} value={pf.budget_max} onChange={f('budget_max')} /></label>
                  <label>Bedrooms (BHK)<input type="number" min={0} max={6} value={pf.bhk} onChange={f('bhk')} /></label>
                  <label>Furnishing
                    <select value={pf.furnished} onChange={f('furnished')}>
                      <option value="">No preference</option><option value="yes">Furnished</option><option value="no">Unfurnished</option>
                    </select>
                  </label>
                  <label>Longest commute (minutes)<input type="number" min={0} value={pf.max_commute_min} onChange={f('max_commute_min')} /></label>
                  <label>Preferred areas<input value={pf.areas} onChange={f('areas')} placeholder="Whitefield, Bellandur" /></label>
                  <label className="full">Anything else we should know<input value={pf.notes} onChange={f('notes')} /></label>
                  <div className="actions full"><button className="primary">Save preferences</button>{saved && <span className="muted">Saved.</span>}</div>
                </form>
              </section>
              {section('landing', 'Stays for your first weeks', 'Your housing team will propose places to stay here.')}
              {section('rental', 'Homes to consider', 'Homes will appear here once your housing team has matched them to your preferences.')}
            </div>
            <div className="mapcol">
              <Suspense fallback={<div className="map" />}><MapView pins={pins} activeId={active} onPick={setActive} /></Suspense>
              {pins.length === 0 && <p className="muted">The map fills in as options are proposed.</p>}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
