import { useSyncExternalStore } from 'react'
import { nombreEcrituresEnCours, suivreEcritures } from './donnees'
import { useEnLigne } from './etat-reseau'

/**
 * État affiché en bas de la colonne de navigation, sur ordinateur : tout est enregistré,
 * une écriture est en cours, ou le réseau manque.
 */
export type EtatEnregistrement = 'enregistre' | 'en_cours' | 'hors_ligne'

export const LIBELLES_ENREGISTREMENT: Record<EtatEnregistrement, string> = {
  enregistre: 'Tout est enregistré',
  en_cours: 'Enregistrement…',
  hors_ligne: 'Connexion perdue',
}

/** L'état à afficher : sans réseau, rien ne s'enregistre, quoi qu'il y ait en cours. */
export function etatEnregistrement(ecrituresEnCours: number, enLigne: boolean): EtatEnregistrement {
  if (!enLigne) return 'hors_ligne'
  return ecrituresEnCours > 0 ? 'en_cours' : 'enregistre'
}

/** L'état d'enregistrement ; se met à jour tout seul. */
export function useEtatEnregistrement(): EtatEnregistrement {
  const ecritures = useSyncExternalStore(suivreEcritures, nombreEcrituresEnCours, () => 0)
  return etatEnregistrement(ecritures, useEnLigne())
}
