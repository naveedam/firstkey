import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { PAYER_LABEL, inr, type Payer, type Policy } from '../lib/types'

interface EmpOption { id: string; full_name: string; email: string }

export default function NewRequest() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const [employees, setEmployees] = useState<EmpOption[]>([])
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [existingId, setExistingId] = useState('')
  const [f, setF] = useState({ full_name: '', email: '', phone: '', from_city: '', office_name: '', joining_date: '', family_size: '1' })
  const [startsOn, setStartsOn] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('employees').select('id,full_name,email').order('full_name'),
      supabase.from('policies').select('*').order('created_at').limit(1).maybeSingle(),
    ]).then(([e, p]) => {
      setEmployees((e.data ?? []) as EmpOption[])
      setPolicy((p.data as Policy | null) ?? null)
      setLoaded(true)
    })
  }, [])

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const landingPayer: Payer = policy?.landing_stay_covered ? 'company' : 'employee'
  const rentalPayer: Payer = policy?.rental_payer ?? 'employee'

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!profile?.company_id || !policy) return
    setBusy(true)
    setError('')

    let employeeId = existingId
    if (mode === 'new') {
      const { data, error: err } = await supabase.from('employees').insert({
        company_id: profile.company_id,
        full_name: f.full_name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone.trim() || null,
        from_city: f.from_city.trim() || null,
        office_name: f.office_name.trim() || null,
        joining_date: f.joining_date || null,
        family_size: Number(f.family_size) || 1,
      }).select('id').single()
      if (err || !data) { setBusy(false); setError(err?.message ?? 'Could not save the employee.'); return }
      employeeId = data.id as string
    }

    const { error: jerr } = await supabase.from('journeys').insert({
      company_id: profile.company_id,
      employee_id: employeeId,
      policy_id: policy.id,
      landing_payer: landingPayer,
      rental_payer: rentalPayer,
      needed_from: startsOn || null,
    })
    setBusy(false)
    if (jerr) { setError(jerr.message); return }
    nav('/hr')
  }

  const canSubmit = Boolean(policy) && Boolean(startsOn) && (mode === 'existing' ? Boolean(existingId) : Boolean(f.full_name.trim() && f.email.trim()))

  return (
    <Layout title="New relocation request">
      {!loaded ? <p className="muted">Loading…</p> : (
        <form onSubmit={submit} className="request">
          <fieldset>
            <legend>Employee</legend>
            <div className="choice">
              <label><input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} /> New joiner</label>
              <label className={employees.length ? '' : 'off'}>
                <input type="radio" checked={mode === 'existing'} disabled={!employees.length} onChange={() => setMode('existing')} /> Already added
              </label>
            </div>
            {mode === 'existing' ? (
              <label>Employee
                <select value={existingId} onChange={e => setExistingId(e.target.value)} required>
                  <option value="">Choose an employee</option>
                  {employees.map(o => <option key={o.id} value={o.id}>{o.full_name} ({o.email})</option>)}
                </select>
              </label>
            ) : (
              <div className="grid">
                <label>Full name<input value={f.full_name} onChange={set('full_name')} required /></label>
                <label>Work email<input type="email" value={f.email} onChange={set('email')} required /></label>
                <label>Phone (optional)<input value={f.phone} onChange={set('phone')} /></label>
                <label>Moving from<input value={f.from_city} onChange={set('from_city')} /></label>
                <label>Office<input value={f.office_name} onChange={set('office_name')} /></label>
                <label>Joining date<input type="date" value={f.joining_date} onChange={set('joining_date')} /></label>
                <label>People moving<input type="number" min={1} value={f.family_size} onChange={set('family_size')} /></label>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>Stay</legend>
            <label className="narrow">Stay starts on<input type="date" value={startsOn} onChange={e => setStartsOn(e.target.value)} required /></label>
          </fieldset>

          <aside className="policy">
            <h2>How your policy applies</h2>
            {policy ? (
              <ul>
                <li><strong>Landing stay:</strong> {PAYER_LABEL[landingPayer]}
                  {landingPayer === 'company' && <>, up to {policy.landing_max_days} days{policy.landing_max_per_night ? ` and ${inr(policy.landing_max_per_night)} a night` : ''}</>}.</li>
                <li><strong>Long-term rent:</strong> {PAYER_LABEL[rentalPayer]}
                  {rentalPayer !== 'employee' && policy.rental_max_monthly ? `, up to ${inr(policy.rental_max_monthly)} a month` : ''}.</li>
                {(landingPayer === 'employee' || rentalPayer !== 'company') && (
                  <li>The employee accepts the terms before anything is booked on their behalf.</li>
                )}
              </ul>
            ) : (
              <p className="error">No policy is set for your company yet. Ask your FirstKey contact to add one, then come back.</p>
            )}
          </aside>

          {error && <p className="error" role="alert">{error}</p>}
          <div className="actions">
            <button className="primary" disabled={busy || !canSubmit}>{busy ? 'Submitting…' : 'Submit request'}</button>
            <Link to="/hr" className="link">Cancel</Link>
          </div>
        </form>
      )}
    </Layout>
  )
}
