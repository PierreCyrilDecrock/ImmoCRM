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
import { adresseBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import { useChangementEtape } from './changement-etape'
import {
  genreEtatProjet,
  JOURS_GAGNES_VISIBLES,
  libelleEtape,
  libelleEtatProjet,
  resumeEtat,
  type EtatProjet,
} from './pipeline-vendeur'
import {
  compterProjetsParEtat,
  lirePageProjetsParEtat,
  lirePipelineVendeur,
  MAX_PROJETS_PIPELINE,
  TAILLE_PAGE_PROJETS,
  type ProjetVendeurAffiche,
} from './projets-vendeurs'
import TableauPipelineVendeur from './TableauPipeline'

type Props = {
  vue: EtatProjet
  onVue: (vue: EtatProjet) => void
  aujourdhui: string
}

type Tableau =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; projets: ProjetVendeurAffiche[]; tronque: boolean }

/** Lit une page de la liste « À recontacter », « Perdus » ou « Gagnés ». */
const lirePage: LecteurPage<ProjetVendeurAffiche> = (cle, debut, compter) => {
  const [etat] = JSON.parse(cle) as [Exclude<EtatProjet, 'actif'>, number]
  return lirePageProjetsParEtat(exigerSupabase(), { etat, debut, compter })
}

/** Les projets sortis du pipeline : à recontacter (par date), perdus, gagnés. */
function ListeHorsPipeline({
  etat,
  version,
}: {
  etat: Exclude<EtatProjet, 'actif'>
  version: number
}) {
  const liste = useListePaginee(JSON.stringify([etat, version]), lirePage, TAILLE_PAGE_PROJETS)
  if (liste.chargement) return <EtatChargement />
  if (liste.erreur !== null) {
    return <Message genre="erreur">La liste n'a pas pu être lue. {liste.erreur}</Message>
  }
  if (liste.lignes.length === 0) {
    return (
      <EtatVide icone="pipelines" titre={`Aucun projet « ${libelleEtatProjet(etat)} »`}>
        {etat === 'a_recontacter'
          ? 'Les projets reportés à plus tard s’afficheront ici, avec leur date de relance.'
          : etat === 'perdu'
            ? 'Les projets perdus s’afficheront ici, avec leur motif.'
            : 'Les mandats signés s’afficheront ici.'}
      </EtatVide>
    )
  }
  return (
    <>
      <Liste>
        {liste.lignes.map(({ id, projet, contact, bien }) => (
          <LigneListe
            key={id}
            titre={contact === null ? 'Contact introuvable' : nomComplet(contact)}
            detail={[bien === null ? null : adresseBien(bien), resumeEtat(projet)]
              .filter(Boolean)
              .join(' · ')}
            fin={
              etat === 'gagne' ? undefined : (
                <Etiquette genre={genreEtatProjet(projet.etat)}>
                  {libelleEtape(projet.etape)}
                </Etiquette>
              )
            }
            vers={`/pipelines/vendeurs/${id}`}
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
 * Onglet Vendeurs de la page Pipelines : les projets en cours en colonnes par étape
 * (glisser-déposer sur tablette et ordinateur, liste groupée sur téléphone), puis les
 * projets à recontacter, perdus et gagnés.
 */
export default function OngletVendeurs({ vue, onVue, aujourdhui }: Props) {
  const [tableau, setTableau] = useState<Tableau>({ phase: 'chargement' })
  const [comptes, setComptes] = useState<Record<EtatProjet, number | null> | null>(null)
  const [version, setVersion] = useState(0)
  const relire = useCallback(() => setVersion((v) => v + 1), [])
  const changement = useChangementEtape(relire)

  const enCours = vue === 'actif'
  useEffect(() => {
    if (!enCours) return
    let actif = true
    void lirePipelineVendeur(exigerSupabase(), aujourdhui).then((resultat) => {
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
    void compterProjetsParEtat(exigerSupabase()).then((resultat) => {
      if (actif) setComptes(resultat)
    })
    return () => {
      actif = false
    }
  }, [version])

  const vues: { valeur: EtatProjet; libelle: string; compteur?: number | null }[] = [
    { valeur: 'actif', libelle: 'En cours', compteur: comptes?.actif },
    { valeur: 'a_recontacter', libelle: 'À recontacter', compteur: comptes?.a_recontacter },
    { valeur: 'perdu', libelle: 'Perdus', compteur: comptes?.perdu },
    { valeur: 'gagne', libelle: 'Gagnés', compteur: comptes?.gagne },
  ]

  return (
    <>
      <div className="border-t border-bord pt-4">
        <Onglets libelle="Projets vendeurs" options={vues} valeur={vue} onChange={onVue} />
      </div>

      {vue !== 'actif' ? (
        <ListeHorsPipeline etat={vue} version={version} />
      ) : tableau.phase === 'chargement' ? (
        <EtatChargement />
      ) : tableau.phase === 'erreur' ? (
        <Message genre="erreur">Le pipeline n'a pas pu être lu. {tableau.message}</Message>
      ) : tableau.projets.length === 0 ? (
        <EtatVide icone="pipelines" titre="Aucun projet vendeur en cours">
          Un projet vendeur est l'intention de vendre un bien. Il se crée ici ou depuis la fiche
          d'un contact, rubrique « Projets de vente ».
        </EtatVide>
      ) : (
        <>
          {tableau.tronque && (
            <Message genre="info">
              Seuls les {MAX_PROJETS_PIPELINE} projets les plus anciens dans leur étape sont
              affichés.
            </Message>
          )}
          <TableauPipelineVendeur
            projets={tableau.projets}
            aujourdhui={aujourdhui}
            onDeposer={changement.demander}
            enCours={changement.enCours}
          />
          <p className="text-sm text-encre-douce">
            <span className="hidden md:inline">
              Glissez une carte par sa poignée pour changer son étape.{' '}
            </span>
            La colonne « Mandat signé » montre les mandats des {JOURS_GAGNES_VISIBLES} derniers
            jours ; tous sont dans « Gagnés ».
          </p>
        </>
      )}
      {changement.fenetre}
    </>
  )
}
