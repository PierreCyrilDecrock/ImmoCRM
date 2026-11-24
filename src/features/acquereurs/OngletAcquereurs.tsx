import { useCallback, useEffect, useState } from 'react'
import EtatChargement from '../../components/EtatChargement'
import EtatVide from '../../components/EtatVide'
import Etiquette from '../../components/Etiquette'
import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import Message from '../../components/Message'
import Onglets from '../../components/Onglets'
import SuiteListe from '../../components/SuiteListe'
import { useListePaginee, type LecteurPage } from '../../lib/liste-paginee'
import { exigerSupabase } from '../../lib/supabase'
import { nomComplet } from '../contacts/contacts'
import { useChangementEtapeAcquereur } from './changement-etape-acquereur'
import {
  genreEtatAcquereur,
  libelleEtapeAcquereur,
  libelleEtatAcquereur,
  resumeEtatAcquereur,
  resumeRecherche,
  type EtatProjetAcquereur,
} from './pipeline-acquereur'
import {
  compterProjetsAcquereursParEtat,
  JOURS_OFFRES_VISIBLES,
  lirePageProjetsAcquereursParEtat,
  lirePipelineAcquereur,
  MAX_PROJETS_ACQUEREURS_PIPELINE,
  TAILLE_PAGE_PROJETS_ACQUEREURS,
  type ProjetAcquereurAffiche,
} from './projets-acquereurs'
import TableauPipelineAcquereur from './TableauPipelineAcquereur'

type Props = {
  vue: EtatProjetAcquereur
  onVue: (vue: EtatProjetAcquereur) => void
  aujourdhui: string
}

type Tableau =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; projets: ProjetAcquereurAffiche[]; tronque: boolean }

const lirePage: LecteurPage<ProjetAcquereurAffiche> = (cle, debut, compter) => {
  const [etat] = JSON.parse(cle) as [Exclude<EtatProjetAcquereur, 'actif'>, number]
  return lirePageProjetsAcquereursParEtat(exigerSupabase(), { etat, debut, compter })
}

function ListeHorsPipeline({
  etat,
  version,
}: {
  etat: Exclude<EtatProjetAcquereur, 'actif'>
  version: number
}) {
  const liste = useListePaginee(
    JSON.stringify([etat, version]),
    lirePage,
    TAILLE_PAGE_PROJETS_ACQUEREURS,
  )
  if (liste.chargement) return <EtatChargement />
  if (liste.erreur !== null) {
    return <Message genre="erreur">La liste n'a pas pu être lue. {liste.erreur}</Message>
  }
  if (liste.lignes.length === 0) {
    return (
      <EtatVide icone="pipelines" titre={`Aucun projet « ${libelleEtatAcquereur(etat)} »`}>
        {etat === 'a_recontacter'
          ? 'Les recherches reportées à plus tard s’afficheront ici, avec leur date de relance.'
          : etat === 'perdu'
            ? 'Les recherches perdues s’afficheront ici, avec leur motif.'
            : 'Les offres acceptées s’afficheront ici.'}
      </EtatVide>
    )
  }
  return (
    <>
      <Liste>
        {liste.lignes.map(({ id, projet, contact }) => (
          <LigneListe
            key={id}
            titre={contact === null ? 'Contact introuvable' : nomComplet(contact)}
            detail={[resumeRecherche(projet), resumeEtatAcquereur(projet)]
              .filter(Boolean)
              .join(' · ')}
            fin={
              etat === 'gagne' ? undefined : (
                <Etiquette genre={genreEtatAcquereur(projet.etat)}>
                  {libelleEtapeAcquereur(projet.etape)}
                </Etiquette>
              )
            }
            vers={`/pipelines/acquereurs/${id}`}
          />
        ))}
      </Liste>
      <SuiteListe
        resteALire={liste.resteALire}
        suiteEnCours={liste.suiteEnCours}
        erreurSuite={liste.erreurSuite}
        chargerSuite={liste.chargerSuite}
      />
    </>
  )
}

/**
 * Onglet Acquéreurs de la page Pipelines, sur le modèle de l'onglet Vendeurs : les
 * recherches en cours par étape (demande, qualification, sélection, visites), puis les
 * projets à recontacter, perdus et gagnés (offre acceptée).
 */
export default function OngletAcquereurs({ vue, onVue, aujourdhui }: Props) {
  const [tableau, setTableau] = useState<Tableau>({ phase: 'chargement' })
  const [comptes, setComptes] = useState<Record<EtatProjetAcquereur, number | null> | null>(null)
  const [version, setVersion] = useState(0)
  const relire = useCallback(() => setVersion((v) => v + 1), [])
  const changement = useChangementEtapeAcquereur(relire)

  const enCours = vue === 'actif'
  useEffect(() => {
    if (!enCours) return
    let actif = true
    void lirePipelineAcquereur(exigerSupabase(), aujourdhui).then((resultat) => {
      if (!actif) return
      setTableau(
        resultat.ok
          ? { phase: 'pret', ...resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
  }, [enCours, aujourdhui, version])

  useEffect(() => {
    let actif = true
    void compterProjetsAcquereursParEtat(exigerSupabase()).then((resultat) => {
      if (actif) setComptes(resultat)
    })
    return () => {
      actif = false
    }
  }, [version])

  const vues: { valeur: EtatProjetAcquereur; libelle: string; compteur?: number | null }[] = [
    { valeur: 'actif', libelle: 'En cours', compteur: comptes?.actif },
    { valeur: 'a_recontacter', libelle: 'À recontacter', compteur: comptes?.a_recontacter },
    { valeur: 'perdu', libelle: 'Perdus', compteur: comptes?.perdu },
    { valeur: 'gagne', libelle: 'Gagnés', compteur: comptes?.gagne },
  ]

  return (
    <>
      <Onglets
        forme="pastilles"
        libelle="Projets acquéreurs"
        options={vues}
        valeur={vue}
        onChange={onVue}
      />

      {vue !== 'actif' ? (
        <ListeHorsPipeline etat={vue} version={version} />
      ) : tableau.phase === 'chargement' ? (
        <EtatChargement />
      ) : tableau.phase === 'erreur' ? (
        <Message genre="erreur">Le pipeline n'a pas pu être lu. {tableau.message}</Message>
      ) : tableau.projets.length === 0 ? (
        <EtatVide icone="pipelines" titre="Aucune recherche en cours">
          Un projet acquéreur est une recherche. Il naît d'une demande (appel ou portail), saisie
          ici en un écran, ou depuis la fiche d'un contact, rubrique « Projets d'achat ».
        </EtatVide>
      ) : (
        <>
          {tableau.tronque && (
            <Message genre="info">
              Seuls les {MAX_PROJETS_ACQUEREURS_PIPELINE} projets les plus anciens dans leur étape
              sont affichés.
            </Message>
          )}
          <TableauPipelineAcquereur
            projets={tableau.projets}
            aujourdhui={aujourdhui}
            onDeposer={changement.demander}
            enCours={changement.enCours}
          />
          <p className="text-sm text-encre-douce">
            <span className="hidden md:inline">
              Glissez une carte par sa poignée pour changer son étape.{' '}
            </span>
            La colonne « Visites » montre aussi les offres acceptées des {JOURS_OFFRES_VISIBLES}{' '}
            derniers jours ; toutes sont dans « Gagnés ».
          </p>
        </>
      )}
      {changement.fenetre}
    </>
  )
}
