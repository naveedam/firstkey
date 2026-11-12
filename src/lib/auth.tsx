import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

interface AuthState { session: Session | null; profile: Profile | null; loading: boolean }

const Ctx = createContext<AuthState>({ session: null, profile: null, loading: true })
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id
  useEffect(() => {
    if (!uid) { setProfile(null); setLoadedFor(null); return }
    let cancelled = false
    supabase.from('profiles').select('id,company_id,role,full_name').eq('id', uid).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setProfile((data as Profile | null) ?? null)
        setLoadedFor(uid)
      })
    return () => { cancelled = true }
  }, [uid])

  const loading = !ready || (Boolean(uid) && loadedFor !== uid)
  return <Ctx.Provider value={{ session, profile, loading }}>{children}</Ctx.Provider>
}
