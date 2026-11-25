import { createContext, useContext } from 'react'
import type { Resultat } from '../../lib/donnees'
import type { Mode, PreferencesAppareil } from './appareil'
import type { ApparenceCompte, Theme } from './themes'

/** L'apparence, partagée avec toute l'application (page Apparence, éditeur de thème). */
export type EtatApparence = {
  /** Mode et zoom de cet appareil. */
  preferences: PreferencesAppareil
  changerMode: (mode: Mode) => void
  changerZoom: (zoom: number) => void
  /** L'appareil est réglé en sombre (`prefers-color-scheme`). */
  appareilSombre: boolean
  /** Le mode sombre est affiché en ce moment (mode imposé, ou « auto » et appareil sombre). */
  sombre: boolean
  /** Les thèmes du compte. */
  apparence: ApparenceCompte
  /** `chargement` tant que les thèmes du compte ne sont pas lus. */
  etat: 'chargement' | 'pret' | 'erreur'
  /** Met un thème en service (enregistré dans le compte). */
  choisirTheme: (id: string) => Promise<Resultat<ApparenceCompte>>
  /** Crée ou modifie un thème ; `choisir` le met aussi en service. */
  enregistrerTheme: (theme: Theme, choisir: boolean) => Promise<Resultat<ApparenceCompte>>
  /** Supprime un thème créé ; s'il était en service, « Standard » reprend la place. */
  supprimerTheme: (id: string) => Promise<Resultat<ApparenceCompte>>
}

export const ContexteApparence = createContext<EtatApparence | null>(null)

/** Donne l'apparence et ses gestes. À utiliser sous `FournisseurApparence`. */
export function useApparence(): EtatApparence {
  const etat = useContext(ContexteApparence)
  if (etat === null) throw new Error('useApparence doit être utilisé sous FournisseurApparence')
  return etat
}
