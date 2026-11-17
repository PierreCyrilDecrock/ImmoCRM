import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import Icone from '../../components/Icone'
import { formaterJourCourt } from '../../lib/dates'
import { communeBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import {
  ancienneteEtape,
  etapeQuiTraine,
  libelleTypeMandat,
  type ProjetVendeur,
} from './pipeline-vendeur'
import { prochaineActionProjet, type ProjetVendeurAffiche } from './projets-vendeurs'

type Props = {
  affiche: ProjetVendeurAffiche
  aujourdhui: string
  /** Fourni sur tablette et ordinateur : la poignée permet de glisser la carte. */
  onSaisir?: (evenement: PointerEvent<HTMLButtonElement>) => void
  /** La carte est en train d'être glissée, ou enregistrée. */
  estompee?: boolean
}

function ligneEtape(projet: ProjetVendeur, aujourdhui: string) {
  if (projet.etat === 'gagne' && projet.mandat_le !== null) {
    return {
      texte: `Mandat ${libelleTypeMandat(projet.mandat_type).toLowerCase()} · ${formaterJourCourt(projet.mandat_le, aujourdhui)}`,
      alerte: false,
    }
  }
  return {
    texte: ancienneteEtape(projet.etape_le, aujourdhui),
    alerte: etapeQuiTraine(projet.etape_le, aujourdhui),
  }
}

/**
 * Carte d'un projet dans le pipeline : le vendeur, le bien, l'ancienneté dans l'étape et la
 * prochaine action. Toucher la carte ouvre le projet ; sur grand écran, la poignée sert à la
 * glisser vers une autre étape.
 */
export default function CarteProjet({ affiche, aujourdhui, onSaisir, estompee = false }: Props) {
  const { projet, contact, bien } = affiche
  const etape = ligneEtape(projet, aujourdhui)
  const action = prochaineActionProjet(affiche, aujourdhui)
  const commune = bien === null ? '' : communeBien(bien)

  return (
    <div
      className={`relative rounded-xl bg-surface ring-1 ring-bord ${estompee ? 'opacity-40' : ''}`}
    >
      <Link
        to={`/pipelines/vendeurs/${projet.id}`}
        className="flex min-w-0 flex-col gap-0.5 rounded-xl p-3 break-words hover:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <span className={`font-semibold text-encre ${onSaisir === undefined ? '' : 'pr-8'}`}>
          {contact === null ? 'Contact introuvable' : nomComplet(contact)}
        </span>
        <span className="text-sm text-encre-douce">
          {bien === null ? 'Bien introuvable' : bien.adresse}
          {commune !== '' && `, ${commune}`}
        </span>
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
