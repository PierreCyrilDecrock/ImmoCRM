import type { ReactNode } from 'react'

type Props = {
  /** Allumée quand elle est choisie. */
  choisie: boolean
  onClick: () => void
  children: ReactNode
}

/**
 * Une pastille à toucher, allumée quand elle est choisie : un choix parmi quelques valeurs
 * (type d'activité, résultat d'un appel, température), en un geste.
 */
export default function Pastille({ choisie, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={choisie}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        choisie
          ? 'bg-encre font-semibold text-fond ring-encre'
          : 'bg-surface font-medium text-encre ring-bord-fort/40 hover:bg-creux'
      }`}
    >
      {children}
    </button>
  )
}
