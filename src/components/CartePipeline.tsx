import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import Icone from './Icone'

type Ligne = { texte: string; alerte: boolean }

type Props = {
  /** Adresse de la fiche du projet. */
  vers: string
  titre: string
  /** Lignes de détail, sous le titre (bien, recherche…). */
  details: readonly string[]
  /** Ancienneté dans l'étape, ou date de l'issue ; en couleur d'alerte si elle traîne. */
  etape: Ligne
  /** Prochaine action ; en rouge si elle est en retard. Vide : rien n'est affiché. */
  action: Ligne
  /** Fourni sur tablette et ordinateur : la poignée permet de glisser la carte. */
  onSaisir?: (evenement: PointerEvent<HTMLButtonElement>) => void
  /** La carte est en train d'être glissée, ou enregistrée. */
  estompee?: boolean
  /**
   * Gardé dans l'historique avec la fiche ouverte : la colonne d'où l'on vient, pour passer
   * au projet précédent ou suivant depuis la fiche (`{ parcours: étape }`).
   */
  etat?: unknown
}

/**
 * Carte d'un projet dans un pipeline : le titre (le contact), les détails, l'ancienneté dans
 * l'étape et la prochaine action. Toucher la carte ouvre le projet ; sur grand écran, la
 * poignée sert à la glisser vers une autre étape.
 */
export default function CartePipeline({
  vers,
  titre,
  details,
  etape,
  action,
  onSaisir,
  estompee = false,
  etat,
}: Props) {
  return (
    <div
      className={`relative rounded-xl bg-surface ring-1 ring-bord ${estompee ? 'opacity-40' : ''}`}
    >
      <Link
        to={vers}
        state={etat}
        className="flex min-w-0 flex-col gap-0.5 rounded-xl p-3 break-words hover:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <span className={`font-semibold text-encre ${onSaisir === undefined ? '' : 'pr-8'}`}>
          {titre}
        </span>
        {details
          .filter((detail) => detail !== '')
          .map((detail) => (
            <span key={detail} className="text-sm text-encre-douce">
              {detail}
            </span>
          ))}
        <span
          className={`text-sm ${etape.alerte ? 'font-medium text-alerte' : 'text-encre-douce'}`}
        >
          {etape.texte}
        </span>
        {action.texte !== '' && (
          <span
            className={`flex items-start gap-1 text-sm ${action.alerte ? 'font-medium text-danger' : 'text-encre'}`}
          >
            <Icone nom="taches" className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">{action.texte}</span>
          </span>
        )}
      </Link>
      {onSaisir !== undefined && (
        <button
          type="button"
          aria-label="Glisser vers une autre étape"
          title="Glisser vers une autre étape"
          onPointerDown={onSaisir}
          className="absolute top-0 right-0 flex size-11 cursor-grab touch-none items-center justify-center rounded-tr-xl rounded-bl-xl text-encre-douce hover:bg-creux active:cursor-grabbing"
        >
          <Icone nom="poignee" className="size-5" />
        </button>
      )}
    </div>
  )
}
