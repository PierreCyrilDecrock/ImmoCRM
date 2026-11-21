import type { ReactNode } from 'react'

export type GenreEtiquette = 'neutre' | 'info' | 'succes' | 'alerte' | 'danger'

type Props = { genre?: GenreEtiquette; children: ReactNode }

const COULEURS: Record<GenreEtiquette, string> = {
  neutre: 'bg-creux text-encre-douce',
  info: 'bg-accent-doux text-accent-fort',
  succes: 'bg-succes-doux text-succes',
  alerte: 'bg-alerte-doux text-alerte',
  danger: 'bg-danger-doux text-danger',
}

/** Petite pastille de texte qui qualifie un élément : un état, une catégorie, un environnement. */
export default function Etiquette({ genre = 'neutre', children }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold ${COULEURS[genre]}`}
    >
      {children}
    </span>
  )
}
