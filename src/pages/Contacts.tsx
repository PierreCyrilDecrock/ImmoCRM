import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import Page from '../components/Page'
import {
  brouillonVide,
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
import { chercherDoublons, libelleMotifs, motifsDoublon } from '../features/contacts/doublons'
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
          <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-alerte-doux p-3">
            <p className="text-base font-semibold text-encre">
              {doublons.length > 1
                ? 'Ces fiches existent peut-être déjà'
                : 'Cette fiche existe peut-être déjà'}
            </p>
            <Liste>
              {doublons.map((doublon) => (
                <LigneListe
                  key={doublon.id}
                  titre={nomDeListe(doublon)}
                  detail={[
                    preparation?.ok === true
                      ? libelleMotifs(motifsDoublon(preparation.valeurs, doublon))
                      : null,
                    resumeContact(doublon),
                    doublon.archived_at !== null ? 'archivée' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  vers={`/contacts/${doublon.id}`}
                />
              ))}
            </Liste>
            <p className="text-sm text-encre">
              Touchez une fiche pour l'ouvrir. Si c'est bien une autre personne, touchez « Créer
              quand même ».
            </p>
          </div>
        )}
        <FormulaireContact court brouillon={brouillon} erreurs={erreurs} onChange={setBrouillon} />
      </form>
    </FenetreModale>
  )
}

/** Élément invisible en bas de liste : dès qu'il approche de l'écran, la suite est demandée. */
function Sentinelle({ onVisible }: { onVisible: () => void }) {
  const repere = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = repere.current
    if (element === null || !('IntersectionObserver' in window)) return
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((entree) => entree.isIntersecting)) onVisible()
      },
      { root: element.closest('main'), rootMargin: '600px 0px' },
    )
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [onVisible])
  return <div ref={repere} aria-hidden="true" />
}

/**
 * Liste des contacts : recherche instantanée, filtres combinables, défilement progressif.
 * La recherche et les filtres sont gardés en mémoire tant que l'onglet reste ouvert.
 */
export default function Contacts() {
  const [archives, setArchives] = useState(false)
  const [filtres, setFiltres] = useState<FiltresContacts>(filtresMemorises)
  const [panneau, setPanneau] = useState(() => nombreFiltres(filtres) > 0)
  const [etiquettes, setEtiquettes] = useState<string[]>([])
  const [creation, setCreation] = useState(false)
  const liste = useListeContacts(filtres, archives)
  const restreinte = listeRestreinte(filtres)
  const nbFiltres = nombreFiltres(filtres)

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
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <ChampRecherche
            libelle="Rechercher dans les contacts"
            placeholder="Nom, téléphone, courriel, adresse…"
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
                onClick={() => changerFiltres({ ...FILTRES_VIDES, recherche: filtres.recherche })}
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
                <Bouton variante="secondaire" onClick={() => changerFiltres(FILTRES_VIDES)}>
                  Tout afficher
                </Bouton>
              }
            >
              Aucune fiche{archives ? ' archivée' : ''} ne correspond à cette recherche
              {nbFiltres > 0 ? ' et à ces filtres' : ''}.
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
                detail={resumeContact(contact)}
                vers={`/contacts/${contact.id}`}
              />
            ))}
          </Liste>
          {liste.erreurSuite !== null && (
            <Message genre="erreur">La suite n'a pas pu être lue. {liste.erreurSuite}</Message>
          )}
          {liste.resteALire && (
            <>
              {/* Après un échec, on attend un geste plutôt que de réessayer en boucle. */}
              {liste.erreurSuite === null && <Sentinelle onVisible={liste.chargerSuite} />}
              <div className="self-center">
                <Bouton
                  variante="secondaire"
                  disabled={liste.suiteEnCours}
                  onClick={liste.chargerSuite}
                >
                  {liste.suiteEnCours
                    ? 'Chargement…'
                    : liste.erreurSuite !== null
                      ? 'Réessayer'
                      : 'Afficher la suite'}
                </Bouton>
              </div>
            </>
          )}
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
