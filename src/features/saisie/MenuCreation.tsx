import { useEffect, useId, useRef } from 'react'
import Icone, { type NomIcone } from '../../components/Icone'
import { rappelRecherche } from '../../lib/clavier'
import FichesRecentes from './FichesRecentes'
import { CREATIONS, type Creation } from './raccourcis'
import { useFichesRecentes } from './recents'

type Props = {
  onChoisir: (creation: Creation) => void
  onFermer: () => void
}

/** Nombre de fiches récentes montrées dans le menu. */
const RECENTES_DANS_LE_MENU = 5

const LIBELLES: Record<Creation, { libelle: string; detail: string; icone: NomIcone }> = {
  contact: {
    libelle: 'Nouveau contact',
    detail: 'Nom, téléphone, note et prochaine action',
    icone: 'contacts',
  },
  activite: {
    libelle: 'Nouvelle activité',
    detail: 'Compte rendu d’un appel, d’une visite…',
    icone: 'journal',
  },
  tache: {
    libelle: 'Nouvelle tâche',
    detail: 'Une action à faire, un rendez-vous',
    icone: 'taches',
  },
  bien: { libelle: 'Nouveau bien', detail: 'Adresse et type', icone: 'biens' },
  demande: {
    libelle: 'Nouvelle demande entrante',
    detail: 'Un acquéreur appelle ou écrit',
    icone: 'nouveaute',
  },
}

/**
 * Menu du bouton « + » (et du bouton « Créer » sur ordinateur) : les cinq créations, et les
 * fiches consultées récemment. Sur téléphone, il monte du bas de l'écran, sous le pouce ;
 * sur tablette, il s'ouvre près du « + », en bas à droite ; sur ordinateur, près de
 * « Créer », en bas de la colonne de gauche, et chaque création montre sa touche de clavier.
 */
export default function MenuCreation({ onChoisir, onFermer }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const idTitre = useId()
  const recentes = useFichesRecentes().slice(0, RECENTES_DANS_LE_MENU)

  useEffect(() => {
    const element = dialogue.current
    if (element !== null && !element.open) element.showModal()
    // Le curseur va sur la première création, pour les flèches et « Entrée ».
    element?.querySelector<HTMLElement>('[data-creation]')?.focus()
  }, [])

  return (
    <dialog
      ref={dialogue}
      aria-labelledby={idTitre}
      data-menu-creation=""
      onCancel={(evenement) => {
        evenement.preventDefault()
        onFermer()
      }}
      onClick={(evenement) => {
        if (evenement.target === evenement.currentTarget) onFermer()
      }}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-surface text-encre backdrop:bg-black/40 backdrop:backdrop-blur-[2px] md:mr-8 md:mb-8 md:ml-auto md:w-96 md:rounded-3xl lg:mr-auto lg:mb-6 lg:ml-64 md:shadow-2xl md:ring-1 md:ring-bord"
    >
      <div className="flex flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="-mt-1 -mr-1 flex items-center gap-2">
          <h2 id={idTitre} className="min-w-0 flex-1 text-lg font-semibold">
            Saisie rapide
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

        {recentes.length > 0 && (
          <section className="flex flex-col gap-2" aria-label="Consultées récemment">
            <p className="text-sm font-medium text-encre-douce">Consultées récemment</p>
            <FichesRecentes fiches={recentes} onOuvrir={onFermer} />
          </section>
        )}

        {/* Les créations en bas : c'est là que le pouce arrive. */}
        <section className="flex flex-col gap-2" aria-label="Créer">
          <p className="text-sm font-medium text-encre-douce">Créer</p>
          <ul className="divide-y divide-bord overflow-hidden rounded-2xl bg-surface ring-1 ring-bord">
            {CREATIONS.map(({ creation, touche }) => {
              const { libelle, detail, icone } = LIBELLES[creation]
              return (
                <li key={creation}>
                  <button
                    type="button"
                    data-creation={creation}
                    onClick={() => onChoisir(creation)}
                    aria-keyshortcuts={touche}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-doux text-accent-fort">
                      <Icone nom={icone} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium text-encre">
                        {libelle}
                      </span>
                      <span className="block truncate text-sm text-encre-douce">{detail}</span>
                    </span>
                    <kbd className="hidden rounded-md px-2 py-0.5 font-sans text-sm text-encre-douce ring-1 ring-bord-fort lg:inline">
                      {touche}
                    </kbd>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="hidden text-sm text-encre-douce lg:block">
            Au clavier : <kbd className="font-sans font-semibold">N</kbd> ouvre ce menu,{' '}
            <kbd className="font-sans font-semibold">/</kbd> ou{' '}
            <kbd className="font-sans font-semibold">{rappelRecherche()}</kbd> va à la recherche.
          </p>
        </section>
      </div>
    </dialog>
  )
}
