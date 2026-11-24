import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import FenetreModale from '../../components/FenetreModale'
import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import {
  adresseBien,
  brouillonBienVide,
  creerBien,
  preparerBien,
  resumeBien,
  type Bien,
  type ErreursBien,
} from '../biens/biens'
import FormulaireBien from '../biens/FormulaireBien'
import { ajouterProprietaire, listerBiensDuContact } from '../biens/proprietaires'
import SelecteurBien from '../biens/SelecteurBien'
import { nomComplet, type Contact } from '../contacts/contacts'
import SelecteurContact from '../contacts/SelecteurContact'
import AutreCreation from '../saisie/AutreCreation'
import { creerProjetVendeur, projetEnCoursDuBien } from './projets-vendeurs'

type Props = {
  /** Le vendeur, fixé quand on part de sa fiche. */
  contact?: Contact
  /** Le bien, fixé quand on part de sa fiche. */
  bien?: Bien
  onFermer: () => void
  /** Ouverte directement par le « + » : « Créer autre chose » ouvre le menu complet. */
  onAutreChose?: () => void
}

/**
 * Création d'un projet vendeur : le vendeur et le bien à vendre. Le bien se choisit parmi
 * ceux dont le contact est propriétaire, par une recherche, ou se crée sur place (adresse et
 * type) ; le contact en devient alors propriétaire, sauf avis contraire. Le projet commence
 * à l'étape « Premier contact » ; sa fiche s'ouvre ensuite.
 */
