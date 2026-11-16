import type { ReactNode } from 'react'

export type GenreEtiquette = 'neutre' | 'info' | 'succes' | 'alerte' | 'danger'

type Props = { genre?: GenreEtiquette; children: ReactNode }

const COULEURS: Record<GenreEtiquette, string> = {
  neutre: 'bg-creux text-encre ring-bord-fort',
  info: 'bg-accent-doux text-accent-fort ring-accent/30',
  succes: 'bg-succes-doux text-succes ring-succes/30',
  alerte: 'bg-alerte-doux text-alerte ring-alerte/30',
  danger: 'bg-danger-doux text-danger ring-danger/30',
}

/** Petite pastille de texte qui qualifie un élément : un état, une catégorie, un environnement. */
export default function Etiquette({ genre = 'neutre', children }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ring-inset ${COULEURS[genre]}`}
    >
      {children}
    </span>
  )
}
