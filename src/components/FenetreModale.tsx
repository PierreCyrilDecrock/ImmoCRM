import { useEffect, useId, useRef, type ReactNode } from 'react'
import Icone from './Icone'

type Props = {
  ouverte: boolean
  titre: string
  /** Appelé quand la fenêtre doit se fermer : croix, touche Échap, clic à côté. */
  onFermer: () => void
  children: ReactNode
  /** Boutons d'action, fixés en bas de la fenêtre : toujours à portée de pouce. */
  pied?: ReactNode
}

/**
 * Fenêtre modale : plein écran sur téléphone, centrée sur tablette et ordinateur.
 * Tant qu'elle est ouverte, le reste de la page est inaccessible (clavier compris).
 */
export default function FenetreModale({ ouverte, titre, onFermer, children, pied }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const idTitre = useId()

  useEffect(() => {
    const element = dialogue.current
    if (element === null) return
    if (ouverte && !element.open) {
      element.showModal()
      // Le champ marqué « autoFocus » a été monté avant l'ouverture : le navigateur a donc
      // placé le curseur sur la croix. On le remet dans le champ prévu (titre d'une tâche,
      // recherche d'un contact), pour pouvoir taper aussitôt.
      element.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!ouverte && element.open) element.close()
  }, [ouverte])

  return (
    <dialog
      ref={dialogue}
      aria-labelledby={idTitre}
      // « Échap » : on laisse le parent décider, pour que l'état reste la seule référence.
      onCancel={(evenement) => {
        evenement.preventDefault()
        onFermer()
      }}
      // Un clic sur le fond assombri (hors du contenu) ferme la fenêtre.
      onClick={(evenement) => {
        if (evenement.target === evenement.currentTarget) onFermer()
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-surface text-encre backdrop:bg-black/50 md:m-auto md:h-fit md:max-h-[85dvh] md:max-w-lg md:rounded-2xl md:shadow-xl md:ring-1 md:ring-bord"
    >
      {ouverte && (
        <div className="flex h-dvh flex-col md:h-auto md:max-h-[85dvh]">
          <header className="flex items-center gap-2 border-b border-bord py-1 pr-1 pl-4">
            <h2 id={idTitre} className="min-w-0 flex-1 truncate text-lg font-semibold">
              {titre}
            </h2>
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="flex size-11 items-center justify-center rounded-lg text-encre-douce hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icone nom="fermer" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          {pied !== undefined && (
            <footer className="flex flex-col gap-2 border-t border-bord p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-row-reverse">
              {pied}
            </footer>
          )}
        </div>
      )}
    </dialog>
  )
}
