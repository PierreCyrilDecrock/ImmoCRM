import { useCallback, useEffect, useState } from 'react'
import Bouton from '../components/Bouton'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Etiquette from '../components/Etiquette'
import LigneListe from '../components/LigneListe'
import Liste from '../components/Liste'
import Message from '../components/Message'
import Onglets from '../components/Onglets'
import Page from '../components/Page'
import SuiteListe from '../components/SuiteListe'
import { adresseBien } from '../features/biens/biens'
import { nomComplet } from '../features/contacts/contacts'
import { useChangementEtape } from '../features/projets/changement-etape'
import NouveauProjetVendeur from '../features/projets/NouveauProjetVendeur'
import {
  genreEtatProjet,
  JOURS_GAGNES_VISIBLES,
  libelleEtape,
  libelleEtatProjet,
  resumeEtat,
  type EtatProjet,
} from '../features/projets/pipeline-vendeur'
import {
  compterProjetsParEtat,
  lirePageProjetsParEtat,
  lirePipelineVendeur,
  MAX_PROJETS_PIPELINE,
  TAILLE_PAGE_PROJETS,
  type ProjetVendeurAffiche,
} from '../features/projets/projets-vendeurs'
import TableauPipeline from '../features/projets/TableauPipeline'
import { dateDuJour } from '../lib/dates'
import { useListePaginee, type LecteurPage } from '../lib/liste-paginee'
import { exigerSupabase } from '../lib/supabase'

type Pipeline = 'vendeurs' | 'acquereurs'
type Vue = EtatProjet

const CLE_SESSION = 'immocrm.pipelines'

function lireMemoire(): { pipeline: Pipeline; vue: Vue } {
  try {
    const lu = JSON.parse(sessionStorage.getItem(CLE_SESSION) ?? '{}') as Record<string, unknown>
    const pipeline = lu.pipeline === 'acquereurs' ? 'acquereurs' : 'vendeurs'
    const vue = ['actif', 'a_recontacter', 'perdu', 'gagne'].includes(String(lu.vue))
      ? (lu.vue as Vue)
      : 'actif'
    return { pipeline, vue }
  } catch {
    return { pipeline: 'vendeurs', vue: 'actif' }
  }
}

function memoriser(valeur: { pipeline: Pipeline; vue: Vue }) {
  try {
    sessionStorage.setItem(CLE_SESSION, JSON.stringify(valeur))
  } catch {
    // Mémoire de l'onglet indisponible (navigation privée) : on s'en passe.
  }
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
 * Page Pipelines. Onglet Vendeurs : les projets en cours en colonnes par étape (glisser-
 * déposer sur tablette et ordinateur, liste groupée sur téléphone), puis les projets à
 * recontacter, perdus et gagnés. Onglet Acquéreurs : à venir (étape 1.10).
 */
export default function Pipelines() {
  const [memoire, setMemoire] = useState(lireMemoire)
  const [tableau, setTableau] = useState<Tableau>({ phase: 'chargement' })
  const [comptes, setComptes] = useState<Record<EtatProjet, number | null> | null>(null)
  const [version, setVersion] = useState(0)
  const [creation, setCreation] = useState(false)
  const aujourdhui = dateDuJour()
  const relire = useCallback(() => setVersion((v) => v + 1), [])
  const changement = useChangementEtape(relire)

  function choisir(valeur: Partial<{ pipeline: Pipeline; vue: Vue }>) {
    const suivante = { ...memoire, ...valeur }
    setMemoire(suivante)
    memoriser(suivante)
  }

  const vendeursEnCours = memoire.pipeline === 'vendeurs' && memoire.vue === 'actif'
  useEffect(() => {
    if (!vendeursEnCours) return
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
  }, [vendeursEnCours, aujourdhui, version])

  useEffect(() => {
    let actif = true
    void compterProjetsParEtat(exigerSupabase()).then((resultat) => {
      if (actif) setComptes(resultat)
    })
    return () => {
      actif = false
    }
  }, [version])

  const vues: { valeur: Vue; libelle: string; compteur?: number | null }[] = [
    { valeur: 'actif', libelle: 'En cours', compteur: comptes?.actif },
    { valeur: 'a_recontacter', libelle: 'À recontacter', compteur: comptes?.a_recontacter },
    { valeur: 'perdu', libelle: 'Perdus', compteur: comptes?.perdu },
    { valeur: 'gagne', libelle: 'Gagnés', compteur: comptes?.gagne },
  ]

  return (
    <Page
      titre="Pipelines"
      actions={
        memoire.pipeline === 'vendeurs' ? (
          <Bouton icone="ajouter" onClick={() => setCreation(true)}>
            Projet vendeur
          </Bouton>
        ) : undefined
      }
    >
      <Onglets
        libelle="Pipeline"
        options={[
          { valeur: 'vendeurs', libelle: 'Vendeurs' },
          { valeur: 'acquereurs', libelle: 'Acquéreurs' },
        ]}
        valeur={memoire.pipeline}
        onChange={(pipeline) => choisir({ pipeline })}
      />

      {memoire.pipeline === 'acquereurs' ? (
        <EtatVide icone="pipelines" titre="Pipeline acquéreur à venir">
          Les projets acquéreurs et leur pipeline (demande, qualification, sélection, visites)
          arrivent à l'étape suivante.
        </EtatVide>
      ) : (
        <>
          <div className="border-t border-bord pt-4">
            <Onglets
              libelle="Projets vendeurs"
              options={vues}
              valeur={memoire.vue}
              onChange={(vue) => choisir({ vue })}
            />
          </div>

          {memoire.vue !== 'actif' ? (
            <ListeHorsPipeline etat={memoire.vue} version={version} />
          ) : tableau.phase === 'chargement' ? (
            <EtatChargement />
          ) : tableau.phase === 'erreur' ? (
            <Message genre="erreur">Le pipeline n'a pas pu être lu. {tableau.message}</Message>
          ) : tableau.projets.length === 0 ? (
            <EtatVide
              icone="pipelines"
              titre="Aucun projet vendeur en cours"
              action={
                <Bouton icone="ajouter" onClick={() => setCreation(true)}>
                  Nouveau projet vendeur
                </Bouton>
              }
            >
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
              <TableauPipeline
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
        </>
      )}

      {changement.fenetre}
      {creation && <NouveauProjetVendeur onFermer={() => setCreation(false)} />}
    </Page>
  )
}
