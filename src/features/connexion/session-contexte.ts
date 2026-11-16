import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

/** État de la connexion, partagé avec toute l'application. */
export type EtatSession = {
  /** Vrai tant qu'on ne sait pas encore si une session existe (au démarrage). */
  chargement: boolean
  /** Session en cours, ou `null` si personne n'est connecté. */
  session: Session | null
  /** Vrai si l'on arrive du courriel « mot de passe oublié » : il faut choisir un nouveau mot de passe. */
  recuperation: boolean
  /** À appeler une fois le nouveau mot de passe enregistré. */
  terminerRecuperation: () => void
}

export const ContexteSession = createContext<EtatSession | null>(null)

/** Donne l'état de la connexion. À utiliser sous `FournisseurSession`. */
export function useSession(): EtatSession {
  const etat = useContext(ContexteSession)
  if (etat === null) throw new Error('useSession doit être utilisé sous FournisseurSession')
  return etat
}
