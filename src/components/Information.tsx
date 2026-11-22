import type { ReactNode } from 'react'

type Props = {
  nom: string
  /** Un petit geste après la valeur, par exemple `BoutonCopier` (visible au survol de la ligne). */
  fin?: ReactNode
  /** Le nom toujours au-dessus de la valeur, même sur grand écran (colonne étroite du profil). */
  empilee?: boolean
  children: ReactNode
}

/**
 * Une information d'une fiche : son nom à gauche (au-dessus sur téléphone), sa valeur.
 * À placer dans une liste `<dl className="divide-y divide-bord">`.
 */
export default function Information({ nom, fin, empilee = false, children }: Props) {
  return (
    <div
      className={`group/ligne flex flex-col gap-0.5 py-2 ${empilee ? '' : 'md:flex-row md:gap-4'}`}
    >
      <dt className={`text-sm text-encre-douce ${empilee ? '' : 'md:w-36 md:shrink-0 md:pt-0.5'}`}>
        {nom}
      </dt>
      {fin === undefined ? (
        <dd className="min-w-0 text-base break-words text-encre">{children}</dd>
      ) : (
        <dd className="flex min-w-0 items-center gap-1 text-base text-encre">
          <span className="min-w-0 break-words">{children}</span>
          {/* Le geste garde ses 44 px sans agrandir la ligne. */}
          <span className="-my-2.5 flex shrink-0">{fin}</span>
        </dd>
      )}
    </div>
  )
}
