import TableauPipeline from '../../components/TableauPipeline'
import { nomComplet } from '../contacts/contacts'
import CarteProjet from './CarteProjet'
import {
  estEtapeVendeur,
  ETAPES_VENDEUR,
  grouperParEtape,
  type EtapeVendeur,
} from './pipeline-vendeur'
import type { ProjetVendeurAffiche } from './projets-vendeurs'

type Props = {
  projets: readonly ProjetVendeurAffiche[]
  aujourdhui: string
  /** Une carte a été déposée dans une autre colonne. */
  onDeposer: (affiche: ProjetVendeurAffiche, cible: EtapeVendeur) => void
  /** Projet en cours d'enregistrement : sa carte est estompée. */
  enCours: string | null
}

/** Le pipeline vendeur : une colonne par étape (liste groupée sur téléphone). */
export default function TableauPipelineVendeur({ projets, aujourdhui, onDeposer, enCours }: Props) {
  const colonnes = grouperParEtape(projets).map(({ etape, projets: dansEtape }) => {
    const { libelle, critere } = ETAPES_VENDEUR.find((e) => e.valeur === etape) ?? {
      libelle: etape,
      critere: '',
    }
    return { etape, libelle, critere, projets: dansEtape }
  })
  return (
    <TableauPipeline
      colonnes={colonnes}
      cle={(affiche) => affiche.id}
      etapeDe={(affiche) => affiche.projet.etape as EtapeVendeur}
      estEtape={estEtapeVendeur}
      nomGlisse={(affiche) => (affiche.contact === null ? 'Projet' : nomComplet(affiche.contact))}
      carte={(affiche, options) => (
        <CarteProjet affiche={affiche} aujourdhui={aujourdhui} {...options} />
      )}
      onDeposer={onDeposer}
      enCours={enCours}
    />
  )
}
