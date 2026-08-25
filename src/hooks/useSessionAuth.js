import { useEffect, useState } from 'react'
import { getSession } from '../lib/api.js'
import { supabase } from '../lib/supabaseClient.js'

// Reactive current session (auth + perfil). Updates live on sign-in/out.
export default function useSessionAuth() {
  const [session, setSession] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      getSession().then((s) => {
        setSession(s)
        setLoading(false)
      })
    })

    getSession().then((s) => {
      setSession(s)
      setLoading(false)
    })

    return () => subscription?.subscription?.unsubscribe()
  }, [])

  return { session, loading }
}