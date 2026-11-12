import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Role } from '../lib/types'

const ROLE_LABEL: Record<Role, string> = { ops: 'FirstKey ops', hr_admin: 'HR admin', employee: 'Employee' }

export default function Layout({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const { profile, session } = useAuth()
  const nav = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    nav('/login')
  }

  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="7.5" cy="12" r="4.5" stroke="currentColor" strokeWidth="2.2" />
            <path d="M12 12h10M18 12v4M21 12v3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          FirstKey
        </Link>
        <div className="who">
          <span>{profile?.full_name || session?.user.email}</span>
          {profile && <span className="role">{ROLE_LABEL[profile.role]}</span>}
          <button className="link" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main className="page">
        <div className="page-head">
          <h1>{title}</h1>
          {action}
        </div>
        {children}
      </main>
    </>
  )
}
