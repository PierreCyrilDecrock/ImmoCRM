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
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        choisie
          ? 'bg-accent text-sur-plein ring-accent'
          : 'bg-surface text-encre ring-bord-fort hover:bg-creux'
      }`}
    >
      {children}
    </button>
  )
}
