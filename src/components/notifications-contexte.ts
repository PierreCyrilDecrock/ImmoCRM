import { createContext, useContext } from 'react'

export type GenreNotification = 'succes' | 'erreur'

/** Un geste proposé dans une confirmation, par exemple « Annuler » après un report. */
export type ActionNotification = { libelle: string; onAction: () => void }

export type Notifications = {
  /**
   * Affiche un message passager, par exemple `notifier('succes', 'Contact enregistré')`.
   * Avec `action`, la confirmation porte un bouton (« Annuler ») et reste un peu plus
   * longtemps ; Ctrl Z (⌘ Z) le déclenche au clavier tant qu'elle est affichée.
   */
  notifier: (genre: GenreNotification, texte: string, action?: ActionNotification) => void
}

export const ContexteNotifications = createContext<Notifications | null>(null)

/** Pour confirmer une action ou signaler un échec. À utiliser sous `FournisseurNotifications`. */
export function useNotifications(): Notifications {
  const notifications = useContext(ContexteNotifications)
  if (notifications === null) {
    throw new Error('useNotifications doit être utilisé sous FournisseurNotifications')
  }
  return notifications
}

/** Durée d'affichage d'une confirmation. Une erreur reste jusqu'à ce qu'on la ferme. */
export const DUREE_CONFIRMATION_MS = 4000

/** Durée d'une confirmation qui propose d'annuler : le temps de lire et de toucher. */
export const DUREE_ANNULATION_MS = 7000
