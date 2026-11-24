import { useId } from 'react'
import Icone, { type NomIcone } from './Icone'
import { useMenuFlottant } from './menu-flottant'

export type ElementMenu = {
  libelle: string
  icone: NomIcone
  onChoisir: () => void
  /** Action destructrice (suppression définitive) : en rouge, à la fin du menu. */
  danger?: boolean
  desactive?: boolean
}

type Props = {
  /** Ce que dit le bouton « … » aux lecteurs d'écran (« Autres actions sur la fiche »). */
  libelle: string
  elements: readonly ElementMenu[]
}

/**
 * Le bouton « … » et son menu, pour les actions rares d'une fiche (fusionner, exporter,
 * archiver, supprimer). Le menu s'ouvre par-dessus la page (une colonne qui défile ne le
 * coupe pas), sous le bouton et aligné à droite, ou au-dessus s'il manque de place. Au
 * clavier : les flèches parcourent le menu, Entrée choisit, Échap le referme et rend le
 * clavier au bouton. Un toucher à côté le referme ; si la page défile, il suit le bouton.
 */
export default function MenuActions({ libelle, elements }: Props) {
  const id = useId()
  const { ouvert, basculer, fermer, bouton, menu, style, surTouche } = useMenuFlottant()

  return (
    <div>
      <button
        ref={bouton}
        type="button"
        aria-label={libelle}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? id : undefined}
        onClick={basculer}
        className="inline-flex size-11 items-center justify-center rounded-lg bg-surface text-encre shadow-xs ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icone nom="plus" className="size-5" />
      </button>
      {ouvert && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={libelle}
          onKeyDown={surTouche}
          style={style}
          className="fixed z-30 flex w-64 max-w-[calc(100vw-1rem)] flex-col rounded-2xl bg-surface p-1.5 shadow-lg ring-1 ring-bord"
        >
          {elements.map((element) => (
            <button
              key={element.libelle}
              type="button"
              role="menuitem"
              disabled={element.desactive}
              onClick={() => {
                fermer(true)
                element.onChoisir()
              }}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-base font-medium hover:bg-creux focus-visible:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                element.danger === true ? 'text-danger' : 'text-encre'
              }`}
            >
              <Icone
                nom={element.icone}
                className={`size-5 shrink-0 ${element.danger === true ? '' : 'text-encre-douce'}`}
              />
              {element.libelle}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
