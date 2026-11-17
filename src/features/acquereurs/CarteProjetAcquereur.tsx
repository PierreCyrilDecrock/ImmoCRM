import type { PointerEvent } from 'react'
import CartePipeline from '../../components/CartePipeline'
import { formaterJourCourt } from '../../lib/dates'
import { accorder } from '../../lib/nombres'
import { nomComplet } from '../contacts/contacts'
import { ancienneteEtape, etapeQuiTraine } from '../projets/pipeline-vendeur'
import { resumeOrigine, resumeRecherche } from './pipeline-acquereur'
import { prochaineActionAcquereur, type ProjetAcquereurAffiche } from './projets-acquereurs'

type Props = {
  affiche: ProjetAcquereurAffiche
  aujourdhui: string
  /** Fourni sur tablette et ordinateur : la poignée permet de glisser la carte. */
  onSaisir?: (evenement: PointerEvent<HTMLButtonElement>) => void
  estompee?: boolean
}

/**
 * Carte d'un projet acquéreur : l'acquéreur, ce qu'il cherche (ou l'origine de la demande
 * tant que la recherche n'est pas précisée), la sélection, l'ancienneté dans l'étape et la
 * prochaine action.
 */
export default function CarteProjetAcquereur({
  affiche,
  aujourdhui,
  onSaisir,
  estompee = false,
}: Props) {
  const { projet, contact, coAcquereur, bienOrigine, nbProposes } = affiche
  const titre =
    contact === null
      ? 'Contact introuvable'
      : `${nomComplet(contact)}${coAcquereur === null ? '' : ` et ${nomComplet(coAcquereur)}`}`
  const recherche = resumeRecherche(projet)
  const origine = resumeOrigine(projet)
  const details = [
    recherche !== ''
      ? recherche
      : [origine, bienOrigine?.adresse ?? ''].filter((morceau) => morceau !== '').join(' · '),
    nbProposes === 0 ? '' : accorder(nbProposes, 'bien proposé', 'biens proposés'),
  ]
  const etape =
    projet.etat === 'gagne' && projet.offre_le !== null
      ? {
          texte: `Offre acceptée · ${formaterJourCourt(projet.offre_le, aujourdhui)}`,
          alerte: false,
        }
      : {
          texte: ancienneteEtape(projet.etape_le, aujourdhui),
          alerte: etapeQuiTraine(projet.etape_le, aujourdhui),
        }
  return (
    <CartePipeline
      vers={`/pipelines/acquereurs/${projet.id}`}
      titre={titre}
      details={details}
      etape={etape}
      action={prochaineActionAcquereur(affiche, aujourdhui)}
      onSaisir={onSaisir}
      estompee={estompee}
    />
  )
}
