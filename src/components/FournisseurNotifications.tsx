import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { estAnnulation, estUnChamp } from '../lib/clavier'
import Icone from './Icone'
import {
  ContexteNotifications,
  DUREE_ANNULATION_MS,
  DUREE_CONFIRMATION_MS,
  type ActionNotification,
  type GenreNotification,
} from './notifications-contexte'

type Notification = {
  numero: number
  genre: GenreNotification
  texte: string
  action?: ActionNotification
}

type Props = { children: ReactNode }

/**
 * Affiche les messages passagers demandés par `useNotifications` : en bas de l'écran,
 * au-dessus de la navigation. Un seul message à la fois, le dernier remplace le précédent.
 * Une confirmation peut porter un geste (« Annuler ») : elle reste alors plus longtemps,
 * attend tant que la souris est dessus ou que le clavier y est, et Ctrl Z la déclenche.
 */
export default function FournisseurNotifications({ children }: Props) {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [suspendue, setSuspendue] = useState(false)

  const notifier = useCallback(
    (genre: GenreNotification, texte: string, action?: ActionNotification) => {
      setNotification((precedente) => ({
        numero: (precedente?.numero ?? 0) + 1,
        genre,
        texte,
        action,
      }))
      // Un nouveau message repart avec sa propre durée.
      setSuspendue(false)
    },
    [],
  )

  // Une confirmation s'efface seule ; une erreur attend d'être lue et fermée.
  useEffect(() => {
    if (notification?.genre !== 'succes' || suspendue) return
    const duree = notification.action === undefined ? DUREE_CONFIRMATION_MS : DUREE_ANNULATION_MS
    const minuterie = window.setTimeout(() => setNotification(null), duree)
    return () => window.clearTimeout(minuterie)
  }, [notification, suspendue])

  const declencher = useCallback((action: ActionNotification) => {
    setNotification(null)
    setSuspendue(false)
    action.onAction()
  }, [])

  // Ctrl Z (⌘ Z) déclenche le geste proposé, tant que la confirmation est affichée.
  const action = notification?.action
  useEffect(() => {
    if (action === undefined) return
    function surTouche(evenement: KeyboardEvent) {
      if (action === undefined) return
      const annuler = estAnnulation({
        key: evenement.key,
        ctrlKey: evenement.ctrlKey,
        metaKey: evenement.metaKey,
        altKey: evenement.altKey,
        shiftKey: evenement.shiftKey,
        dansUnChamp: estUnChamp(document.activeElement),
      })
      if (!annuler) return
      evenement.preventDefault()
      declencher(action)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [action, declencher])

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
            onPointerEnter={(evenement) => {
              if (evenement.pointerType === 'mouse') setSuspendue(true)
            }}
            onPointerLeave={() => setSuspendue(false)}
            onFocus={() => setSuspendue(true)}
            onBlur={() => setSuspendue(false)}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl py-1 pr-1 pl-3 text-sm font-medium shadow-lg ring-1 ${
              notification.genre === 'erreur'
                ? 'bg-danger-doux text-danger ring-danger/40'
                : 'bg-succes-doux text-succes ring-succes/40'
            }`}
          >
            <Icone nom={notification.genre} className="size-5" />
            <p className="min-w-0 flex-1 py-2">{notification.texte}</p>
            {notification.action !== undefined && (
              <button
                type="button"
                onClick={() => {
                  if (notification.action !== undefined) declencher(notification.action)
                }}
                aria-keyshortcuts="Control+Z Meta+Z"
                className="min-h-11 shrink-0 rounded-lg px-3 font-semibold text-encre underline-offset-2 hover:bg-black/5 hover:underline focus-visible:outline-2 focus-visible:outline-current"
              >
                {notification.action.libelle}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setNotification(null)
                setSuspendue(false)
              }}
              aria-label="Fermer le message"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-current"
            >
              <Icone nom="fermer" className="size-5" />
            </button>
          </div>
        )}
      </div>
    </ContexteNotifications>
  )
}
