import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Icone from './Icone'
import {
  ContexteNotifications,
  DUREE_CONFIRMATION_MS,
  type GenreNotification,
} from './notifications-contexte'

type Notification = { numero: number; genre: GenreNotification; texte: string }

type Props = { children: ReactNode }

/**
 * Affiche les messages passagers demandés par `useNotifications` : en bas de l'écran,
 * au-dessus de la navigation. Un seul message à la fois, le dernier remplace le précédent.
 */
export default function FournisseurNotifications({ children }: Props) {
  const [notification, setNotification] = useState<Notification | null>(null)

  const notifier = useCallback((genre: GenreNotification, texte: string) => {
    setNotification((precedente) => ({ numero: (precedente?.numero ?? 0) + 1, genre, texte }))
  }, [])

  // Une confirmation s'efface seule ; une erreur attend d'être lue et fermée.
  useEffect(() => {
    if (notification?.genre !== 'succes') return
    const minuterie = window.setTimeout(() => setNotification(null), DUREE_CONFIRMATION_MS)
    return () => window.clearTimeout(minuterie)
  }, [notification])

  const valeur = useMemo(() => ({ notifier }), [notifier])

  return (
    <ContexteNotifications value={valeur}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6 md:justify-end md:px-6"
      >
        {notification !== null && (
          <div
            key={notification.numero}
            role={notification.genre === 'erreur' ? 'alert' : undefined}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl py-1 pr-1 pl-3 text-sm font-medium shadow-lg ring-1 ${
              notification.genre === 'erreur'
                ? 'bg-danger-doux text-danger ring-danger/40'
                : 'bg-succes-doux text-succes ring-succes/40'
            }`}
          >
            <Icone nom={notification.genre} className="size-5" />
            <p className="min-w-0 flex-1 py-2">{notification.texte}</p>
            <button
              type="button"
              onClick={() => setNotification(null)}
              aria-label="Fermer le message"
              className="flex size-11 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-current"
            >
              <Icone nom="fermer" className="size-5" />
            </button>
          </div>
        )}
      </div>
    </ContexteNotifications>
  )
}
