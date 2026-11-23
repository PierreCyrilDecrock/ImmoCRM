import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Bouton from '../components/Bouton'
import ChampChoix from '../components/ChampChoix'
import ChampRecherche from '../components/ChampRecherche'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import FenetreModale from '../components/FenetreModale'
import LigneListe from '../components/LigneListe'
import Liste from '../components/Liste'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Onglets from '../components/Onglets'
import Page from '../components/Page'
import SuiteListe from '../components/SuiteListe'
import {
  brouillonVide,
  chercherContacts,
  creerContact,
  listerEtiquettes,
  nomDeListe,
  preparerContact,
  resumeContact,
  ROLES,
  SOURCES,
  TEMPERATURES,
  type BrouillonContact,
  type Contact,
  type ErreursContact,
} from '../features/contacts/contacts'
import AlerteDoublons from '../features/contacts/AlerteDoublons'
import { chercherDoublons } from '../features/contacts/doublons'
import {
  FILTRES_VIDES,
  filtresMemorises,
  listeRestreinte,
  memoriserFiltres,
  nombreFiltres,
  type FiltresContacts,
} from '../features/contacts/filtres'
import FormulaireContact from '../features/contacts/FormulaireContact'
import { useListeContacts } from '../features/contacts/liste-contacts'
import { memoriserParcours, type EtatParcours } from '../lib/parcours'
import { formaterDate } from '../lib/dates'
import { accorder } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

/** Fiches qui ressemblent à celle qu'on allait créer, avec le brouillon qui les a fait remonter. */
type Alerte = { brouillon: BrouillonContact; doublons: Contact[] }

