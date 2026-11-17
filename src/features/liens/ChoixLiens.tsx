import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import Message from '../../components/Message'
import { exigerSupabase } from '../../lib/supabase'
import { adresseBien, type Bien } from '../biens/biens'
import SelecteurBien from '../biens/SelecteurBien'
import { nomComplet, type Contact } from '../contacts/contacts'
import SelecteurContact from '../contacts/SelecteurContact'
import { libelleEtape } from '../projets/pipeline-vendeur'
import { listerProjetsVendeursLies, type ProjetVendeurAffiche } from '../projets/projets-vendeurs'

type Props = {
  /** Titre de la rubrique : « Liée à », « Lié à »… */
  legende: string
  contact: Contact | null
  bien: Bien | null
  /** Projet vendeur lié (identifiant), ou `null`. */
  projetVendeurId: string | null
  /** Lien fixé par la fiche d'où l'on vient : il ne se retire pas ici. */
  verrouiller?: 'contact' | 'bien' | 'projet'
  onContact: (contact: Contact | null) => void
  onBien: (bien: Bien | null) => void
  /** Choix du projet : avec son bien, à reprendre si aucun bien n'est encore choisi. */
  onProjetVendeur: (projet: ProjetVendeurAffiche | null) => void
}

const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/**
 * Rubrique d'un formulaire qui lie l'élément saisi (tâche, activité) à un contact et à un
 * bien : chaque lien se choisit par une recherche, s'ouvre d'un toucher et se retire.
 */
export default function ChoixLiens({
  legende,
  contact,
  bien,
  projetVendeurId,
  verrouiller,
  onContact,
  onBien,
  onProjetVendeur,
}: Props) {
  const [choix, setChoix] = useState<'contact' | 'bien' | 'projet' | null>(null)

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-encre">{legende}</legend>
      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <span className="w-16 text-sm text-encre-douce">Contact</span>
        {contact === null ? (
          <Bouton variante="discret" icone="ajouter" onClick={() => setChoix('contact')}>
            Choisir un contact
          </Bouton>
        ) : (
          <>
            <Link to={`/contacts/${contact.id}`} className={`${CLASSES_LIEN} min-w-0 break-words`}>
              {nomComplet(contact)}
            </Link>
            {verrouiller !== 'contact' && (
              <Bouton variante="discret" onClick={() => onContact(null)}>
                Retirer
              </Bouton>
            )}
          </>
        )}
      </div>
      {choix === 'contact' && (
        <SelecteurContact
          libelle="Chercher le contact"
          autoFocus
          onChoisir={(choisi) => {
            onContact(choisi)
            setChoix(null)
          }}
        />
      )}
      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <span className="w-16 text-sm text-encre-douce">Bien</span>
        {bien === null ? (
          <Bouton variante="discret" icone="ajouter" onClick={() => setChoix('bien')}>
            Choisir un bien
          </Bouton>
        ) : (
          <>
            <Link to={`/biens/${bien.id}`} className={`${CLASSES_LIEN} min-w-0 break-words`}>
              {adresseBien(bien)}
            </Link>
            {verrouiller !== 'bien' && (
              <Bouton variante="discret" onClick={() => onBien(null)}>
                Retirer
              </Bouton>
            )}
          </>
        )}
      </div>
      {choix === 'bien' && (
        <SelecteurBien
          libelle="Chercher le bien"
          autoFocus
          onChoisir={(choisi) => {
            onBien(choisi)
            setChoix(null)
          }}
        />
      )}
      {(projetVendeurId !== null || contact !== null) && (
        <div className="flex min-h-11 flex-wrap items-center gap-2">
          <span className="w-16 text-sm text-encre-douce">Projet</span>
          {projetVendeurId === null ? (
            <Bouton variante="discret" icone="ajouter" onClick={() => setChoix('projet')}>
              Lier à un projet de vente
            </Bouton>
          ) : (
            <>
              <Link to={`/pipelines/vendeurs/${projetVendeurId}`} className={CLASSES_LIEN}>
                Projet de vente
              </Link>
              {verrouiller !== 'projet' && (
                <Bouton variante="discret" onClick={() => onProjetVendeur(null)}>
                  Retirer
                </Bouton>
              )}
            </>
          )}
        </div>
      )}
      {choix === 'projet' && contact !== null && projetVendeurId === null && (
        <ProjetsDuContact
          contact={contact}
          onChoisir={(projet) => {
            onProjetVendeur(projet)
            setChoix(null)
          }}
        />
      )}
    </fieldset>
  )
}

type Projets =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; projets: ProjetVendeurAffiche[] }

/** Les projets vendeurs du contact choisi, à toucher pour lier. */
function ProjetsDuContact({
  contact,
  onChoisir,
}: {
  contact: Contact
  onChoisir: (projet: ProjetVendeurAffiche) => void
}) {
  const [etat, setEtat] = useState<Projets>({ phase: 'chargement' })

  useEffect(() => {
    let actif = true
    void listerProjetsVendeursLies(exigerSupabase(), { contactId: contact.id }).then((resultat) => {
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

  if (etat.phase === 'chargement') return <p className="text-sm text-encre-douce">Chargement…</p>
  if (etat.phase === 'erreur') {
    return <Message genre="erreur">Les projets n'ont pas pu être lus. {etat.message}</Message>
  }
  if (etat.projets.length === 0) {
    return (
      <p className="text-sm text-encre-douce">
        {nomComplet(contact)} n'a aucun projet de vente. Il se crée depuis sa fiche, rubrique «
        Projets ».
      </p>
    )
  }
  return (
    <Liste>
      {etat.projets.map(({ id, projet, bien }) => (
        <LigneListe
          key={id}
          titre={bien === null ? 'Projet de vente' : adresseBien(bien)}
          detail={libelleEtape(projet.etape)}
          onAction={() => onChoisir({ id, projet, bien, contact, prochaine: null })}
        />
      ))}
    </Liste>
  )
}
