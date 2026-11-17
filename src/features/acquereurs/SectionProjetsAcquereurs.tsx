import { useEffect, useState } from 'react'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import Etiquette from '../../components/Etiquette'
import LigneListe from '../../components/LigneListe'
import Message from '../../components/Message'
import { exigerSupabase } from '../../lib/supabase'
import { nomComplet, type Contact } from '../contacts/contacts'
import DemandeEntrante from './DemandeEntrante'
import {
  genreEtatAcquereur,
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
export default function SectionProjetsAcquereurs({ contact, lectureSeule = false }: Props) {
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [creation, setCreation] = useState(false)

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
  }, [contact.id])

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
          {etat.projets.map(({ id, projet, contact: principal }) => {
            const recherche = resumeRecherche(projet)
            const role =
              projet.contact_id === contact.id
                ? ''
                : `Co-acquéreur avec ${principal === null ? 'un autre contact' : nomComplet(principal)}`
            return (
              <LigneListe
                key={id}
                titre={
                  recherche === '' ? `Demande ${resumeOrigine(projet).toLowerCase()}` : recherche
                }
                detail={[role, resumeEtatAcquereur(projet)].filter(Boolean).join(' · ')}
                fin={
                  <Etiquette genre={genreEtatAcquereur(projet.etat)}>
                    {libelleEtatAcquereur(projet.etat)}
                  </Etiquette>
                }
                vers={`/pipelines/acquereurs/${id}`}
              />
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
    </Carte>
  )
}
