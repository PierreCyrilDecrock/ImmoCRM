import Icone, { type NomIcone } from './Icone'

type Props = {
  libelle: string
  icone: NomIcone
  /** Adresse du lien (`tel:…`, `sms:…`, `mailto:…`). Absente : l'action est grisée. */
  href?: string
}

const CLASSES =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold'

/**
 * Grosse touche qui ouvre une autre application du téléphone : appel, SMS, courriel.
 * Sans `href` (pas de numéro, pas d'adresse), elle reste visible mais inactive.
 */
export default function LienAction({ libelle, icone, href }: Props) {
  if (href === undefined) {
    return (
      <span
        aria-disabled="true"
        className={`${CLASSES} bg-surface text-encre-douce opacity-60 ring-1 ring-bord ring-inset`}
      >
        <Icone nom={icone} />
        {libelle}
      </span>
    )
  }
  return (
    <a
      href={href}
      className={`${CLASSES} bg-accent text-sur-plein hover:bg-accent-fort focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <Icone nom={icone} />
      {libelle}
    </a>
  )
}
