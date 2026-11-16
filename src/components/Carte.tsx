import type { ReactNode } from 'react'

type Props = { titre?: string; children: ReactNode }

/** Bloc de contenu sur fond clair, aux coins arrondis, avec un titre facultatif. */
export default function Carte({ titre, children }: Props) {
  return (
    <section className="rounded-2xl bg-surface p-4 ring-1 ring-bord">
      {titre !== undefined && <h2 className="mb-3 text-lg font-semibold text-encre">{titre}</h2>}
      {children}
    </section>
  )
}
