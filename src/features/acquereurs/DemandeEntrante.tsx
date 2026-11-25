import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour, heureDuMoment } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { adresseBien, type Bien } from '../biens/biens'
import SelecteurBien from '../biens/SelecteurBien'
import { deNom, nomComplet, resumeContact, type Contact } from '../contacts/contacts'
import { chercherDoublons } from '../contacts/doublons'
import SelecteurContact from '../contacts/SelecteurContact'
import AutreCreation from '../saisie/AutreCreation'
import {
  brouillonDemande,
  enregistrerDemande,
  preparerDemande,
  type BrouillonDemande,
  type ErreursDemande,
} from './demande-entrante'
import {
  LONGUEURS_MAX_PROJET_ACQUEREUR,
  ORIGINES_DEMANDE,
  PORTAILS_COURANTS,
} from './pipeline-acquereur'

type Props = {
  /** L'acquéreur, fixé quand on part de sa fiche. */
  contact?: Contact
  /** Le bien concerné, fixé quand on part de sa fiche. */
  bien?: Bien
  onFermer: () => void
  /** Ouverte directement par le « + » : « Créer autre chose » ouvre le menu complet. */
  onAutreChose?: () => void
}

const LEGENDE = 'mb-2 text-sm font-medium text-encre'

/**
 * Demande entrante, en un seul écran : le contact (nouveau ou existant), le bien concerné,
 * l'origine (portail…), l'heure de réception. L'enregistrement crée le contact s'il le faut,
 * le projet acquéreur à l'étape « Demande » et l'appel de qualification du jour, puis ouvre
 * la fiche du projet.
 */
