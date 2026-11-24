import { useEffect } from 'react'
import TableauPipeline from '../../components/TableauPipeline'
import { memoriserParcours } from '../../lib/parcours'
import { titresCarteVendeur } from './carte-pipeline'
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
  // Chaque colonne est gardée pour l'onglet : la fiche d'un projet passe au précédent ou au
  // suivant de sa colonne, dans l'ordre affiché.
  const ordre = JSON.stringify(
    colonnes.map(({ etape, projets }) => [etape, projets.map((p) => p.id)]),
  )
  useEffect(() => {
    for (const [etape, ids] of JSON.parse(ordre) as [string, string[]][]) {
      memoriserParcours('projets-vendeurs', { cle: etape, total: ids.length, ids })
    }
  }, [ordre])
  return (
    <TableauPipeline
      colonnes={colonnes}
      cle={(affiche) => affiche.id}
      etapeDe={(affiche) => affiche.projet.etape as EtapeVendeur}
      estEtape={estEtapeVendeur}
      nomGlisse={(affiche) => titresCarteVendeur(affiche.contact, affiche.bien).titre}
      carte={(affiche, options) => (
        <CarteProjet affiche={affiche} aujourdhui={aujourdhui} {...options} />
      )}
      onDeposer={onDeposer}
      enCours={enCours}
    />
  )
}
