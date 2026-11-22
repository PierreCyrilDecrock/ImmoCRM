import Icone from './Icone'

type Props = {
  /** « 12 sur 48 ». */
  position: string
  /** Ce qu'on parcourt, pour les lecteurs d'écran (« la liste des contacts »). */
  quoi: string
  /** Absent : on est au début de la liste, la flèche est grisée. */
  onPrecedent?: () => void
  /** Absent : on est au bout de la liste. */
  onSuivant?: () => void
  /** Une fiche voisine est en train d'être lue : les flèches attendent. */
  enCours?: boolean
}

const CLASSES_FLECHE =
  'inline-flex size-11 items-center justify-center rounded-lg bg-surface text-encre shadow-xs ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface'

/**
 * En haut d'une fiche, sur ordinateur : « 12 sur 48 » et deux flèches pour passer à la fiche
 * précédente ou suivante de la liste d'où l'on vient (raccourcis K et J, gérés par la page).
 */
export default function NavigationFiche({
  position,
  quoi,
  onPrecedent,
  onSuivant,
  enCours = false,
}: Props) {
  return (
    <nav aria-label={`Parcourir ${quoi}`} className="flex items-center gap-2">
      <span className="text-sm text-encre-douce tabular-nums">{position}</span>
      <button
        type="button"
        className={CLASSES_FLECHE}
        disabled={onPrecedent === undefined || enCours}
        onClick={onPrecedent}
        aria-label="Précédent"
        aria-keyshortcuts="K"
        title="Précédent (K)"
      >
        <Icone nom="retour" className="size-5" />
      </button>
      <button
        type="button"
        className={CLASSES_FLECHE}
        disabled={onSuivant === undefined || enCours}
        onClick={onSuivant}
        aria-label="Suivant"
        aria-keyshortcuts="J"
        title="Suivant (J)"
      >
        <Icone nom="chevron" className="size-5" />
      </button>
    </nav>
  )
}
