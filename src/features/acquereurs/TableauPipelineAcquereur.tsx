import { useEffect } from 'react'
import TableauPipeline from '../../components/TableauPipeline'
import { memoriserParcours } from '../../lib/parcours'
import { nomComplet } from '../contacts/contacts'
import { montantAcquereur, totalColonne } from '../projets/carte-pipeline'
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
    // Sur ordinateur, sous le titre : « 2 · 720 k€ », la somme des budgets maximum.
    const total = totalColonne(dansEtape.map((affiche) => montantAcquereur(affiche.projet)))
    return { etape, libelle, critere, total, projets: dansEtape }
  })
  // Chaque colonne est gardée pour l'onglet : la fiche d'un projet passe au précédent ou au
  // suivant de sa colonne, dans l'ordre affiché.
  const ordre = JSON.stringify(
    colonnes.map(({ etape, projets }) => [etape, projets.map((p) => p.id)]),
  )
  useEffect(() => {
    for (const [etape, ids] of JSON.parse(ordre) as [string, string[]][]) {
      memoriserParcours('projets-acquereurs', { cle: etape, total: ids.length, ids })
    }
  }, [ordre])
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
