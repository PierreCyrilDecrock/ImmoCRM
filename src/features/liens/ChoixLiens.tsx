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
import { libelleEtapeAcquereur, resumeRecherche } from '../acquereurs/pipeline-acquereur'
import { listerProjetsAcquereursDuContact } from '../acquereurs/projets-acquereurs'
import { libelleEtape } from '../projets/pipeline-vendeur'
import { listerProjetsVendeursLies } from '../projets/projets-vendeurs'
import { adresseProjet, libelleGenreProjet, type LienProjet } from './lien-projet'

/** Un projet choisi : son lien et, pour un projet de vente, son bien. */
export type ChoixProjet = { lien: LienProjet; bien: Bien | null }

type Props = {
  /** Titre de la rubrique : « Liée à », « Lié à »… */
  legende: string
  contact: Contact | null
  bien: Bien | null
  /** Projet (de vente ou d'achat) lié, ou `null`. */
  projet: LienProjet | null
  /** Lien fixé par la fiche d'où l'on vient : il ne se retire pas ici. */
  verrouiller?: 'contact' | 'bien' | 'projet'
  onContact: (contact: Contact | null) => void
  onBien: (bien: Bien | null) => void
  /** Choix du projet : avec son bien, à reprendre si aucun bien n'est encore choisi. */
  onProjet: (projet: ChoixProjet | null) => void
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
  projet,
  verrouiller,
  onContact,
  onBien,
  onProjet,
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
      {(projet !== null || contact !== null) && (
        <div className="flex min-h-11 flex-wrap items-center gap-2">
          <span className="w-16 text-sm text-encre-douce">Projet</span>
          {projet === null ? (
            <Bouton variante="discret" icone="ajouter" onClick={() => setChoix('projet')}>
              Lier à un projet
            </Bouton>
          ) : (
            <>
              <Link to={adresseProjet(projet)} className={CLASSES_LIEN}>
                {libelleGenreProjet(projet.genre)}
              </Link>
              {verrouiller !== 'projet' && (
                <Bouton variante="discret" onClick={() => onProjet(null)}>
                  Retirer
                </Bouton>
              )}
            </>
          )}
        </div>
      )}
      {choix === 'projet' && contact !== null && projet === null && (
        <ProjetsDuContact
          contact={contact}
          onChoisir={(choisi) => {
            onProjet(choisi)
            setChoix(null)
          }}
        />
      )}
    </fieldset>
  )
}

/** Un projet du contact, tel qu'il est proposé dans la liste. */
type ProjetPropose = { choix: ChoixProjet; titre: string; detail: string }

type Projets =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; projets: ProjetPropose[] }

/** Les projets de vente et d'achat du contact choisi, à toucher pour lier. */
function ProjetsDuContact({
  contact,
  onChoisir,
}: {
  contact: Contact
  onChoisir: (projet: ChoixProjet) => void
}) {
  const [etat, setEtat] = useState<Projets>({ phase: 'chargement' })

  useEffect(() => {
    let actif = true
    const client = exigerSupabase()
    void Promise.all([
      listerProjetsVendeursLies(client, { contactId: contact.id }),
      listerProjetsAcquereursDuContact(client, contact.id),
    ]).then(([ventes, achats]) => {
      if (!actif) return
      if (!ventes.ok || !achats.ok) {
        const echec = !ventes.ok ? ventes.erreur.message : !achats.ok ? achats.erreur.message : ''
        setEtat({ phase: 'erreur', message: echec })
        return
      }
      setEtat({
        phase: 'pret',
        projets: [
          ...ventes.donnees.map(({ id, projet, bien }) => ({
            choix: { lien: { genre: 'vendeur' as const, id }, bien },
            titre: `Vente : ${bien === null ? 'bien introuvable' : adresseBien(bien)}`,
            detail: libelleEtape(projet.etape),
          })),
          ...achats.donnees.map(({ id, projet }) => ({
            choix: { lien: { genre: 'acquereur' as const, id }, bien: null },
            titre: `Achat : ${resumeRecherche(projet) || 'recherche à préciser'}`,
            detail: libelleEtapeAcquereur(projet.etape),
          })),
        ],
      })
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
        {nomComplet(contact)} n'a aucun projet. Un projet de vente ou d'achat se crée depuis sa
        fiche.
      </p>
    )
  }
  return (
    <Liste>
      {etat.projets.map(({ choix, titre, detail }) => (
        <LigneListe
          key={choix.lien.id}
          titre={titre}
          detail={detail}
          onAction={() => onChoisir(choix)}
        />
      ))}
    </Liste>
  )
}
