import type { ReactNode } from 'react'

type Props = {
  onClick: () => void
  children: ReactNode
} & (
  | {
      /** Allumée quand elle est choisie. */
      choisie: boolean
      deplie?: undefined
    }
  | {
      choisie?: undefined
      /**
       * Pastille qui ouvre un choix (« Autre », « Autre contact ») : vrai quand ce choix est
       * ouvert. Elle garde le style des autres, avec son dessin (chevron, loupe) ; elle ne
       * s'allume pas.
       */
      deplie: boolean
    }
)

/**
 * Une pastille à toucher, allumée quand elle est choisie : un choix parmi quelques valeurs
 * (type d'activité, résultat d'un appel, température), en un geste. Avec `deplie`, elle ouvre
 * un choix de plus, au même style que les autres (revue de design, correction 12).
 */
export default function Pastille({ choisie, deplie, onClick, children }: Props) {
  const allumee = choisie === true
  return (
    <button
      type="button"
      aria-pressed={deplie === undefined ? allumee : undefined}
      aria-expanded={deplie}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        allumee
          ? 'bg-encre font-semibold text-fond ring-encre'
          : `font-medium text-encre ring-bord-fort/40 hover:bg-creux ${deplie === true ? 'bg-creux' : 'bg-surface'}`
      }`}
    >
      {children}
    </button>
  )
}
