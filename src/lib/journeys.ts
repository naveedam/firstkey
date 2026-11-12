import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { JourneyRow } from './types'

const SELECT = 'id,stage,landing_payer,rental_payer,needed_from,created_at,employees(full_name,email),companies(name)'

/** Loads the journeys the signed-in user may see; row-level security decides which. */
export function useJourneys() {
  const [rows, setRows] = useState<JourneyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('journeys').select(SELECT).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows((data ?? []) as unknown as JourneyRow[])
        setLoading(false)
      })
  }, [])

  return { rows, loading, error }
}
