import type { PointerEvent } from 'react'
import CartePipeline from '../../components/CartePipeline'
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

/** Carte d'un projet vendeur : le vendeur, le bien, l'ancienneté dans l'étape, la suite. */
export default function CarteProjet({ affiche, aujourdhui, onSaisir, estompee = false }: Props) {
  const { projet, contact, bien } = affiche
  const commune = bien === null ? '' : communeBien(bien)
  return (
    <CartePipeline
      vers={`/pipelines/vendeurs/${projet.id}`}
      titre={contact === null ? 'Contact introuvable' : nomComplet(contact)}
      details={[
        bien === null
          ? 'Bien introuvable'
          : `${bien.adresse}${commune === '' ? '' : `, ${commune}`}`,
      ]}
      etape={ligneEtape(projet, aujourdhui)}
      action={prochaineActionProjet(affiche, aujourdhui)}
      onSaisir={onSaisir}
      estompee={estompee}
      // La colonne de l'étape : la fiche passe au projet voisin de cette colonne.
      etat={{ parcours: projet.etape }}
    />
  )
}
