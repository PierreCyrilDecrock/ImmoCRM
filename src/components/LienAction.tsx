import Icone, { type NomIcone } from './Icone'

type Props = {
  libelle: string
  icone: NomIcone
  /** Adresse du lien (`tel:…`, `sms:…`, `mailto:…`). Absente : l'action est grisée. */
  href?: string
  /**
   * `principal` (par défaut) : bleu plein, pour l'action attendue (Appeler) ;
   * `secondaire` : blanc, pour les autres (SMS, courriel). Une seule touche principale par groupe.
   */
  variante?: 'principal' | 'secondaire'
}

const CLASSES =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-sm font-semibold'

const COULEURS = {
  principal: 'bg-accent text-sur-plein shadow-sm shadow-accent/25 hover:bg-accent-fort',
  secondaire: 'bg-surface text-encre shadow-xs ring-1 ring-inset ring-bord hover:bg-creux',
}

/**
 * Grosse touche qui ouvre une autre application du téléphone : appel, SMS, courriel.
 * Sans `href` (pas de numéro, pas d'adresse), elle reste visible mais inactive.
 */
export default function LienAction({ libelle, icone, href, variante = 'principal' }: Props) {
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
      className={`${CLASSES} ${COULEURS[variante]} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <Icone nom={icone} />
      {libelle}
    </a>
  )
}
