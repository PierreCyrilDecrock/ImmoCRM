import type { PointerEvent } from 'react'
import CartePipeline from '../../components/CartePipeline'
import { formaterJourCourt } from '../../lib/dates'
import { accorder } from '../../lib/nombres'
import { nomComplet } from '../contacts/contacts'
import { actionPipeline, ligneAnciennete, valeurAcquereur } from '../projets/carte-pipeline'
import { lignesCarteAcquereur, resumeOrigine } from './pipeline-acquereur'
import type { ProjetAcquereurAffiche } from './projets-acquereurs'

type Props = {
  affiche: ProjetAcquereurAffiche
  aujourdhui: string
  /** Fourni sur tablette et ordinateur : la poignée permet de glisser la carte. */
  onSaisir?: (evenement: PointerEvent<HTMLButtonElement>) => void
  estompee?: boolean
}

/**
 * Carte d'un projet acquéreur : l'acquéreur en titre, son budget dessous (« Budget 200 –
 * 300 k€ »), puis ce qu'il
 * cherche (ou l'origine de la demande tant que la recherche n'est pas précisée), la
 * sélection, l'ancienneté dans l'étape et la prochaine action.
 */
export default function CarteProjetAcquereur({
  affiche,
  aujourdhui,
  onSaisir,
  estompee = false,
}: Props) {
  const { projet, contact, coAcquereur, bienOrigine, nbProposes } = affiche
  const { titre, criteres } = lignesCarteAcquereur(
    {
      acquereur: contact === null ? null : nomComplet(contact),
      coAcquereur: coAcquereur === null ? null : nomComplet(coAcquereur),
    },
    projet,
  )
  const origine = resumeOrigine(projet)
  const details = [
    // Tant que la recherche n'est pas précisée : d'où vient la demande.
    criteres !== ''
      ? criteres
      : [origine, bienOrigine?.adresse ?? ''].filter((morceau) => morceau !== '').join(' · '),
    nbProposes === 0 ? '' : accorder(nbProposes, 'bien proposé', 'biens proposés'),
  ]
  const etape =
    projet.etat === 'gagne' && projet.offre_le !== null
      ? {
          texte: `Offre acceptée · ${formaterJourCourt(projet.offre_le, aujourdhui)}`,
          alerte: false,
        }
      : ligneAnciennete(projet.etape_le, aujourdhui)
  return (
    <CartePipeline
      vers={`/pipelines/acquereurs/${projet.id}`}
      titre={titre}
      sousTitre=""
      valeur={valeurAcquereur(projet)}
      details={details}
      etape={etape}
      action={actionPipeline(affiche, aujourdhui)}
      onSaisir={onSaisir}
      estompee={estompee}
      // La colonne de l'étape : la fiche passe au projet voisin de cette colonne.
      etat={{ parcours: projet.etape }}
    />
  )
}
