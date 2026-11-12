import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { configured } from './lib/supabase'
import type { Role } from './lib/types'
import Login from './pages/Login'
import OpsHome from './pages/OpsHome'
import OpsJourney from './pages/OpsJourney'
import HrHome from './pages/HrHome'
import NewRequest from './pages/NewRequest'
import EmployeeHome from './pages/EmployeeHome'

const HOME: Record<Role, string> = { ops: '/ops', hr_admin: '/hr', employee: '/me' }

function Message({ children }: { children: ReactNode }) {
  return <main className="center"><p>{children}</p></main>
}

function Guard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <Message>Loading…</Message>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Message>Your account isn't set up yet. Ask your FirstKey contact to finish setup, then sign in again.</Message>
  if (!allow.includes(profile.role)) return <Navigate to={HOME[profile.role]} replace />
  return <>{children}</>
}

function Landing() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Message>Loading…</Message>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Message>Your account isn't set up yet. Ask your FirstKey contact to finish setup, then sign in again.</Message>
  return <Navigate to={HOME[profile.role]} replace />
}

export default function App() {
  if (!configured) {
    return <Message>Missing Supabase settings. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.</Message>
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Landing />} />
      <Route path="/ops" element={<Guard allow={['ops']}><OpsHome /></Guard>} />
      <Route path="/ops/journeys/:id" element={<Guard allow={['ops']}><OpsJourney /></Guard>} />
      <Route path="/hr" element={<Guard allow={['hr_admin']}><HrHome /></Guard>} />
      <Route path="/hr/new" element={<Guard allow={['hr_admin']}><NewRequest /></Guard>} />
      <Route path="/me" element={<Guard allow={['employee']}><EmployeeHome /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
