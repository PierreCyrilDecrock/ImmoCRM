import TableauPipeline from '../../components/TableauPipeline'
import { nomComplet } from '../contacts/contacts'
import CarteProjetAcquereur from './CarteProjetAcquereur'
import {
  estEtapeAcquereur,
  ETAPES_ACQUEREUR,
  grouperParEtapeAcquereur,
  type EtapeAcquereur,
} from './pipeline-acquereur'
import type { ProjetAcquereurAffiche } from './projets-acquereurs'

type Props = {
  projets: readonly ProjetAcquereurAffiche[]
  aujourdhui: string
  onDeposer: (affiche: ProjetAcquereurAffiche, cible: EtapeAcquereur) => void
  enCours: string | null
}

/** Le pipeline acquéreur : une colonne par étape (liste groupée sur téléphone). */
export default function TableauPipelineAcquereur({
  projets,
  aujourdhui,
  onDeposer,
  enCours,
}: Props) {
  const colonnes = grouperParEtapeAcquereur(projets).map(({ etape, projets: dansEtape }) => {
    const { libelle, critere } = ETAPES_ACQUEREUR.find((e) => e.valeur === etape) ?? {
      libelle: etape,
      critere: '',
    }
    return { etape, libelle, critere, projets: dansEtape }
  })
  return (
    <TableauPipeline
      colonnes={colonnes}
      cle={(affiche) => affiche.id}
      etapeDe={(affiche) => affiche.projet.etape as EtapeAcquereur}
      estEtape={estEtapeAcquereur}
      nomGlisse={(affiche) => (affiche.contact === null ? 'Projet' : nomComplet(affiche.contact))}
      carte={(affiche, options) => (
        <CarteProjetAcquereur affiche={affiche} aujourdhui={aujourdhui} {...options} />
      )}
      onDeposer={(affiche, cible) => {
        // Une offre acceptée ne se déplace pas : on la reprend depuis sa fiche.
        if (affiche.projet.etat === 'actif') onDeposer(affiche, cible)
      }}
      enCours={enCours}
    />
  )
}
