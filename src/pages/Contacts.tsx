import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Bouton from '../components/Bouton'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import FenetreModale from '../components/FenetreModale'
import LigneListe from '../components/LigneListe'
import Liste from '../components/Liste'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import {
  brouillonVide,
  creerContact,
  listerContacts,
  nomDeListe,
  preparerContact,
  resumeContact,
  type Contact,
  type ErreursContact,
} from '../features/contacts/contacts'
import FormulaireContact from '../features/contacts/FormulaireContact'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; contacts: Contact[] }

/** Fenêtre de création : le strict minimum, pour noter un contact en quelques secondes. */
function NouveauContact({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [brouillon, setBrouillon] = useState(brouillonVide)
  const [erreurs, setErreurs] = useState<ErreursContact>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerContact(brouillon)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await creerContact(exigerSupabase(), preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Contact enregistré')
    // On arrive sur la fiche : c'est là que le reste se complète.
    void naviguer(`/contacts/${resultat.donnees.id}`)
  }

  return (
    <FenetreModale
      ouverte={ouverte}
      titre="Nouveau contact"
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="nouveau-contact" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="nouveau-contact"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        <FormulaireContact court brouillon={brouillon} erreurs={erreurs} onChange={setBrouillon} />
      </form>
    </FenetreModale>
  )
}

/** Liste des contacts, triée par nom, avec la création rapide et l'accès aux archives. */
export default function Contacts() {
  const [archives, setArchives] = useState(false)
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [creation, setCreation] = useState(false)

  useEffect(() => {
    let actif = true
    void listerContacts(exigerSupabase(), { archives }).then((resultat) => {
      if (!actif) return
      setEtat(
        resultat.ok
          ? { phase: 'pret', contacts: resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
  }, [archives])

  function basculerArchives() {
    setEtat({ phase: 'chargement' })
    setArchives(!archives)
  }

  const ajouter = (
    <Bouton icone="ajouter" onClick={() => setCreation(true)}>
      Ajouter
    </Bouton>
  )

  return (
    <Page titre={archives ? 'Contacts archivés' : 'Contacts'} actions={!archives && ajouter}>
      {etat.phase === 'chargement' && <EtatChargement />}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les contacts n'ont pas pu être lus. {etat.message}</Message>
      )}
      {etat.phase === 'pret' && etat.contacts.length === 0 && !archives && (
        <EtatVide icone="contacts" titre="Aucun contact pour l'instant" action={ajouter}>
          Un nom et un téléphone suffisent pour commencer : le reste se complète ensuite.
        </EtatVide>
      )}
      {etat.phase === 'pret' && etat.contacts.length === 0 && archives && (
        <EtatVide icone="archiver" titre="Aucun contact archivé">
          Les fiches que vous archivez sont rangées ici. Vous pouvez les restaurer à tout moment.
        </EtatVide>
      )}
      {etat.phase === 'pret' && etat.contacts.length > 0 && (
        <>
          <p className="text-sm text-encre-douce">
            {etat.contacts.length} {archives ? 'archivé' : 'contact'}
            {etat.contacts.length > 1 ? 's' : ''}, par ordre alphabétique
          </p>
          <Liste>
            {etat.contacts.map((contact) => (
              <LigneListe
                key={contact.id}
                titre={nomDeListe(contact)}
                detail={resumeContact(contact)}
                vers={`/contacts/${contact.id}`}
              />
            ))}
          </Liste>
        </>
      )}
      {etat.phase !== 'chargement' && (
        <div className="self-start">
          <Bouton
            variante="discret"
            icone={archives ? 'retour' : 'archiver'}
            onClick={basculerArchives}
          >
            {archives ? 'Revenir aux contacts' : 'Voir les contacts archivés'}
          </Bouton>
        </div>
      )}
      {/* La fenêtre n'existe que le temps de la saisie : elle repart vide à chaque ouverture. */}
      {creation && <NouveauContact ouverte onFermer={() => setCreation(false)} />}
    </Page>
  )
}
