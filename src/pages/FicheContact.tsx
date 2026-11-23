import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BarreActionsFiche from '../components/BarreActionsFiche'
import Carte from '../components/Carte'
import EtatChargement from '../components/EtatChargement'
import Icone from '../components/Icone'
import LienAction from '../components/LienAction'
import Message from '../components/Message'
import NavigationFiche from '../components/NavigationFiche'
import { useNotifications } from '../components/notifications-contexte'
import OngletsFiche from '../components/OngletsFiche'
import Page from '../components/Page'
import ProfilFiche from '../components/ProfilFiche'
import SectionProjetsAcquereurs from '../features/acquereurs/SectionProjetsAcquereurs'
import SectionJournal from '../features/activites/SectionJournal'
import { cartesDeLAppareil } from '../features/aujourdhui/journee'
import { dernierEchange } from '../features/aujourdhui/ordre-journee'
import { listerBiensDuContact, type BienDuContact } from '../features/biens/proprietaires'
import ActionsContact from '../features/contacts/ActionsContact'
import AvertissementAppel from '../features/contacts/AvertissementAppel'
import BiensContact from '../features/contacts/BiensContact'
import { lireCompteursContact, type CompteursContact } from '../features/contacts/compteurs-fiche'
import ConsentementContact from '../features/contacts/ConsentementContact'
import {
  droitAppel,
  listerAppelsSansAccord,
  resumeAccord,
  type AppelSansAccord,
} from '../features/contacts/consentement'
import {
  lireContact,
  nomAvecCivilite,
  nomComplet,
  type Contact,
} from '../features/contacts/contacts'
import { sansCoordonnees } from '../features/contacts/coordonnees'
import {
  LIBELLES_ONGLETS,
  ligneAccord,
  ligneDatesFiche,
  ongletAffiche,
  ongletsContact,
  raccourciFiche,
  type OngletContact,
} from '../features/contacts/fiche-contact'
import IdentiteContact from '../features/contacts/IdentiteContact'
import LignesCoordonnees from '../features/contacts/LignesCoordonnees'
import LignesOrigine from '../features/contacts/LignesOrigine'
import { lirePageContacts } from '../features/contacts/liste-contacts'
import MenuContact from '../features/contacts/MenuContact'
import NotesContact from '../features/contacts/NotesContact'
import {
  cleDeLEtat,
  libellePosition,
  noterIds,
  parcoursMemorise,
  rangDans,
  rangVoisin,
  remplacerParcours,
} from '../features/contacts/parcours'
import TemperatureContact from '../features/contacts/TemperatureContact'
import { estPortable, lienAppel, lienSms } from '../features/contacts/telephone'
import SectionProjetsVendeurs from '../features/projets/SectionProjetsVendeurs'
import ProchaineAction from '../features/relances/ProchaineAction'
import ConsignerEchange from '../features/saisie/ConsignerEchange'
import { champConsigner, placerCurseur } from '../features/saisie/curseur-consigner'
import { ficheDeContact } from '../features/saisie/fiches-consultees'
import { useConsultation } from '../features/saisie/recents'
import SectionTaches from '../features/taches/SectionTaches'
import { estUnChamp } from '../lib/clavier'
import { dateDuJour, formaterDate } from '../lib/dates'
import { useTailleEcran } from '../lib/ecran'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | {
      phase: 'pret'
      contact: Contact
      recommandePar: Contact | null
      fusionneDans: Contact | null
      /** Les appels passés sans accord, les plus récents d'abord. */
      appels: AppelSansAccord[]
      /** Les biens dont le contact est propriétaire. */
      biens: BienDuContact[]
    }

const RETOUR = { vers: '/contacts', libelle: 'Contacts' }

/** Nombre de tâches à venir montrées dans l'onglet Activité (les autres sont dans Tâches). */
const TACHES_DANS_ACTIVITE = 3

const CLASSES_MODIFIER =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-surface px-3 text-base font-semibold text-encre shadow-xs ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Fiche d'un contact (étape D.5). Ce qu'on cherche à chaque appel reste sous les yeux ; le
 * reste est rangé en onglets, gardés dans l'adresse (`?onglet=projets`).
 * - Ordinateur : à gauche le profil (identité, température, Appeler, SMS, Courriel,
 *   Itinéraire, prochaine action, coordonnées, accord pour être appelé), qui ne bouge pas ; à
 *   droite les onglets Activité, Projets, Tâches, Biens (touches 1 à 4). Depuis la liste des
 *   contacts, « 12 sur 48 » et deux flèches (touches K et J) passent au contact voisin.
 * - Tablette et téléphone : un en-tête compact, la prochaine action, puis les onglets Activité,
 *   Projets, Tâches, Infos. Sur téléphone, Appeler, SMS et Consigner sont en bas de l'écran.
 */
