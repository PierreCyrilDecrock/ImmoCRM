import { useEffect, useState } from 'react'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import Etiquette from '../../components/Etiquette'
import LigneListe from '../../components/LigneListe'
import Message from '../../components/Message'
import { exigerSupabase } from '../../lib/supabase'
import { adresseBien, type Bien } from '../biens/biens'
import { nomComplet, type Contact } from '../contacts/contacts'
import NouveauProjetVendeur from './NouveauProjetVendeur'
import { genreEtatProjet, libelleEtatProjet, resumeEtat } from './pipeline-vendeur'
import { listerProjetsVendeursLies, type ProjetVendeurAffiche } from './projets-vendeurs'

type Props = ({ contact: Contact; bien?: undefined } | { bien: Bien; contact?: undefined }) & {
  /** Fiche archivée : on n'y ouvre pas de nouveau projet. */
  lectureSeule?: boolean
}

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; projets: ProjetVendeurAffiche[] }

/**
 * Rubrique « Projets » d'une fiche Contact ou Bien : ses projets vendeurs (en cours, à
 * recontacter, perdus, gagnés), et l'ouverture d'un nouveau projet déjà lié à la fiche.
 */
export default function SectionProjetsVendeurs(props: Props) {
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [creation, setCreation] = useState(false)
  const depuisContact = props.contact !== undefined
  const idFiche = props.contact?.id ?? props.bien?.id ?? ''

  useEffect(() => {
    let actif = true
    const lien = depuisContact ? { contactId: idFiche } : { bienId: idFiche }
    void listerProjetsVendeursLies(exigerSupabase(), lien).then((resultat) => {
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
  }, [depuisContact, idFiche])

  return (
    <Carte titre="Projets de vente">
      {etat.phase === 'chargement' && <p className="text-sm text-encre-douce">Chargement…</p>}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les projets n'ont pas pu être lus. {etat.message}</Message>
      )}
      {etat.phase === 'pret' && etat.projets.length === 0 && (
        <p className="text-sm text-encre-douce">
          {depuisContact
            ? 'Aucun projet de vente. Un contact peut en avoir plusieurs, un par bien.'
            : 'Aucun projet de vente pour ce bien.'}
        </p>
      )}
      {etat.phase === 'pret' && etat.projets.length > 0 && (
        <ul className="-mx-4 divide-y divide-bord">
          {etat.projets.map(({ id, projet, contact, bien }) => (
            <LigneListe
              key={id}
              titre={
                depuisContact
                  ? bien === null
                    ? 'Bien introuvable'
                    : adresseBien(bien)
                  : contact === null
                    ? 'Contact introuvable'
                    : nomComplet(contact)
              }
              detail={resumeEtat(projet)}
              fin={
                <Etiquette genre={genreEtatProjet(projet.etat)}>
                  {libelleEtatProjet(projet.etat)}
                </Etiquette>
              }
              vers={`/pipelines/vendeurs/${id}`}
            />
          ))}
        </ul>
      )}
      {props.lectureSeule !== true && (
        <div className="mt-3">
          <Bouton variante="secondaire" icone="ajouter" onClick={() => setCreation(true)}>
            Nouveau projet vendeur
          </Bouton>
        </div>
      )}

      {creation && (
        <NouveauProjetVendeur
          contact={props.contact}
          bien={props.bien}
          onFermer={() => setCreation(false)}
        />
      )}
    </Carte>
  )
}
