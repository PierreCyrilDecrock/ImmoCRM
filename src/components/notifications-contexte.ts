import { createContext, useContext } from 'react'

export type GenreNotification = 'succes' | 'erreur'

export type Notifications = {
  /** Affiche un message passager, par exemple `notifier('succes', 'Contact enregistré')`. */
  notifier: (genre: GenreNotification, texte: string) => void
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
