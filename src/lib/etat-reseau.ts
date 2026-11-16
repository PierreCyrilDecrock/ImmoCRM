import { useSyncExternalStore } from 'react'

/** Ce dont on a besoin de la fenêtre du navigateur pour suivre le réseau. */
type SourceReseau = Pick<Window, 'addEventListener' | 'removeEventListener'>

/**
 * Prévient à chaque fois que l'appareil perd ou retrouve le réseau.
 * Renvoie la fonction qui arrête la surveillance.
 */
export function suivreReseau(rappel: () => void, source: SourceReseau = window): () => void {
  source.addEventListener('online', rappel)
  source.addEventListener('offline', rappel)
  return () => {
    source.removeEventListener('online', rappel)
    source.removeEventListener('offline', rappel)
  }
}

/** Vrai tant que l'appareil a du réseau ; se met à jour tout seul. */
export function useEnLigne(): boolean {
  return useSyncExternalStore(
    suivreReseau,
    () => navigator.onLine,
    () => true,
  )
}