/** Fenêtre de création : le strict minimum, pour noter un contact en quelques secondes. */
function NouveauContact({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [brouillon, setBrouillon] = useState(brouillonVide)
  const [erreurs, setErreurs] = useState<ErreursContact>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [alerte, setAlerte] = useState<Alerte | null>(null)
  // L'alerte ne vaut que pour la saisie qui l'a déclenchée : une correction relance le contrôle.
  const doublons = alerte !== null && alerte.brouillon === brouillon ? alerte.doublons : []

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerContact(brouillon)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const client = exigerSupabase()
    if (doublons.length === 0) {
      // Si le contrôle lui-même échoue, on n'empêche pas d'enregistrer.
      const controle = await chercherDoublons(client, preparation.valeurs)
      if (controle.ok && controle.donnees.length > 0) {
        setAlerte({ brouillon, doublons: controle.donnees })
        setEnvoi(false)
        return
      }
    }
    const resultat = await creerContact(client, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Contact enregistré')
    // On arrive sur la fiche : c'est là que le reste se complète.
    void naviguer(`/contacts/${resultat.donnees.id}`)
  }

  const preparation = doublons.length > 0 ? preparerContact(brouillon) : null

  return (
    <FenetreModale
      ouverte={ouverte}
      titre="Nouveau contact"
      onFermer={onFermer}
      pied={
        <>
          <Bouton
            type="submit"
            form="nouveau-contact"
            variante={doublons.length > 0 ? 'secondaire' : 'principal'}
            pleineLargeur
            disabled={envoi}
          >
            {envoi ? 'Enregistrement…' : doublons.length > 0 ? 'Créer quand même' : 'Enregistrer'}
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
        {/* En tête de fenêtre : visible sans faire défiler, même sur un petit écran. */}
        {doublons.length > 0 && (
          <AlerteDoublons
            doublons={doublons}
            valeurs={preparation?.ok === true ? preparation.valeurs : null}
          />
        )}
        <FormulaireContact court brouillon={brouillon} erreurs={erreurs} onChange={setBrouillon} />
      </form>
    </FenetreModale>
  )
}

/** Dans la vue « sans prochaine action » : depuis quand, et pourquoi la fiche y est. */
function detailSansAction(contact: Contact): string {
  const depuis =
    contact.sans_prochaine_action_le !== null
      ? `Confirmé le ${formaterDate(contact.sans_prochaine_action_le)}`
      : `Dernier contact le ${formaterDate(contact.dernier_contact_le)}`
  return [depuis, resumeContact(contact)].filter(Boolean).join(' · ')
}

const VUES = [
  { valeur: 'tous', libelle: 'Tous' },
  { valeur: 'sans_action', libelle: 'Sans prochaine action' },
] as const

/**
 * Liste des contacts : recherche instantanée, filtres combinables, défilement progressif.
 * Une vue réunit les contacts sans prochaine action (aucune tâche à faire). La recherche, les
 * filtres et la vue sont gardés en mémoire tant que l'onglet reste ouvert.
 */
export default function Contacts() {
  const [archives, setArchives] = useState(false)
  const [filtres, setFiltres] = useState<FiltresContacts>(filtresMemorises)
  const [panneau, setPanneau] = useState(() => nombreFiltres(filtres) > 0)
  const [etiquettes, setEtiquettes] = useState<string[]>([])
  const [creation, setCreation] = useState(false)
  const [nbSansAction, setNbSansAction] = useState<number | null>(null)
  // Les fiches archivées n'ont pas besoin de prochaine action : la vue ne s'y applique pas.
  const sansAction = filtres.sansAction && !archives
  const liste = useListeContacts({ ...filtres, sansAction }, archives)
  const restreinte = listeRestreinte(filtres)
  const nbFiltres = nombreFiltres(filtres)

  // Nombre de fiches sans prochaine action, affiché sur l'onglet (toutes fiches actives).
  useEffect(() => {
    let actif = true
    void chercherContacts(exigerSupabase(), {
      conditions: [{ colonne: 'prochaine_action_le', genre: 'vide' }],
      taille: 1,
      compter: true,
    }).then((resultat) => {
      if (actif && resultat.ok) setNbSansAction(resultat.donnees.total)
    })
    return () => {
      actif = false
    }
  }, [])

  // La liste lue est gardée pour l'onglet : depuis une fiche ouverte ici, « suivant » mène au
  // contact suivant de cette liste, dans cet ordre et avec ces filtres.
  const { cle, total, rafraichissement, erreur, contacts } = liste
  useEffect(() => {
    if (cle === null || total === null || rafraichissement || erreur !== null) return
    memoriserParcours('contacts', { cle, total, ids: contacts.map((contact) => contact.id) })
  }, [cle, total, rafraichissement, erreur, contacts])
  const etatLien: EtatParcours | undefined = cle === null ? undefined : { parcours: cle }

  // Les étiquettes existantes alimentent le filtre ; sans elles, le reste fonctionne.
  useEffect(() => {
    let actif = true
    void listerEtiquettes(exigerSupabase()).then((resultat) => {
      if (actif && resultat.ok) setEtiquettes(resultat.donnees)
    })
    return () => {
      actif = false
    }
  }, [])

  function changerFiltres(valeurs: Partial<FiltresContacts>) {
    const suivants = { ...filtres, ...valeurs }
    setFiltres(suivants)
    memoriserFiltres(suivants)
  }

  // Une étiquette mémorisée qui n'existe plus reste proposée, pour pouvoir la retirer.
  const optionsEtiquettes = [
    ...(filtres.etiquette !== '' && !etiquettes.includes(filtres.etiquette)
      ? [filtres.etiquette]
      : []),
    ...etiquettes,
  ].map((etiquette) => ({ valeur: etiquette, libelle: etiquette }))

  const ajouter = (
    <Bouton icone="ajouter" onClick={() => setCreation(true)}>
      Ajouter
    </Bouton>
  )

  const decompte =
    liste.total === null
      ? null
      : sansAction
        ? `${accorder(liste.total, restreinte ? 'contact trouvé' : 'contact', restreinte ? 'contacts trouvés' : 'contacts')} sans prochaine action, par ordre alphabétique`
        : archives
          ? accorder(
              liste.total,
              restreinte ? 'archivé trouvé' : 'contact archivé',
              restreinte ? 'archivés trouvés' : 'contacts archivés',
            )
          : restreinte
            ? accorder(liste.total, 'contact trouvé', 'contacts trouvés')
            : `${accorder(liste.total, 'contact')}, par ordre alphabétique`

  return (
    <Page titre={archives ? 'Contacts archivés' : 'Contacts'} actions={!archives && ajouter}>
      {!archives && (
        <Onglets
          libelle="Vues des contacts"
          options={VUES.map((vue) =>
            vue.valeur === 'sans_action' ? { ...vue, compteur: nbSansAction } : vue,
          )}
          valeur={filtres.sansAction ? 'sans_action' : 'tous'}
          onChange={(vue) => changerFiltres({ sansAction: vue === 'sans_action' })}
        />
      )}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <ChampRecherche
            libelle="Rechercher dans les contacts"
            placeholder="Nom, téléphone, courriel, adresse…"
            data-raccourci-recherche=""
            aria-keyshortcuts="/ Control+K"
            valeur={filtres.recherche}
            onChange={(recherche) => changerFiltres({ recherche })}
          />
        </div>
        <Bouton
          variante="secondaire"
          icone="filtrer"
          aria-expanded={panneau}
          aria-controls="filtres-contacts"
          onClick={() => setPanneau(!panneau)}
        >
          <span className="sr-only md:not-sr-only">Filtres</span>
          {nbFiltres > 0 && (
            <span className="rounded-full bg-accent px-2 text-sm text-sur-plein">
              <span className="sr-only">(</span>
              {nbFiltres}
              <span className="sr-only"> choisis)</span>
            </span>
          )}
        </Bouton>
      </div>

      {panneau && (
        <div id="filtres-contacts" className="rounded-2xl bg-surface p-4 ring-1 ring-bord">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ChampChoix
              libelle="Rôle"
              optionVide="Tous"
              options={ROLES}
              value={filtres.role}
              onChange={(evenement) =>
                changerFiltres({
                  role: ROLES.find((r) => r.valeur === evenement.target.value)?.valeur ?? '',
                })
              }
            />
            <ChampChoix
              libelle="Étiquette"
              optionVide="Toutes"
              options={optionsEtiquettes}
              value={filtres.etiquette}
              onChange={(evenement) => changerFiltres({ etiquette: evenement.target.value })}
            />
            <ChampChoix
              libelle="Source"
              optionVide="Toutes"
              options={SOURCES}
              value={filtres.source}
              onChange={(evenement) =>
                changerFiltres({
                  source: SOURCES.find((s) => s.valeur === evenement.target.value)?.valeur ?? '',
                })
              }
            />
            <ChampChoix
              libelle="Température"
              optionVide="Toutes"
              options={TEMPERATURES}
              value={filtres.temperature}
              onChange={(evenement) =>
                changerFiltres({
                  temperature:
                    TEMPERATURES.find((t) => t.valeur === evenement.target.value)?.valeur ?? '',
                })
              }
            />
          </div>
          {nbFiltres > 0 && (
            <div className="mt-2 -mb-2 -ml-2">
              <Bouton
                variante="discret"
                icone="fermer"
                onClick={() =>
                  changerFiltres({
                    ...FILTRES_VIDES,
                    recherche: filtres.recherche,
                    sansAction: filtres.sansAction,
                  })
                }
              >
                Retirer les filtres
              </Bouton>
            </div>
          )}
        </div>
      )}

      {liste.chargement && <EtatChargement />}
      {liste.erreur !== null && (
        <Message genre="erreur">Les contacts n'ont pas pu être lus. {liste.erreur}</Message>
      )}

      {!liste.chargement && liste.erreur === null && liste.contacts.length === 0 && (
        <>
          {restreinte ? (
            <EtatVide
              icone="recherche"
              titre="Aucun contact trouvé"
              action={
                <Bouton
                  variante="secondaire"
                  onClick={() =>
                    changerFiltres({ ...FILTRES_VIDES, sansAction: filtres.sansAction })
                  }
                >
                  Tout afficher
                </Bouton>
              }
            >
              Aucune fiche{archives ? ' archivée' : ''} ne correspond à cette recherche
              {nbFiltres > 0 ? ' et à ces filtres' : ''}.
            </EtatVide>
          ) : sansAction ? (
            <EtatVide icone="succes" titre="Tous vos contacts ont une prochaine action">
              Chaque fiche active a au moins une tâche datée : personne n'est oublié.
            </EtatVide>
          ) : archives ? (
            <EtatVide icone="archiver" titre="Aucun contact archivé">
              Les fiches que vous archivez sont rangées ici. Vous pouvez les restaurer à tout
              moment.
            </EtatVide>
          ) : (
            <EtatVide icone="contacts" titre="Aucun contact pour l'instant" action={ajouter}>
              Un nom et un téléphone suffisent pour commencer : le reste se complète ensuite.
            </EtatVide>
          )}
        </>
      )}

      {liste.contacts.length > 0 && liste.erreur === null && (
        <div
          className={`flex flex-col gap-4 ${liste.rafraichissement ? 'opacity-60' : ''}`}
          aria-busy={liste.rafraichissement}
        >
          {decompte !== null && (
            <p className="text-sm text-encre-douce" aria-live="polite">
              {decompte}
            </p>
          )}
          <Liste>
            {liste.contacts.map((contact) => (
              <LigneListe
                key={contact.id}
                titre={nomDeListe(contact)}
                detail={sansAction ? detailSansAction(contact) : resumeContact(contact)}
                vers={`/contacts/${contact.id}`}
                etat={etatLien}
              />
            ))}
          </Liste>
          <SuiteListe
            resteALire={liste.resteALire}
            suiteEnCours={liste.suiteEnCours}
            erreurSuite={liste.erreurSuite}
            chargerSuite={liste.chargerSuite}
          />
        </div>
      )}

      {!liste.chargement && (
        <div className="self-start">
          <Bouton
            variante="discret"
            icone={archives ? 'retour' : 'archiver'}
            onClick={() => setArchives(!archives)}
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
