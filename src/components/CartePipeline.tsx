import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import Icone from './Icone'

type Ligne = { texte: string; alerte: boolean }

type Props = {
  /** Adresse de la fiche du projet. */
  vers: string
  /** Ce qui distingue le projet : le bien (vente) ou l'acquéreur (achat). */
  titre: string
  /** Juste sous le titre, en encre : le vendeur (vente) ; vide pour un achat. */
  sousTitre: string
  /**
   * Ce que vaut le projet, en chiffres alignés : « 300 000 € espérés », « Estimé 410 –
   * 440 k€ », « Budget 200 – 300 k€ » ; en gris s'il n'est pas `connue` (« Prix à connaître »).
   */
  valeur: { texte: string; connue: boolean }
  /** Lignes de détail, plus discrètes (critères de recherche, biens proposés…). */
  details: readonly string[]
  /**
   * Ancienneté dans l'étape, ou date de l'issue ; en orange si elle traîne, avec sa raison
   * (`raison`, lue et en info-bulle : « Plus de 30 jours à cette étape »).
   */
  etape: Ligne & { raison?: string }
  /**
   * Prochaine action, derrière une horloge, son jour en mots (« Relance aujourd’hui ») ; en
   * rouge si elle est en retard, dit en clair (« Relance en retard · 1 j »). Vide : rien
   * n'est affiché.
   */
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
 * Carte d'un projet dans un pipeline : le titre (le bien d'un projet de vente, l'acquéreur
 * d'un projet d'achat), le sous-titre (le vendeur), la valeur (prix espéré, estimation ou
 * budget), les détails, l'ancienneté dans l'étape et la prochaine action. Toucher la carte ouvre le projet ; sur grand écran, la
 * poignée sert à la glisser vers une autre étape.
 */
export default function CartePipeline({
  vers,
  titre,
  sousTitre,
  valeur,
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
        {sousTitre !== '' && <span className="text-sm text-encre">{sousTitre}</span>}
        <span
          className={`text-sm ${valeur.connue ? 'font-medium text-encre tabular-nums' : 'text-encre-douce'}`}
        >
          {valeur.texte}
        </span>
        {details
          .filter((detail) => detail !== '')
          .map((detail) => (
            <span key={detail} className="text-sm text-encre-douce">
              {detail}
            </span>
          ))}
        <span
          title={etape.raison}
          className={`text-sm ${etape.alerte ? 'font-medium text-alerte' : 'text-encre-douce'}`}
        >
          {etape.texte}
          {etape.raison !== undefined && <span className="sr-only"> · {etape.raison}</span>}
        </span>
        {action.texte !== '' && (
          <span
            className={`flex items-start gap-1 text-sm ${action.alerte ? 'font-medium text-danger' : 'text-encre'}`}
          >
            {/* L'horloge, comme les reports : une échéance, pas une case déjà cochée. */}
            <Icone
              nom="horloge"
              className={`mt-0.5 size-4 shrink-0 ${action.alerte ? '' : 'text-encre-douce'}`}
            />
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
