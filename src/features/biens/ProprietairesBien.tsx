import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import ChampSaisie from '../../components/ChampSaisie'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import { nomComplet, type Contact } from '../contacts/contacts'
import SelecteurContact from '../contacts/SelecteurContact'
import {
  ajouterProprietaire,
  formaterQuotePart,
  lireQuotePart,
  listerProprietaires,
  modifierQuotePart,
  remarqueQuotesParts,
  retirerProprietaire,
  type Proprietaire,
} from './proprietaires'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; proprietaires: Proprietaire[] }

/** Ce que la fenêtre est en train de faire : choisir un contact, puis préciser sa quote-part. */
type Saisie =
  { etape: 'choix' } | { etape: 'part'; contact: Contact; lienId: string | null; quotePart: string }

const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/**
 * Carte « Propriétaires » de la fiche d'un bien : la liste (chaque nom ouvre la fiche du
 * contact), l'ajout par la recherche, la quote-part facultative et le retrait.
 */
export default function ProprietairesBien({ bienId }: { bienId: string }) {
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [saisie, setSaisie] = useState<Saisie | null>(null)
  const [erreurPart, setErreurPart] = useState<string | undefined>(undefined)
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    const resultat = await listerProprietaires(exigerSupabase(), bienId)
    setEtat(
      resultat.ok
        ? { phase: 'pret', proprietaires: resultat.donnees }
        : { phase: 'erreur', message: resultat.erreur.message },
    )
  }

  useEffect(() => {
    let actif = true
    void listerProprietaires(exigerSupabase(), bienId).then((resultat) => {
      if (!actif) return
      setEtat(
        resultat.ok
          ? { phase: 'pret', proprietaires: resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
  }, [bienId])

  const proprietaires = etat.phase === 'pret' ? etat.proprietaires : []

  function fermer() {
    setSaisie(null)
    setErreurPart(undefined)
  }

  function choisir(contact: Contact) {
    const existant = proprietaires.find((p) => p.contact.id === contact.id)
    // Déjà propriétaire : on propose de corriger sa quote-part plutôt que de l'ajouter deux fois.
    setSaisie({
      etape: 'part',
      contact,
      lienId: existant?.lien.id ?? null,
      quotePart: existant?.lien.quote_part?.toString().replace('.', ',') ?? '',
    })
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    if (saisie === null || saisie.etape !== 'part') return
    const part = lireQuotePart(saisie.quotePart)
    if (part === 'invalide') {
      setErreurPart('Indiquez un pourcentage entre 0 et 100. Exemple : 50.')
      return
    }
    setErreurPart(undefined)
    setEnvoi(true)
    const client = exigerSupabase()
    const resultat =
      saisie.lienId === null
        ? await ajouterProprietaire(client, {
            bienId,
            contactId: saisie.contact.id,
            quotePart: part,
          })
        : await modifierQuotePart(client, saisie.lienId, part)
    setEnvoi(false)
    if (!resultat.ok) {
      notifier('erreur', `L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', saisie.lienId === null ? 'Propriétaire ajouté' : 'Quote-part enregistrée')
    fermer()
    await charger()
  }

  async function retirer(lienId: string) {
    setEnvoi(true)
    const resultat = await retirerProprietaire(exigerSupabase(), lienId)
    setEnvoi(false)
    if (!resultat.ok) {
      notifier('erreur', `L'action a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Propriétaire retiré')
    fermer()
    await charger()
  }

  const remarque = remarqueQuotesParts(proprietaires.map((p) => p.lien.quote_part))

  return (
    <Carte titre="Propriétaires">
      {etat.phase === 'chargement' && <p className="text-sm text-encre-douce">Chargement…</p>}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les propriétaires n'ont pas pu être lus. {etat.message}</Message>
      )}
      {etat.phase === 'pret' && proprietaires.length === 0 && (
        <p className="text-sm text-encre-douce">Aucun propriétaire lié pour l'instant.</p>
      )}
      {proprietaires.length > 0 && (
        <ul className="divide-y divide-bord">
          {proprietaires.map(({ lien, contact }) => (
            <li key={lien.id} className="flex min-h-11 items-center gap-3 py-1">
              <span className="min-w-0 flex-1">
                <Link to={`/contacts/${contact.id}`} className={`${CLASSES_LIEN} break-words`}>
                  {nomComplet(contact)}
                </Link>
                {contact.archived_at !== null && (
                  <span className="text-sm text-encre-douce"> (fiche archivée)</span>
                )}
              </span>
              <Bouton
                variante="discret"
                aria-label={`Quote-part de ${nomComplet(contact)}`}
                onClick={() => choisir(contact)}
              >
                {lien.quote_part === null ? 'Quote-part' : formaterQuotePart(lien.quote_part)}
              </Bouton>
            </li>
          ))}
        </ul>
      )}
      {remarque !== null && <p className="mt-2 text-sm text-alerte">{remarque}</p>}
      {etat.phase === 'pret' && (
        <div className="mt-3">
          <Bouton
            variante="secondaire"
            icone="ajouter"
            onClick={() => setSaisie({ etape: 'choix' })}
          >
            Ajouter un propriétaire
          </Bouton>
        </div>
      )}

      {saisie?.etape === 'choix' && (
        <FenetreModale ouverte titre="Qui est propriétaire ?" onFermer={fermer}>
          <div className="flex flex-col gap-3">
            <p className="text-base text-encre">
              Cherchez le contact dans votre fichier. S'il n'y est pas encore, créez d'abord sa
              fiche depuis « Contacts ».
            </p>
            <SelecteurContact libelle="Chercher le propriétaire" autoFocus onChoisir={choisir} />
          </div>
        </FenetreModale>
      )}

      {saisie?.etape === 'part' && (
        <FenetreModale
          ouverte
          titre={nomComplet(saisie.contact)}
          onFermer={fermer}
          pied={
            <>
              <Bouton type="submit" form="quote-part" pleineLargeur disabled={envoi}>
                {envoi ? 'Enregistrement…' : saisie.lienId === null ? 'Ajouter' : 'Enregistrer'}
              </Bouton>
              {saisie.lienId !== null && (
                <Bouton
                  variante="secondaire"
                  pleineLargeur
                  disabled={envoi}
                  onClick={() => void retirer(saisie.lienId ?? '')}
                >
                  Retirer ce propriétaire
                </Bouton>
              )}
              <Bouton variante="secondaire" pleineLargeur onClick={fermer}>
                Annuler
              </Bouton>
            </>
          }
        >
          <form
            id="quote-part"
            noValidate
            className="flex flex-col gap-3"
            onSubmit={(evenement) => void enregistrer(evenement)}
          >
            <ChampSaisie
              libelle="Quote-part (%)"
              inputMode="decimal"
              autoComplete="off"
              maxLength={8}
              placeholder="50"
              aide="Facultative : laissez vide si vous ne la connaissez pas."
              value={saisie.quotePart}
              onChange={(evenement) => setSaisie({ ...saisie, quotePart: evenement.target.value })}
              erreur={erreurPart}
            />
            {saisie.lienId !== null && (
              <p className="text-sm text-encre-douce">
                Retirer ce propriétaire ne supprime ni sa fiche ni le bien : seul le lien entre les
                deux disparaît.
              </p>
            )}
          </form>
        </FenetreModale>
      )}
    </Carte>
  )
}