export default function NouveauProjetVendeur({
  contact: contactFixe,
  bien: bienFixe,
  onFermer,
  onAutreChose,
}: Props) {
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [contact, setContact] = useState<Contact | null>(contactFixe ?? null)
  const [bien, setBien] = useState<Bien | null>(bienFixe ?? null)
  const [mode, setMode] = useState<'choix' | 'recherche' | 'nouveau'>('choix')
  const [brouillonBien, setBrouillonBien] = useState(brouillonBienVide)
  const [erreursBien, setErreursBien] = useState<ErreursBien>({})
  const [proprietaire, setProprietaire] = useState(true)
  const [sesBiens, setSesBiens] = useState<Bien[]>([])
  const [echec, setEchec] = useState<string | null>(null)
  const [existant, setExistant] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  // Les biens dont le vendeur est propriétaire : le choix le plus probable.
  const contactId = contact?.id ?? null
  useEffect(() => {
    if (contactId === null || bienFixe !== undefined) return
    let actif = true
    void listerBiensDuContact(exigerSupabase(), contactId).then((resultat) => {
      if (actif) {
        setSesBiens(
          resultat.ok
            ? resultat.donnees.map(({ bien: b }) => b).filter((b) => b.archived_at === null)
            : [],
        )
      }
    })
    return () => {
      actif = false
    }
  }, [contactId, bienFixe])

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    setEchec(null)
    setExistant(null)
    if (contact === null) {
      setEchec('Choisissez le vendeur.')
      return
    }
    const client = exigerSupabase()
    let aVendre = bien
    if (aVendre === null && mode === 'nouveau') {
      const preparation = preparerBien(brouillonBien)
      setErreursBien(preparation.ok ? {} : preparation.erreurs)
      if (!preparation.ok) return
      setEnvoi(true)
      const cree = await creerBien(client, preparation.valeurs)
      if (!cree.ok) {
        setEnvoi(false)
        setEchec(`Le bien n'a pas pu être enregistré. ${cree.erreur.message}`)
        return
      }
      aVendre = cree.donnees
      // Le bien existe désormais : un nouvel essai ne le recréera pas.
      setBien(aVendre)
      if (proprietaire) {
        const lien = await ajouterProprietaire(client, {
          bienId: aVendre.id,
          contactId: contact.id,
          quotePart: null,
        })
        if (!lien.ok) {
          notifier('erreur', `Le lien de propriétaire n'a pas pu être noté. ${lien.erreur.message}`)
        }
      }
    }
    if (aVendre === null) {
      setEchec('Choisissez le bien à vendre, ou créez-le.')
      return
    }

    setEnvoi(true)
    const enCours = await projetEnCoursDuBien(client, aVendre.id)
    if (enCours.ok && enCours.donnees !== null) {
      setEnvoi(false)
      setExistant(enCours.donnees.id)
      return
    }
    const resultat = await creerProjetVendeur(client, {
      contactId: contact.id,
      bienId: aVendre.id,
    })
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`Le projet n'a pas pu être créé. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Projet vendeur créé, à l’étape « Premier contact »')
    void naviguer(`/pipelines/vendeurs/${resultat.donnees.id}`)
  }

  return (
    <FenetreModale
      ouverte
      titre="Nouveau projet vendeur"
      onFermer={onFermer}
      actionEnTete={onAutreChose && <AutreCreation onClick={onAutreChose} />}
      pied={
        <>
          <Bouton type="submit" form="nouveau-projet-vendeur" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Créer le projet'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="nouveau-projet-vendeur"
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        {existant !== null && (
          <Message genre="info">
            Ce bien a déjà un projet vendeur en cours ou à recontacter.{' '}
            <Link to={`/pipelines/vendeurs/${existant}`} className="underline underline-offset-2">
              Ouvrir ce projet
            </Link>
          </Message>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-encre">Vendeur</legend>
          {contact !== null ? (
            <div className="flex min-h-11 flex-wrap items-center gap-2">
              <span className="font-medium text-encre">{nomComplet(contact)}</span>
              {contactFixe === undefined && (
                <Bouton variante="discret" onClick={() => setContact(null)}>
                  Changer
                </Bouton>
              )}
            </div>
          ) : (
            <SelecteurContact libelle="Chercher le vendeur" autoFocus onChoisir={setContact} />
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium text-encre">Bien à vendre</legend>
          {bien !== null ? (
            <div className="flex min-h-11 flex-wrap items-center gap-2">
              <span className="min-w-0 font-medium break-words text-encre">
                {adresseBien(bien)}
              </span>
              {bienFixe === undefined && (
                <Bouton
                  variante="discret"
                  onClick={() => {
                    setBien(null)
                    setMode('choix')
                  }}
                >
                  Changer
                </Bouton>
              )}
            </div>
          ) : (
            <>
              {mode !== 'nouveau' && sesBiens.length > 0 && (
                <>
                  <p className="text-sm text-encre-douce">
                    {contact === null ? '' : `Biens de ${nomComplet(contact)} :`}
                  </p>
                  <Liste>
                    {sesBiens.map((sien) => (
                      <LigneListe
                        key={sien.id}
                        titre={sien.adresse}
                        detail={resumeBien(sien)}
                        onAction={() => setBien(sien)}
                      />
                    ))}
                  </Liste>
                </>
              )}
              {mode === 'recherche' && (
                <SelecteurBien libelle="Chercher le bien" autoFocus onChoisir={setBien} />
              )}
              {mode === 'nouveau' && (
                <>
                  <FormulaireBien
                    court
                    brouillon={brouillonBien}
                    erreurs={erreursBien}
                    onChange={setBrouillonBien}
                  />
                  {contact !== null && (
                    <label className="flex min-h-11 items-center gap-3 text-base text-encre">
                      <input
                        type="checkbox"
                        className="size-5 accent-accent"
                        checked={proprietaire}
                        onChange={(evenement) => setProprietaire(evenement.target.checked)}
                      />
                      {nomComplet(contact)} en est propriétaire
                    </label>
                  )}
                </>
              )}
              <div className="flex flex-wrap gap-2">
                {mode !== 'recherche' && (
                  <Bouton
                    variante="secondaire"
                    icone="recherche"
                    onClick={() => setMode('recherche')}
                  >
                    Chercher un bien
                  </Bouton>
                )}
                {mode !== 'nouveau' && (
                  <Bouton variante="secondaire" icone="ajouter" onClick={() => setMode('nouveau')}>
                    Nouveau bien
                  </Bouton>
                )}
              </div>
              {mode === 'nouveau' && (
                <p className="text-sm text-encre-douce">
                  L'adresse et le type suffisent : le reste se complète sur la fiche du bien.
                </p>
              )}
            </>
          )}
        </fieldset>
      </form>
    </FenetreModale>
  )
}
