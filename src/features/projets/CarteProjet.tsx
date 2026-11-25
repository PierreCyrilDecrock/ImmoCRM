import type { PointerEvent } from 'react'
import CartePipeline from '../../components/CartePipeline'
import { formaterJourCourt } from '../../lib/dates'
import {
  actionPipeline,
  ligneAnciennete,
  titresCarteVendeur,
  valeurVendeur,
} from './carte-pipeline'
import { libelleTypeMandat, type ProjetVendeur } from './pipeline-vendeur'
import type { ProjetVendeurAffiche } from './projets-vendeurs'

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
  return ligneAnciennete(projet.etape_le, aujourdhui)
}

/**
 * Carte d'un projet vendeur : le bien (adresse courte) en titre, le vendeur dessous, ce que
 * vaut le projet (estimation ou prix espéré), l'ancienneté dans l'étape et la suite. Deux projets du même vendeur se distinguent par
 * leur adresse.
 */
export default function CarteProjet({ affiche, aujourdhui, onSaisir, estompee = false }: Props) {
  const { projet, contact, bien } = affiche
  const { titre, sousTitre } = titresCarteVendeur(contact, bien)
  return (
    <CartePipeline
      vers={`/pipelines/vendeurs/${projet.id}`}
      titre={titre}
      sousTitre={sousTitre}
      valeur={valeurVendeur(projet)}
      details={[]}
      etape={ligneEtape(projet, aujourdhui)}
      action={actionPipeline(affiche, aujourdhui)}
      onSaisir={onSaisir}
      estompee={estompee}
      // La colonne de l'étape : la fiche passe au projet voisin de cette colonne.
      etat={{ parcours: projet.etape }}
    />
  )
}
