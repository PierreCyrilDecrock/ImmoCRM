import Icone, { type NomIcone } from './Icone'

type Props = {
  libelle: string
  icone: NomIcone
  /** Adresse du lien (`tel:…`, `sms:…`, `mailto:…`). Absente : l'action est grisée. */
  href?: string
  /**
   * Action dans l'application (« Consigner » de la barre du bas) : la touche est alors un
   * bouton. Sans `href` ni `onClick`, elle est grisée.
   */
  onClick?: () => void
  /**
   * `principal` (par défaut) : bleu plein, pour l'action attendue (Appeler) ;
   * `secondaire` : blanc, pour les autres (SMS, courriel). Une seule touche principale par groupe.
   */
  variante?: 'principal' | 'secondaire'
  /** Ouvre l'adresse dans un nouvel onglet (application de cartes, sur ordinateur). */
  nouvelOnglet?: boolean
  /** Ce qu'entend un lecteur d'écran, si le libellé ne suffit pas (« Appel bloqué : … »). */
  annonce?: string
}

const CLASSES =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-sm font-semibold'

const COULEURS = {
  principal: 'bg-accent text-sur-plein shadow-sm shadow-accent/25 hover:bg-accent-fort',
  secondaire: 'bg-surface text-encre shadow-xs ring-1 ring-inset ring-bord hover:bg-creux',
}

const CLAVIER =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Grosse touche qui ouvre une autre application du téléphone : appel, SMS, courriel, cartes.
 * Sans `href` (pas de numéro, pas d'adresse) ni `onClick`, elle reste visible mais inactive.
 */
export default function LienAction({
  libelle,
  icone,
  href,
  onClick,
  variante = 'principal',
  nouvelOnglet = false,
  annonce,
}: Props) {
  const contenu = (
    <>
      <Icone nom={icone} />
      <span aria-hidden={annonce === undefined ? undefined : true}>{libelle}</span>
      {annonce !== undefined && <span className="sr-only">{annonce}</span>}
    </>
  )
  if (href === undefined && onClick !== undefined) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${CLASSES} ${COULEURS[variante]} ${CLAVIER}`}
      >
        {contenu}
      </button>
    )
  }
  if (href === undefined) {
    return (
      <span
        aria-disabled="true"
        className={`${CLASSES} bg-surface text-encre-douce opacity-60 ring-1 ring-bord ring-inset`}
      >
        {contenu}
      </span>
    )
  }
  return (
    <a
      href={href}
      {...(nouvelOnglet ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={`${CLASSES} ${COULEURS[variante]} ${CLAVIER}`}
    >
      {contenu}
    </a>
  )
}
