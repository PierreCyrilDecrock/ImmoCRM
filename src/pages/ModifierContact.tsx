import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Bouton from '../components/Bouton'
import EtatChargement from '../components/EtatChargement'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import {
  brouillonDepuis,
  lireContact,
  listerContacts,
  modifierContact,
  nomComplet,
  preparerContact,
  type BrouillonContact,
  type Contact,
  type ErreursContact,
} from '../features/contacts/contacts'
import FormulaireContact from '../features/contacts/FormulaireContact'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; contact: Contact; autres: Contact[] }

/** Formulaire complet d'un contact, ouvert depuis sa fiche. */
export default function ModifierContact() {
  const { id = '' } = useParams()
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [brouillon, setBrouillon] = useState<BrouillonContact | null>(null)
  const [erreurs, setErreurs] = useState<ErreursContact>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const retour = { vers: `/contacts/${id}`, libelle: 'Fiche' }

  useEffect(() => {
    let actif = true
    const client = exigerSupabase()
    void Promise.all([lireContact(client, id), listerContacts(client)]).then(([fiche, liste]) => {
      if (!actif) return
      if (!fiche.ok) {
        setEtat({ phase: 'erreur', message: fiche.erreur.message })
        return
      }
      // Sans la liste, on peut modifier tout le reste : « Recommandé par » sera simplement vide.
      const autres = liste.ok ? liste.donnees.filter((contact) => contact.id !== id) : []
      setBrouillon(brouillonDepuis(fiche.donnees))
      setEtat({ phase: 'pret', contact: fiche.donnees, autres })
    })
    return () => {
      actif = false
    }
  }, [id])

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    if (brouillon === null) return
    const preparation = preparerContact(brouillon)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) {
      setEchec('Une information est à corriger : elle est signalée en rouge dans le formulaire.')
      // Le formulaire est long : on amène à l'écran le premier champ en erreur.
      window.requestAnimationFrame(() => {
        const champ = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        champ?.scrollIntoView({ block: 'center' })
        champ?.focus({ preventScroll: true })
      })
      return
    }
    setEnvoi(true)
    setEchec(null)
    const resultat = await modifierContact(exigerSupabase(), id, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Contact enregistré')
    void naviguer(retour.vers)
  }

  if (etat.phase === 'chargement' || brouillon === null) {
    return (
      <Page titre="Modifier le contact" retour={retour}>
        {etat.phase === 'erreur' ? (
          <Message genre="erreur">La fiche n'a pas pu être ouverte. {etat.message}</Message>
        ) : (
          <EtatChargement />
        )}
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page titre="Modifier le contact" retour={retour}>
        <Message genre="erreur">La fiche n'a pas pu être ouverte. {etat.message}</Message>
      </Page>
    )
  }

  return (
    <Page titre={`Modifier ${nomComplet(etat.contact)}`} retour={retour}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        <FormulaireContact
          brouillon={brouillon}
          erreurs={erreurs}
          onChange={setBrouillon}
          autresContacts={etat.autres}
        />
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
          <Bouton type="submit" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={() => void naviguer(retour.vers)}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Page>
  )
}