export default function DemandeEntrante({
  contact: contactFixe,
  bien: bienFixe,
  onFermer,
  onAutreChose,
}: Props) {
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const [brouillon, setBrouillon] = useState<BrouillonDemande>(() =>
    brouillonDemande(
      { date: aujourdhui, heure: heureDuMoment() },
      { contact: contactFixe ?? null, bien: bienFixe ?? null },
    ),
  )
  const [chercheContact, setChercheContact] = useState(false)
  const [chercheBien, setChercheBien] = useState(false)
  const [erreurs, setErreurs] = useState<ErreursDemande>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  /** Fiches ressemblantes trouvées avant de créer le contact ; `null` : pas encore cherché. */
  const [doublons, setDoublons] = useState<Contact[] | null>(null)
  /** Contact créé lors d'un essai interrompu : il n'est pas recréé. */
  const [contactCree, setContactCree] = useState<Contact | null>(null)

  function changer<C extends keyof BrouillonDemande>(champ: C, valeur: BrouillonDemande[C]) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
    // Les coordonnées changent : la recherche de doublons est à refaire.
    if (champ === 'nom' || champ === 'prenom' || champ === 'telephone' || champ === 'courriel') {
      setDoublons(null)
    }
  }

  function choisirContact(contact: Contact | null) {
    setBrouillon((actuel) => ({ ...actuel, contact }))
    setChercheContact(false)
    setDoublons(null)
  }

  async function enregistrer(evenement: FormEvent, creerQuandMeme = false) {
    evenement.preventDefault()
    const preparation = preparerDemande(brouillon, aujourdhui)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    const client = exigerSupabase()
    setEnvoi(true)
    setEchec(null)

    // Un nouveau contact : on regarde d'abord s'il n'existe pas déjà.
    const nouveau = preparation.demande.nouveauContact
    if (nouveau !== null && contactCree === null && !creerQuandMeme) {
      const trouves = doublons ?? (await chercherDoublons(client, nouveau))
      const liste = Array.isArray(trouves) ? trouves : trouves.ok ? trouves.donnees : []
      if (liste.length > 0) {
        // Les fiches ressemblantes restent affichées : il faut en choisir une, ou confirmer.
        setEnvoi(false)
        setDoublons(liste)
        return
      }
    }

    const resultat = await enregistrerDemande(client, brouillon, preparation.demande, contactCree)
    setEnvoi(false)
    if (!resultat.ok) {
      setContactCree(resultat.contactCree)
      setEchec(resultat.erreur.message)
      return
    }
    const { contact, appel } = resultat.donnees
    notifier(
      'succes',
      appel === null
        ? `Demande ${deNom(nomComplet(contact))} enregistrée`
        : `Demande ${deNom(nomComplet(contact))} enregistrée. Appel de qualification prévu aujourd'hui.`,
    )
    void naviguer(`/pipelines/acquereurs/${resultat.donnees.projet.id}`)
  }

  const contact = contactCree ?? brouillon.contact
  const doublonsAffiches = doublons !== null && doublons.length > 0 && contact === null

  return (
    <FenetreModale
      ouverte
      titre="Demande d'acquéreur"
      onFermer={onFermer}
      actionEnTete={onAutreChose && <AutreCreation onClick={onAutreChose} />}
      pied={
        <>
          <Bouton type="submit" form="demande-entrante" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer la demande'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="demande-entrante"
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        <fieldset className="flex flex-col gap-3">
          <legend className={LEGENDE}>Qui ?</legend>
          {contact !== null ? (
            <div className="flex min-h-11 flex-wrap items-center gap-2">
              <span className="font-medium text-encre">{nomComplet(contact)}</span>
              {contactFixe === undefined && contactCree === null && (
                <Bouton variante="discret" onClick={() => choisirContact(null)}>
                  Changer
                </Bouton>
              )}
            </div>
          ) : chercheContact ? (
            <>
              <SelecteurContact
                libelle="Chercher le contact"
                autoFocus
                onChoisir={choisirContact}
              />
              <div>
                <Bouton variante="discret" onClick={() => setChercheContact(false)}>
                  Nouveau contact plutôt
                </Bouton>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <ChampSaisie
                  libelle="Prénom"
                  autoFocus
                  autoComplete="off"
                  value={brouillon.prenom}
                  onChange={(evenement) => changer('prenom', evenement.target.value)}
                />
                <ChampSaisie
                  libelle="Nom"
                  autoComplete="off"
                  value={brouillon.nom}
                  onChange={(evenement) => changer('nom', evenement.target.value)}
                  erreur={erreurs.nom}
                />
              </div>
              <ChampSaisie
                libelle="Téléphone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                value={brouillon.telephone}
                onChange={(evenement) => changer('telephone', evenement.target.value)}
                erreur={erreurs.telephone}
              />
              <ChampSaisie
                libelle="Courriel"
                type="email"
                autoComplete="off"
                value={brouillon.courriel}
                onChange={(evenement) => changer('courriel', evenement.target.value)}
                erreur={erreurs.courriel}
              />
              <div>
                <Bouton
                  variante="discret"
                  icone="recherche"
                  onClick={() => setChercheContact(true)}
                >
                  Contact déjà enregistré
                </Bouton>
              </div>
            </>
          )}
          {doublonsAffiches && (
            <div className="flex flex-col gap-2 rounded-2xl bg-alerte-doux p-3">
              <p className="text-base font-semibold text-encre">Ce contact existe peut-être déjà</p>
              <Liste>
                {doublons.map((existant) => (
                  <LigneListe
                    key={existant.id}
                    titre={nomComplet(existant)}
                    detail={resumeContact(existant)}
                    onAction={() => choisirContact(existant)}
                  />
                ))}
              </Liste>
              <p className="text-sm text-encre">
                Touchez une fiche pour lui rattacher la demande, ou créez une nouvelle fiche.
              </p>
              <div className="-ml-2">
                <Bouton
                  variante="discret"
                  disabled={envoi}
                  onClick={(evenement) => void enregistrer(evenement, true)}
                >
                  Créer quand même une nouvelle fiche
                </Bouton>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className={LEGENDE}>Par où ?</legend>
          <div className="flex flex-wrap gap-2">
            {ORIGINES_DEMANDE.map((option) => (
              <Pastille
                key={option.valeur}
                choisie={brouillon.origine === option.valeur}
                onClick={() => changer('origine', option.valeur)}
              >
                {option.libelle}
              </Pastille>
            ))}
          </div>
          {brouillon.origine === 'portail' && (
            <>
              <div role="group" aria-label="Portail" className="flex flex-wrap gap-2">
                {PORTAILS_COURANTS.map((portail) => (
                  <Pastille
                    key={portail}
                    choisie={brouillon.portail === portail}
                    onClick={() => changer('portail', portail)}
                  >
                    {portail}
                  </Pastille>
                ))}
              </div>
              <ChampSaisie
                libelle="Portail"
                autoComplete="off"
                maxLength={LONGUEURS_MAX_PROJET_ACQUEREUR.portail}
                value={brouillon.portail}
                onChange={(evenement) => changer('portail', evenement.target.value)}
                erreur={erreurs.portail}
              />
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <ChampSaisie
              libelle="Reçue le"
              type="date"
              max={aujourdhui}
              value={brouillon.recueDate}
              onChange={(evenement) => changer('recueDate', evenement.target.value)}
              erreur={erreurs.recue}
            />
            <ChampSaisie
              libelle="À"
              type="time"
              value={brouillon.recueHeure}
              onChange={(evenement) => changer('recueHeure', evenement.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className={LEGENDE}>Bien concerné</legend>
          {brouillon.bien !== null ? (
            <div className="flex min-h-11 flex-wrap items-center gap-2">
              <span className="min-w-0 font-medium break-words text-encre">
                {adresseBien(brouillon.bien)}
              </span>
              {bienFixe === undefined && (
                <Bouton variante="discret" onClick={() => changer('bien', null)}>
                  Retirer
                </Bouton>
              )}
            </div>
          ) : chercheBien ? (
            <SelecteurBien
              libelle="Chercher le bien"
              autoFocus
              onChoisir={(bien) => {
                changer('bien', bien)
                setChercheBien(false)
              }}
            />
          ) : (
            <div>
              <Bouton variante="secondaire" icone="biens" onClick={() => setChercheBien(true)}>
                Choisir le bien
              </Bouton>
              <p className="mt-1 text-sm text-encre-douce">
                Facultatif : une demande peut porter sur une recherche en général.
              </p>
            </div>
          )}
        </fieldset>

        <ChampTexteLong
          libelle="Message reçu (facultatif)"
          rows={3}
          maxLength={LONGUEURS_MAX_PROJET_ACQUEREUR.notes - 100}
          placeholder="Collez ou dictez le message"
          value={brouillon.message}
          onChange={(evenement) => changer('message', evenement.target.value)}
          erreur={erreurs.message}
        />

        <div className="flex flex-col gap-1">
          {contact === null && (
            <label className="flex min-h-11 items-center gap-3 text-base text-encre">
              <input
                type="checkbox"
                className="size-5 accent-accent"
                checked={brouillon.demandeRappel}
                onChange={(evenement) => changer('demandeRappel', evenement.target.checked)}
              />
              Demande à être rappelé
            </label>
          )}
          {contact === null && brouillon.demandeRappel && (
            <p className="text-sm text-encre-douce">
              L'accord pour être appelé est noté sur la fiche, avec la demande pour preuve.
            </p>
          )}
          <label className="flex min-h-11 items-center gap-3 text-base text-encre">
            <input
              type="checkbox"
              className="size-5 accent-accent"
              checked={brouillon.planifierAppel}
              onChange={(evenement) => changer('planifierAppel', evenement.target.checked)}
            />
            Prévoir l'appel de qualification aujourd'hui
          </label>
        </div>
      </form>
    </FenetreModale>
  )
}
