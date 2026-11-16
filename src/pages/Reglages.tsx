import { useEffect, useState, type FormEvent } from 'react'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import ChampSaisie from '../components/ChampSaisie'
import EtatChargement from '../components/EtatChargement'
import Etiquette from '../components/Etiquette'
import Liste from '../components/Liste'
import LigneListe from '../components/LigneListe'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import {
  enregistrerReglages,
  lireReglages,
  LONGUEUR_MAX_NOM_AFFICHE,
  validerNomAffiche,
} from '../features/reglages/reglages'
import { controlerAccesAnonyme, type BilanAccesAnonyme } from '../lib/controle-acces-anonyme'
import { TABLES } from '../lib/donnees'
import {
  insererDonneesFictives,
  NOMBRE_CONTACTS_FICTIFS,
  personnesFictives,
} from '../lib/donnees-fictives'
import { creerClientAnonyme, environnement, exigerSupabase } from '../lib/supabase'

/** Dit, de façon impossible à manquer, sur quel projet Supabase l'application est branchée. */
function CarteProjet() {
  const test = environnement === 'test'
  return (
    <Carte titre="Projet connecté">
      <div className="flex flex-col items-start gap-3">
        <span
          className={`rounded-xl px-4 py-2 text-2xl font-extrabold tracking-widest ring-2 ring-inset ${
            test
              ? 'bg-alerte-doux text-alerte ring-alerte'
              : 'bg-succes-doux text-succes ring-succes'
          }`}
        >
          {test ? 'TEST' : 'RÉEL'}
        </span>
        <p className="text-sm text-encre-douce">
          {test
            ? "L'application est branchée sur le projet de test. N'y saisissez que des données fictives : aucune vraie fiche client."
            : "L'application est branchée sur le projet réel : ce que vous saisissez ici, ce sont vos vraies fiches."}
        </p>
      </div>
    </Carte>
  )
}

/** Premier réglage de l'application : le nom affiché. */
function CartePreferences() {
  const { notifier } = useNotifications()
  const [chargement, setChargement] = useState(true)
  const [erreurLecture, setErreurLecture] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [erreurNom, setErreurNom] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    let actif = true
    void lireReglages(exigerSupabase()).then((resultat) => {
      if (!actif) return
      if (resultat.ok) setNom(resultat.donnees.nom_affiche)
      else setErreurLecture(resultat.erreur.message)
      setChargement(false)
    })
    return () => {
      actif = false
    }
  }, [])

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const erreur = validerNomAffiche(nom)
    setErreurNom(erreur)
    if (erreur !== null) return
    setEnvoi(true)
    const resultat = await enregistrerReglages(exigerSupabase(), { nom_affiche: nom })
    setEnvoi(false)
    if (resultat.ok) {
      setNom(resultat.donnees.nom_affiche)
      notifier('succes', 'Réglages enregistrés')
    } else {
      notifier('erreur', `L'enregistrement a échoué. ${resultat.erreur.message}`)
    }
  }

  return (
    <Carte titre="Préférences">
      {chargement ? (
        <EtatChargement />
      ) : erreurLecture !== null ? (
        <Message genre="erreur">Les réglages n'ont pas pu être lus. {erreurLecture}</Message>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(evenement) => void enregistrer(evenement)}>
          <ChampSaisie
            libelle="Votre nom"
            aide="Tel qu'il apparaîtra dans l'application."
            erreur={erreurNom ?? undefined}
            value={nom}
            onChange={(evenement) => setNom(evenement.target.value)}
            maxLength={LONGUEUR_MAX_NOM_AFFICHE}
            autoComplete="name"
            autoCapitalize="words"
          />
          <div className="md:self-start">
            <Bouton type="submit" pleineLargeur disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </Bouton>
          </div>
        </form>
      )}
    </Carte>
  )
}

/** Contrôle de sécurité : ce que voit un inconnu qui n'a que la clé publique du site. */
function CarteSecurite() {
  const [enCours, setEnCours] = useState(false)
  const [bilan, setBilan] = useState<BilanAccesAnonyme | null>(null)

  async function controler() {
    setEnCours(true)
    setBilan(await controlerAccesAnonyme(creerClientAnonyme(), Object.keys(TABLES)))
    setEnCours(false)
  }

  return (
    <Carte titre="Sécurité">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-encre-douce">
          Vérifie qu'une personne non connectée ne peut lire aucune ligne de la base. Le contrôle
          interroge chaque table sans votre session, comme le ferait un inconnu.
        </p>
        {bilan !== null && (
          <Message genre={bilan.protege ? 'succes' : 'erreur'}>{bilan.message}</Message>
        )}
        <div className="md:self-start">
          <Bouton
            variante="secondaire"
            pleineLargeur
            disabled={enCours}
            onClick={() => void controler()}
          >
            {enCours ? 'Contrôle en cours…' : "Vérifier l'accès sans connexion"}
          </Bouton>
        </div>
      </div>
    </Carte>
  )
}

/** Visible uniquement sur le projet de test : aperçu et ajout des données fictives. */
function CarteDonneesFictives() {
  const { notifier } = useNotifications()
  const [envoi, setEnvoi] = useState(false)

  async function ajouter() {
    if (environnement === null) return
    setEnvoi(true)
    const bilan = await insererDonneesFictives(exigerSupabase(), environnement)
    setEnvoi(false)
    if (bilan.ok) notifier('succes', `${bilan.lignes} fiches fictives ajoutées`)
    else notifier('erreur', `L'ajout a échoué. ${bilan.message}`)
  }

  return (
    <Carte titre="Données fictives">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Etiquette genre="alerte">Projet de test uniquement</Etiquette>
        </div>
        <p className="text-sm text-encre-douce">
          Des personnes inventées servent à remplir le projet de test : noms factices, ville
          inexistante, numéros de téléphone réservés aux fictions. En voici trois.
        </p>
        <Liste>
          {personnesFictives(3).map((personne) => (
            <LigneListe
              key={personne.courriel}
              titre={`${personne.prenom} ${personne.nom}`}
              detail={`${personne.telephone} · ${personne.adresse}, ${personne.codePostal} ${personne.ville}`}
            />
          ))}
        </Liste>
        <p className="text-sm text-encre-douce">
          Chaque appui ajoute {NOMBRE_CONTACTS_FICTIFS} contacts fictifs, même s'ils existent déjà :
          pratique pour essayer les doublons, à éviter sinon.
        </p>
        <div className="md:self-start">
          <Bouton
            variante="secondaire"
            pleineLargeur
            disabled={envoi}
            onClick={() => void ajouter()}
          >
            {envoi ? 'Ajout en cours…' : `Ajouter ${NOMBRE_CONTACTS_FICTIFS} contacts fictifs`}
          </Bouton>
        </div>
      </div>
    </Carte>
  )
}

/** Réglages de l'application : projet connecté, préférences, contrôle de sécurité. */
export default function Reglages() {
  return (
    <Page titre="Réglages" retour={{ vers: '/plus', libelle: 'Plus' }}>
      <CarteProjet />
      <CartePreferences />
      <CarteSecurite />
      {environnement === 'test' && <CarteDonneesFictives />}
    </Page>
  )
}
