import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { arriveeParLienDeRecuperation } from '../../lib/supabase'
import { ContexteSession } from './session-contexte'

type Props = { client: SupabaseClient; children: ReactNode }

/** Suit la session Supabase (connexion, déconnexion, renouvellement) et la partage. */
export default function FournisseurSession({ client, children }: Props) {
  const [chargement, setChargement] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [recuperation, setRecuperation] = useState(arriveeParLienDeRecuperation)

  useEffect(() => {
    let actif = true

    // Session déjà enregistrée dans le navigateur (ou apportée par un lien reçu par courriel).
    void client.auth.getSession().then(({ data }) => {
      if (!actif) return
      setSession(data.session)
      setChargement(false)
    })

    const { data } = client.auth.onAuthStateChange((evenement, nouvelleSession) => {
      if (!actif) return
      setSession(nouvelleSession)
      if (evenement === 'PASSWORD_RECOVERY') setRecuperation(true)
      if (evenement === 'SIGNED_OUT') setRecuperation(false)
    })

    return () => {
      actif = false
      data.subscription.unsubscribe()
    }
  }, [client])

  const terminerRecuperation = useCallback(() => setRecuperation(false), [])

  const etat = useMemo(
    () => ({ chargement, session, recuperation, terminerRecuperation }),
    [chargement, session, recuperation, terminerRecuperation],
  )

  return <ContexteSession value={etat}>{children}</ContexteSession>
}
