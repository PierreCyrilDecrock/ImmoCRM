import { useEffect, useState } from 'react'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import Etiquette from '../../components/Etiquette'
import BarreEtapes from '../../components/BarreEtapes'
import LigneListe from '../../components/LigneListe'
import Message from '../../components/Message'
import { dateDuJour } from '../../lib/dates'
import { etatsEtapes, phraseManque, phrasePassage } from '../../lib/etapes'
import { exigerSupabase } from '../../lib/supabase'
import { ancienneteFrise } from '../projets/pipeline-vendeur'
import { useChangementEtapeAcquereur } from './changement-etape-acquereur'
import { nomComplet, type Contact } from '../contacts/contacts'
import DemandeEntrante from './DemandeEntrante'
import {
  aideEtapeSuivanteAcquereur,
  ETAPES_ACQUEREUR,
  genreEtatAcquereur,
  libelleEtapeAcquereur,
  libelleEtatAcquereur,
  resumeEtatAcquereur,
  resumeOrigine,
  resumeRecherche,
} from './pipeline-acquereur'
import { listerProjetsAcquereursDuContact, type ProjetAcquereurAffiche } from './projets-acquereurs'

type Props = {
  contact: Contact
  /** Fiche archivée : on n'y ouvre pas de nouveau projet. */
  lectureSeule?: boolean
  /** Sous chaque projet du pipeline, ses étapes en barre et « Étape suivante » (fiche Contact). */
  avecEtapes?: boolean
}

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; projets: ProjetAcquereurAffiche[] }

/**
 * Rubrique « Projets d'achat » d'une fiche Contact : ses recherches, comme acquéreur
 * principal ou comme co-acquéreur, et l'ouverture d'une nouvelle demande. Avec la rubrique
 * « Projets de vente », elle montre tous les projets d'une même personne.
 */
export default function SectionProjetsAcquereurs({
  contact,
  lectureSeule = false,
  avecEtapes = false,
}: Props) {
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [creation, setCreation] = useState(false)
  // Change après un changement d'étape : la liste se relit.
  const [version, setVersion] = useState(0)
  const changement = useChangementEtapeAcquereur(() => setVersion((v) => v + 1))
  const aujourdhui = dateDuJour()

  useEffect(() => {
    let actif = true
    void listerProjetsAcquereursDuContact(exigerSupabase(), contact.id).then((resultat) => {
      if (!actif) return
      setEtat(
        resultat.ok
          ? { phase: 'pret', projets: resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
  }, [contact.id, version])

  return (
    <Carte titre="Projets d'achat">
      {etat.phase === 'chargement' && <p className="text-sm text-encre-douce">Chargement…</p>}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les projets n'ont pas pu être lus. {etat.message}</Message>
      )}
      {etat.phase === 'pret' && etat.projets.length === 0 && (
        <p className="text-sm text-encre-douce">
          Aucun projet d'achat. Une même personne peut vendre et chercher en même temps.
        </p>
      )}
      {etat.phase === 'pret' && etat.projets.length > 0 && (
        <ul className="-mx-4 divide-y divide-bord">
          {etat.projets.map((affiche) => {
            const { id, projet, contact: principal } = affiche
            const recherche = resumeRecherche(projet)
            const role =
              projet.contact_id === contact.id
                ? ''
                : `Co-acquéreur avec ${principal === null ? 'un autre contact' : nomComplet(principal)}`
            const dansLePipeline =
              avecEtapes &&
              projet.archived_at === null &&
              (projet.etat === 'actif' || projet.etat === 'gagne')
            const aide =
              projet.etat === 'actif'
                ? aideEtapeSuivanteAcquereur(projet, affiche.nbProposes)
                : null
            return (
              <li key={id}>
                <ul>
                  <LigneListe
                    titre={
                      recherche === ''
                        ? `Demande ${resumeOrigine(projet).toLowerCase()}`
                        : recherche
                    }
                    // L'étape d'un projet en cours est dans la frise dessous : pas deux fois.
                    detail={[
                      role,
                      dansLePipeline && projet.etat === 'actif' ? '' : resumeEtatAcquereur(projet),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    fin={
                      <Etiquette genre={genreEtatAcquereur(projet.etat)}>
                        {libelleEtatAcquereur(projet.etat)}
                      </Etiquette>
                    }
                    vers={`/pipelines/acquereurs/${id}`}
                  />
                </ul>
                {dansLePipeline && (
                  <div className="px-4 pb-4">
                    <BarreEtapes
                      etapes={etatsEtapes(ETAPES_ACQUEREUR, projet.etape, projet.etat === 'gagne')}
                      anciennete={
                        projet.etat === 'actif'
                          ? ancienneteFrise(projet.etape_le, aujourdhui)
                          : undefined
                      }
                      critere={
                        projet.etat !== 'actif'
                          ? undefined
                          : aide === null
                            ? 'Dernière étape : l’offre acceptée se note depuis la fiche du projet.'
                            : phrasePassage(libelleEtapeAcquereur(aide.suivante), aide.critere)
                      }
                      manque={aide === null ? undefined : phraseManque(aide.manquantes)}
                      suivante={
                        aide === null || lectureSeule
                          ? undefined
                          : {
                              libelle: libelleEtapeAcquereur(aide.suivante),
                              onPasser: () => changement.demander(affiche, aide.suivante),
                              desactive: changement.enCours !== null,
                            }
                      }
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {!lectureSeule && (
        <div className="mt-3">
          <Bouton variante="secondaire" icone="ajouter" onClick={() => setCreation(true)}>
            Nouveau projet d'achat
          </Bouton>
        </div>
      )}
      {creation && <DemandeEntrante contact={contact} onFermer={() => setCreation(false)} />}
      {changement.fenetre}
    </Carte>
  )
}
