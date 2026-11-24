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
  /** Petit geste placé dans l'en-tête, avant la croix (« Créer autre chose »). */
  actionEnTete?: ReactNode
  /**
   * Au téléphone, une feuille qui monte du bas, à la hauteur de son contenu (la liste des
   * étapes d'un projet), au lieu du plein écran ; centrée à partir de la tablette.
   */
  feuille?: boolean
}

/** Ce qui peut recevoir le curseur, dans un bloc marqué « data-autofocus ». */
const FOCALISABLE =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Fenêtre modale : plein écran sur téléphone (ou feuille qui monte du bas, avec `feuille`),
 * centrée sur tablette et ordinateur.
 * Tant qu'elle est ouverte, le reste de la page est inaccessible (clavier compris).
 */
export default function FenetreModale({
  ouverte,
  titre,
  onFermer,
  children,
  pied,
  actionEnTete,
  feuille = false,
}: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const idTitre = useId()

  useEffect(() => {
    const element = dialogue.current
    if (element === null) return
    if (ouverte && !element.open) {
      element.showModal()
      // Le champ marqué « autoFocus » a été monté avant l'ouverture : le navigateur a donc
      // placé le curseur sur la croix. On le remet dans le champ prévu (titre d'une tâche,
      // recherche d'un contact), pour pouvoir taper aussitôt. Un bloc marqué (une rangée de
      // pastilles) donne le curseur à son premier élément.
      const repere = element.querySelector<HTMLElement>('[data-autofocus]')
      const cible = repere?.matches(FOCALISABLE)
        ? repere
        : repere?.querySelector<HTMLElement>(FOCALISABLE)
      cible?.focus()
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
      className={`w-full max-w-none bg-surface text-encre backdrop:bg-black/45 backdrop:backdrop-blur-[2px] md:m-auto md:h-fit md:max-h-[85dvh] md:max-w-lg md:rounded-3xl md:shadow-2xl md:ring-1 md:ring-bord ${
        feuille
          ? 'mx-0 mt-auto mb-0 h-fit max-h-[85dvh] rounded-t-3xl shadow-2xl ring-1 ring-bord motion-safe:animate-monter md:motion-safe:animate-none'
          : 'm-0 h-dvh max-h-none'
      }`}
    >
      {ouverte && (
        <div
          className={
            feuille
              ? 'flex max-h-[85dvh] flex-col'
              : 'flex h-dvh flex-col md:h-auto md:max-h-[85dvh]'
          }
        >
          <header className="flex items-center gap-2 border-b border-bord py-1 pr-1 pl-4">
            <h2
              id={idTitre}
              // Avec un geste dans l'en-tête, un titre long passe à la ligne plutôt que d'être coupé.
              className={`min-w-0 flex-1 text-lg font-semibold tracking-tight ${actionEnTete === undefined ? 'truncate' : 'py-1.5 leading-snug'}`}
            >
              {titre}
            </h2>
            {actionEnTete}
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="flex size-11 items-center justify-center rounded-lg text-encre-douce hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icone nom="fermer" />
            </button>
          </header>
          <div
            className={`min-h-0 flex-1 overflow-y-auto p-4 ${
              feuille && pied === undefined ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : ''
            }`}
          >
            {children}
          </div>
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