export default function FicheContact() {
  const { id = '' } = useParams()
  const location = useLocation()
  const naviguer = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const taille = useTailleEcran()
  const ordinateur = taille === 'ordinateur'
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  // Numéro pour lequel un motif vient d'être enregistré : l'appel est rétabli pour cette visite.
  const [appelLibere, setAppelLibere] = useState<string | null>(null)
  // Change après chaque geste sur les tâches ou le journal : toutes les rubriques se relisent.
  const [version, setVersion] = useState(0)
  const [compteurs, setCompteurs] = useState<CompteursContact | null>(null)
  // « Consigner » de la barre du bas : le curseur ira dans le texte du compte rendu.
  const [focusConsigner, setFocusConsigner] = useState(false)
  const [voisinEnCours, setVoisinEnCours] = useState(false)
  const [cartes] = useState(() => cartesDeLAppareil(navigator.userAgent))
  useConsultation(etat.phase === 'pret' ? ficheDeContact(etat.contact) : null)

  const onglets = ongletsContact(taille)
  const onglet = ongletAffiche(parametres.get('onglet'), taille)

  // Le parcours de la liste : seulement pour une fiche ouverte depuis la liste des contacts.
  const cleParcours = cleDeLEtat(location.state)
  const parcours = cleParcours === null ? null : parcoursMemorise(cleParcours)
  const rang = parcours === null ? null : rangDans(parcours, id)
  const avecParcours = ordinateur && parcours !== null && rang !== null

  useEffect(() => {
    let actif = true
    async function charger() {
      const client = exigerSupabase()
      const resultat = await lireContact(client, id)
      if (!resultat.ok) return { phase: 'erreur', message: resultat.erreur.message } as const
      const contact = resultat.donnees
      // Ce qui suit est lu ensemble ; un échec n'empêche pas d'afficher la fiche.
      const [origine, reprise, historique, possedes] = await Promise.all([
        contact.recommande_par_id === null ? null : lireContact(client, contact.recommande_par_id),
        // Fiche fusionnée dans une autre : on affichera le lien vers celle qui a tout repris.
        contact.fusionne_dans_id === null ? null : lireContact(client, contact.fusionne_dans_id),
        listerAppelsSansAccord(client, contact.id),
        listerBiensDuContact(client, contact.id),
      ])
      return {
        phase: 'pret',
        contact,
        recommandePar: origine !== null && origine.ok ? origine.donnees : null,
        fusionneDans: reprise !== null && reprise.ok ? reprise.donnees : null,
        appels: historique.ok ? historique.donnees : [],
        biens: possedes.ok ? possedes.donnees : [],
      } as const
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
      setEtat({ phase: 'chargement' })
      setAppelLibere(null)
    }
  }, [id])

  // Les compteurs des onglets et le dernier échange, relus après chaque geste.
  useEffect(() => {
    let actif = true
    void lireCompteursContact(exigerSupabase(), id).then((lus) => {
      if (actif) setCompteurs(lus)
    })
    return () => {
      actif = false
    }
  }, [id, version])

  /** Change d'onglet : une entrée de plus dans l'historique (le retour ramène au précédent). */
  function choisirOnglet(suivant: OngletContact) {
    if (suivant === onglet) return
    setParametres(
      (actuels) => {
        const nouveaux = new URLSearchParams(actuels)
        nouveaux.set('onglet', suivant)
        return nouveaux
      },
      // Le parcours de la liste suit la fiche d'un onglet à l'autre.
      { state: location.state },
    )
  }

  /** Passe au contact précédent ou suivant de la liste, en lisant la suite si besoin. */
  async function allerAuVoisin(sens: 1 | -1) {
    if (parcours === null || rang === null || voisinEnCours) return
    const cible = rangVoisin(parcours, rang, sens)
    if (cible === null) return
    let voisin = parcours.ids[cible] ?? null
    if (voisin === null) {
      setVoisinEnCours(true)
      const page = await lirePageContacts(parcours.cle, cible, false)
      setVoisinEnCours(false)
      if (!page.ok) {
        notifier('erreur', `Le contact suivant n'a pas pu être lu. ${page.erreur.message}`)
        return
      }
      const complete = noterIds(
        parcours,
        cible,
        page.donnees.lignes.map((contact) => contact.id),
      )
      remplacerParcours(complete)
      voisin = complete.ids[cible] ?? null
      if (voisin === null) return
    }
    void naviguer(
      { pathname: `/contacts/${voisin}`, search: location.search },
      { state: location.state },
    )
  }

  // Raccourcis de la fiche, hors des champs et des fenêtres : 1 à 4, J et K.
  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.repeat || evenement.defaultPrevented) return
      if (document.querySelector('dialog[open], [role="menu"]') !== null) return
      const raccourci = raccourciFiche({
        key: evenement.key,
        ctrlKey: evenement.ctrlKey,
        metaKey: evenement.metaKey,
        altKey: evenement.altKey,
        dansUnChamp: estUnChamp(document.activeElement),
      })
      if (raccourci === null) return
      if (raccourci.genre === 'onglet') {
        const choisi = onglets[raccourci.rang]
        if (choisi === undefined) return
        evenement.preventDefault()
        choisirOnglet(choisi)
      } else if (avecParcours) {
        evenement.preventDefault()
        void allerAuVoisin(raccourci.genre === 'suivant' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  })

  if (etat.phase === 'chargement') {
    return (
      <Page titre="Contact" retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page titre="Contact" retour={RETOUR}>
        <Message genre="erreur">La fiche n'a pas pu être ouverte. {etat.message}</Message>
      </Page>
    )
  }

  const { contact, recommandePar, fusionneDans, appels, biens } = etat
  const aujourdhui = dateDuJour()
  const droit = droitAppel(contact)
  const appelPermis = droit.autorise || appelLibere !== null
  const archive = contact.archived_at !== null
  const fusionnee = contact.fusionne_dans_id !== null
  const lectureSeule = archive || fusionnee
  const telephone = contact.telephones[0]
  const portable = contact.telephones.find(estPortable) ?? telephone
  const lienAppelFiche =
    telephone === undefined || !appelPermis
      ? undefined
      : lienAppel(appelLibere !== null && appelLibere !== '' ? appelLibere : telephone)
  const annonceAppel =
    telephone === undefined
      ? 'Appeler : aucun numéro'
      : appelPermis
        ? undefined
        : 'Appel bloqué : aucun accord pour être appelé'
  const ligneDernier =
    compteurs === null || compteurs.dernier === undefined
      ? undefined
      : dernierEchange(compteurs.dernier, aujourdhui)

  /** La fiche relue ou renvoyée par un enregistrement (température, archivage). */
  function remplacerContact(suivant: Contact) {
    setEtat((actuel) => (actuel.phase === 'pret' ? { ...actuel, contact: suivant } : actuel))
  }

  async function relireContact() {
    const relue = await lireContact(exigerSupabase(), contact.id)
    if (!relue.ok) return
    setEtat((actuel) =>
      actuel.phase === 'pret' && actuel.contact.id === relue.donnees.id
        ? { ...actuel, contact: relue.donnees }
        : actuel,
    )
  }

  /**
   * Une tâche ou une activité a changé (boucle de relance comprise) : la prochaine action,
   * les tâches, le journal et les compteurs se relisent, et la fiche aussi (dernier contact,
   * température, prochaine action).
   */
  function toutRelire() {
    setVersion((v) => v + 1)
    void relireContact()
  }

  /** Un motif vient d'être enregistré : l'appel est rétabli et la fiche relue (dernier contact). */
  function noterAppel(appel: AppelSansAccord) {
    setAppelLibere(appel.telephone)
    setEtat((actuel) =>
      actuel.phase === 'pret' ? { ...actuel, appels: [appel, ...actuel.appels] } : actuel,
    )
    void relireContact()
  }

  const messages = (
    <>
      {fusionnee && (
        <Message genre="info">
          Cette fiche a été fusionnée
          {fusionneDans !== null && (
            <>
              {' '}
              dans{' '}
              <Link to={`/contacts/${fusionneDans.id}`} className="underline underline-offset-2">
                {nomComplet(fusionneDans)}
              </Link>
            </>
          )}
          , qui a repris toutes ses informations. Elle est conservée ici telle qu'elle était, pour
          mémoire.
        </Message>
      )}
      {archive && !fusionnee && (
        <Message genre="info">
          Cette fiche est archivée depuis le {formaterDate(contact.archived_at)} : elle n'apparaît
          plus dans la liste des contacts. « Restaurer la fiche » est dans le menu « … ».
        </Message>
      )}
    </>
  )

  const modifier = (
    <Link to={`/contacts/${contact.id}/modifier`} className={CLASSES_MODIFIER}>
      <Icone nom="modifier" className="size-5 md:hidden" />
      <span className="max-md:sr-only">Modifier</span>
    </Link>
  )
  const menu = <MenuContact contact={contact} onChange={remplacerContact} />
  const temperature = (
    <TemperatureContact contact={contact} desactive={lectureSeule} onChange={remplacerContact} />
  )
  const prochaineAction = lectureSeule ? null : (
    <ProchaineAction
      contact={contact}
      version={version}
      onChangement={toutRelire}
      compacte={ordinateur}
    />
  )
  const avertissement =
    telephone !== undefined && !droit.autorise ? (
      <AvertissementAppel contact={contact} raison={droit.raison} onEnregistre={noterAppel} />
    ) : null
  const coordonnees = (empilee: boolean) => (
    <dl className="divide-y divide-bord">
      <LignesCoordonnees contact={contact} appelPermis={appelPermis} empilee={empilee} />
      <LignesOrigine contact={contact} recommandePar={recommandePar} empilee={empilee} />
    </dl>
  )
  const sansCoordonneesTexte = sansCoordonnees(contact) && (
    <p className="text-sm text-encre-douce">
      Aucune coordonnée pour l'instant. Touchez « Modifier » pour en ajouter.
    </p>
  )
  const consentement = (empilee: boolean) => (
    <>
      <dl className="divide-y divide-bord">
        <ConsentementContact contact={contact} appels={appels} empilee={empilee} />
      </dl>
      <p className="mt-2 text-sm text-encre-douce">
        Dans le menu « … » : « Exporter ses données » produit un fichier texte avec tout ce qui est
        enregistré sur cette personne, à lui remettre si elle le demande ; « Supprimer
        définitivement » répond à une demande d'effacement.
      </p>
    </>
  )

  function contenuOnglet(choisi: OngletContact): ReactNode {
    switch (choisi) {
      case 'activite':
        return (
          <>
            {!lectureSeule && (
              <ConsignerEchange
                // Une autre fiche (contact suivant) repart d'un bloc vide, ou de son brouillon.
                key={contact.id}
                contact={contact}
                version={version}
                onEnregistre={toutRelire}
                demandeFocus={focusConsigner}
                onFocusDonne={() => setFocusConsigner(false)}
              />
            )}
            <SectionTaches
              contact={contact}
              version={version}
              onChangement={toutRelire}
              titre="À venir"
              limite={TACHES_DANS_ACTIVITE}
              onVoirTout={() => choisirOnglet('taches')}
            />
            <SectionJournal
              contact={contact}
              version={version}
              onChangement={toutRelire}
              historique
            />
          </>
        )
      case 'projets':
        return (
          <>
            <SectionProjetsVendeurs contact={contact} lectureSeule={lectureSeule} avecEtapes />
            <SectionProjetsAcquereurs contact={contact} lectureSeule={lectureSeule} avecEtapes />
          </>
        )
      case 'taches':
        return <SectionTaches contact={contact} version={version} onChangement={toutRelire} />
      case 'biens':
        return <BiensContact biens={biens} />
      case 'infos':
        return (
          <>
            <Carte titre="Coordonnées">
              {sansCoordonneesTexte}
              {coordonnees(false)}
            </Carte>
            <NotesContact contact={contact} />
            <Carte titre="Consentement et données personnelles">{consentement(false)}</Carte>
            <p className="text-sm text-encre-douce">{ligneDatesFiche(contact, aujourdhui)}</p>
          </>
        )
    }
  }

  const compteurDe: Record<OngletContact, number | null | undefined> = {
    activite: compteurs?.activites,
    projets: compteurs?.projets,
    taches: compteurs?.taches,
    biens: biens.length,
    infos: undefined,
  }
  const ongletsFiche = (
    <OngletsFiche
      id="onglets-fiche-contact"
      libelle="Rubriques de la fiche"
      options={onglets.map((valeur) => ({
        valeur,
        libelle: LIBELLES_ONGLETS[valeur],
        compteur: compteurDe[valeur],
      }))}
      valeur={onglet}
      onChange={choisirOnglet}
    >
      {contenuOnglet(onglet)}
    </OngletsFiche>
  )

  if (ordinateur) {
    return (
      <Page
        titre={nomAvecCivilite(contact)}
        retour={RETOUR}
        enTete={null}
        finRetour={
          avecParcours &&
          parcours !== null &&
          rang !== null && (
            <NavigationFiche
              position={libellePosition(rang, parcours.total)}
              quoi="la liste des contacts"
              enCours={voisinEnCours}
              onPrecedent={
                rangVoisin(parcours, rang, -1) === null ? undefined : () => void allerAuVoisin(-1)
              }
              onSuivant={
                rangVoisin(parcours, rang, 1) === null ? undefined : () => void allerAuVoisin(1)
              }
            />
          )
        }
      >
        {messages}
        <div className="grid items-start gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <ProfilFiche libelle={`Profil de ${nomComplet(contact)}`}>
            <IdentiteContact contact={contact} taille="grande" sousTitre={ligneDernier} />
            {temperature}
            <ActionsContact
              contact={contact}
              lienAppel={lienAppelFiche}
              annonceAppel={annonceAppel}
              cartes={cartes}
            />
            {prochaineAction}
            <NotesContact contact={contact} />
            <Carte>
              {sansCoordonneesTexte}
              {coordonnees(true)}
            </Carte>
            {droit.autorise ? (
              <p className="flex items-start gap-2 text-sm font-medium text-succes">
                <Icone nom="succes" className="mt-0.5 size-4 shrink-0" />
                {ligneAccord(contact)}
              </p>
            ) : (
              (avertissement ?? (
                <p className="text-sm text-encre-douce">
                  Accord pour être appelé : {resumeAccord(contact).toLowerCase()}
                </p>
              ))
            )}
            <details className="group rounded-2xl bg-surface ring-1 ring-bord">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 text-sm font-semibold text-encre focus-visible:outline-2 focus-visible:outline-accent">
                Consentement et données personnelles
                <Icone
                  nom="chevron"
                  className="size-4 text-encre-douce transition-transform group-open:rotate-90"
                />
              </summary>
              <div className="px-4 pb-4">{consentement(true)}</div>
            </details>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-encre-douce">{ligneDatesFiche(contact, aujourdhui)}</p>
              <div className="flex gap-2">
                {modifier}
                {menu}
              </div>
            </div>
          </ProfilFiche>
          {ongletsFiche}
        </div>
      </Page>
    )
  }

  return (
    <Page
      titre={nomAvecCivilite(contact)}
      retour={RETOUR}
      enTete={
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <IdentiteContact contact={contact} taille="compacte" sousTitre={ligneDernier} />
            </div>
            <div className="flex shrink-0 gap-2">
              {modifier}
              {menu}
            </div>
          </div>
          {temperature}
        </div>
      }
    >
      {messages}
      {prochaineAction}
      {avertissement}
      {taille === 'tablette' && (
        <ActionsContact
          contact={contact}
          lienAppel={lienAppelFiche}
          annonceAppel={annonceAppel}
          cartes={cartes}
        />
      )}
      {ongletsFiche}
      {taille === 'telephone' && (
        <BarreActionsFiche libelle={`Actions sur ${nomComplet(contact)}`}>
          <div className="flex flex-[2]">
            <LienAction
              libelle="Appeler"
              icone="telephone"
              href={lienAppelFiche}
              annonce={annonceAppel}
            />
          </div>
          <LienAction
            libelle="SMS"
            icone="sms"
            variante="secondaire"
            href={portable === undefined ? undefined : lienSms(portable)}
          />
          <LienAction
            libelle="Consigner"
            icone="journal"
            variante="secondaire"
            onClick={
              lectureSeule
                ? undefined
                : () => {
                    // Déjà affiché : le curseur y va dans le geste même (clavier de l'iPhone).
                    const champ = champConsigner()
                    if (champ !== null) placerCurseur(champ)
                    else {
                      choisirOnglet('activite')
                      setFocusConsigner(true)
                    }
                  }
            }
          />
        </BarreActionsFiche>
      )}
    </Page>
  )
}
