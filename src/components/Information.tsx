import type { ReactNode } from 'react'

/**
 * Une information d'une fiche : son nom à gauche (au-dessus sur téléphone), sa valeur.
 * À placer dans une liste `<dl className="divide-y divide-bord">`.
 */
export default function Information({ nom, children }: { nom: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 md:flex-row md:gap-4">
      <dt className="text-sm text-encre-douce md:w-36 md:shrink-0 md:pt-0.5">{nom}</dt>
      <dd className="min-w-0 text-base break-words text-encre">{children}</dd>
    </div>
  )
}
