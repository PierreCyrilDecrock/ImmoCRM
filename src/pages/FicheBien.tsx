import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import BarreActionsFiche from '../components/BarreActionsFiche'
import Bouton from '../components/Bouton'
import BoutonCopier from '../components/BoutonCopier'
import Carte from '../components/Carte'
import EtatChargement from '../components/EtatChargement'
import Etiquette from '../components/Etiquette'
import PastilleStatut from '../features/biens/PastilleStatut'
import FenetreModale from '../components/FenetreModale'
import Icone from '../components/Icone'
import Information from '../components/Information'
import LienAction from '../components/LienAction'
import MenuActions from '../components/MenuActions'
import Message from '../components/Message'
import NavigationFiche from '../components/NavigationFiche'
import { useNotifications } from '../components/notifications-contexte'
import OngletsFiche from '../components/OngletsFiche'
import Page from '../components/Page'
import ProfilFiche from '../components/ProfilFiche'
import SectionAcquereursDuBien from '../features/acquereurs/SectionAcquereursDuBien'
import SectionJournal from '../features/activites/SectionJournal'
import { cartesDeLAppareil, lienItineraire } from '../features/aujourdhui/journee'
import {
  adresseBien,
  archiverBien,
  champUtilise,
  communeBien,
  evolutionPrix,
  libelleEtage,
  libelleEtat,
  libelleNatureCommerce,
  libelleOccupation,
  libelleTypes,
  lireBien,
  listerPrixBien,
  restaurerBien,
  type Bien,
  type ChampSelonType,
  type PrixBien,
} from '../features/biens/biens'
import {
  LIBELLES_ONGLETS_BIEN,
  ONGLETS_BIEN,
  prixEtSurface,
  type OngletBien,
} from '../features/biens/fiche-bien'
import { lirePageBiens } from '../features/biens/liste-biens'
import PhotoPrincipale from '../features/biens/PhotoPrincipale'
import PhotosBien from '../features/biens/PhotosBien'
import ProprietairesBien, { type EtatProprietaires } from '../features/biens/ProprietairesBien'
import { listerProprietaires } from '../features/biens/proprietaires'
import { appelFiche } from '../features/liens/appel-fiche'
import { lireCompteursBien, type CompteursBien } from '../features/liens/compteurs-fiche'
import SectionProjetsVendeurs from '../features/projets/SectionProjetsVendeurs'
import ConsignerEchange from '../features/saisie/ConsignerEchange'
import { champConsigner, placerCurseur } from '../features/saisie/curseur-consigner'
import { ficheDeBien } from '../features/saisie/fiches-consultees'
import { useConsultation } from '../features/saisie/recents'
import ProchaineTacheFiche from '../features/taches/ProchaineTacheFiche'
import SectionTaches from '../features/taches/SectionTaches'
import { dateDuJour, formaterDate } from '../lib/dates'
import { useTailleEcran } from '../lib/ecran'
import {
  GRILLE_FICHE,
  ligneDatesFiche,
  useOngletFiche,
  useParcoursFiche,
  useRaccourcisFiche,
} from '../lib/fiche'
import { formaterNombre, formaterPrix, formaterSurface } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  /** `prix` : l'historique, le plus récent d'abord ; `null` s'il n'a pas pu être lu. */
  | { phase: 'pret'; bien: Bien; prix: PrixBien[] | null }

const RETOUR = { vers: '/biens', libelle: 'Biens' }

/** Nombre de tâches à venir montrées dans l'onglet Activité (les autres sont dans Tâches). */
const TACHES_DANS_ACTIVITE = 3

const CLASSES_MODIFIER =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-surface px-3 text-base font-semibold text-encre shadow-xs ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const ouiNon = (valeur: boolean) => (valeur ? 'Oui' : 'Non')
const montant = (euros: number, unite = '') => `${formaterPrix(euros)}${unite}`

/** Un diagnostic (DPE ou GES) sur une ligne : « Classe C · 150 kWh/m²/an · le 4 mai 2026 ». */
function diagnostic(
  classe: string | null,
  valeur: number | null,
  unite: string,
  date: string | null,
) {
  const morceaux = [
    classe === null ? null : `Classe ${classe}`,
    valeur === null ? null : `${formaterNombre(valeur)} ${unite}`,
    date === null ? null : `le ${formaterDate(date)}`,
  ].filter((morceau) => morceau !== null)
  return morceaux.length === 0 ? null : morceaux.join(' · ')
}

/**
 * Fiche d'un bien (étape D.7), organisée comme la fiche Contact. Ce qu'on cherche en y
 * allant reste sous les yeux ; le reste est rangé en onglets, gardés dans l'adresse.
 * - Ordinateur : à gauche le profil (photo principale et sa galerie, type, adresse avec
 *   Copier et Itinéraire, prix et surface, propriétaires à appeler d'un toucher, prochaine
 *   tâche), qui ne bouge pas ; à droite les onglets Activité, Projets et acquéreurs, Tâches,
 *   Détails (touches 1 à 4). Depuis la liste des biens, « 12 sur 48 » et deux flèches (K, J).
 * - Tablette et téléphone : un en-tête compact, la prochaine tâche, puis les mêmes onglets,
 *   les propriétaires en tête de Détails. Sur téléphone, Itinéraire, Appeler le propriétaire
 *   et Consigner sont en bas de l'écran.
 */
export default function FicheBien() {
  const { id = '' } = useParams()
  const taille = useTailleEcran()
  const ordinateur = taille === 'ordinateur'
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [proprietaires, setProprietaires] = useState<EtatProprietaires>({ phase: 'chargement' })
  const [confirmation, setConfirmation] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  // Change après chaque geste sur les tâches ou le journal : les rubriques se relisent (une
  // tâche faite depuis la fiche inscrit une activité au journal).
  const [version, setVersion] = useState(0)
  // Change après un ajout ou un retrait de propriétaire, ou un changement de photo.
  const [versionProprietaires, setVersionProprietaires] = useState(0)
  const [versionPhotos, setVersionPhotos] = useState(0)
  const [compteurs, setCompteurs] = useState<CompteursBien | null>(null)
  // « Consigner » de la barre du bas : le curseur ira dans le texte du compte rendu.
  const [focusConsigner, setFocusConsigner] = useState(false)
  const [cartes] = useState(() => cartesDeLAppareil(navigator.userAgent))
  const toutRelire = () => setVersion((v) => v + 1)
  useConsultation(etat.phase === 'pret' ? ficheDeBien(etat.bien) : null)

  const [onglet, choisirOnglet] = useOngletFiche(ONGLETS_BIEN)
  // Le parcours de la liste : seulement pour une fiche ouverte depuis la liste des biens.
  const parcours = useParcoursFiche({
    domaine: 'biens',
    id,
    actif: ordinateur,
    chemin: (voisin) => `/biens/${voisin}`,
    lirePage: lirePageBiens,
    echec: "Le bien suivant n'a pas pu être lu.",
  })
  useRaccourcisFiche({ onglets: ONGLETS_BIEN, choisir: choisirOnglet, parcours })

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      const client = exigerSupabase()
      const resultat = await lireBien(client, id)
      if (!resultat.ok) return { phase: 'erreur', message: resultat.erreur.message }
      // L'historique des prix : son absence n'empêche pas d'afficher la fiche.
      const historique = await listerPrixBien(client, id)
      return {
        phase: 'pret',
        bien: resultat.donnees,
        prix: historique.ok ? historique.donnees : null,
      }
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
      setEtat({ phase: 'chargement' })
    }
  }, [id])

  // Les propriétaires : le profil, la barre du bas et le compte rendu s'en servent.
  useEffect(() => {
    let actif = true
    void listerProprietaires(exigerSupabase(), id).then((resultat) => {
      if (!actif) return
      setProprietaires(
        resultat.ok
          ? { phase: 'pret', proprietaires: resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
  }, [id, versionProprietaires])

  // Les compteurs des onglets, relus après chaque geste.
  useEffect(() => {
    let actif = true
    void lireCompteursBien(exigerSupabase(), id).then((lus) => {
      if (actif) setCompteurs(lus)
    })
    return () => {
      actif = false
    }
  }, [id, version])

  if (etat.phase !== 'pret') {
    return (
      <Page fiche titre="Bien" retour={RETOUR}>
        {etat.phase === 'chargement' ? (
          <EtatChargement />
        ) : (
          <Message genre="erreur">La fiche n'a pas pu être ouverte. {etat.message}</Message>
        )}
      </Page>
    )
  }

  const { bien, prix } = etat
  const aujourdhui = dateDuJour()
  const archive = bien.archived_at !== null
  const utilise = (champ: ChampSelonType) => champUtilise(bien, champ)
  const commune = communeBien(bien)
  const adresse = adresseBien(bien)
  const resume = prixEtSurface(bien)
  const lesProprietaires =
    proprietaires.phase === 'pret' ? proprietaires.proprietaires.map((p) => p.contact) : []
  const appel = appelFiche(lesProprietaires, 'aucun propriétaire lié')
  const itineraire = lienItineraire(adresse, cartes)

  async function changerArchivage() {
    setEnvoi(true)
    const client = exigerSupabase()
    const resultat = archive
      ? await restaurerBien(client, bien.id)
      : await archiverBien(client, bien.id)
    setEnvoi(false)
    setConfirmation(false)
    if (!resultat.ok) {
      notifier('erreur', `L'action a échoué. ${resultat.erreur.message}`)
      return
    }
    setEtat({ phase: 'pret', bien: resultat.donnees, prix })
    notifier('succes', archive ? 'Bien restauré' : 'Bien archivé')
  }

  // Chaque ligne n'apparaît que si le champ concerne ce type de bien et qu'il est renseigné.
  const caracteristiques: [string, string | null][] = [
    ['Surface', utilise('surface') && bien.surface !== null ? formaterSurface(bien.surface) : null],
    [
      'Surface du terrain',
      utilise('surface_terrain') && bien.surface_terrain !== null
        ? formaterSurface(bien.surface_terrain)
        : null,
    ],
    ['Pièces', utilise('pieces') && bien.pieces !== null ? String(bien.pieces) : null],
    ['Chambres', utilise('chambres') && bien.chambres !== null ? String(bien.chambres) : null],
    ['Étage', utilise('etage') && bien.etage !== null ? libelleEtage(bien.etage) : null],
    [
      'Année de construction',
      utilise('annee_construction') && bien.annee_construction !== null
        ? String(bien.annee_construction)
        : null,
    ],
    ['État', utilise('etat') ? libelleEtat(bien.etat) : null],
  ]

  // Ce qui est propre au type principal (commerce, terrain) et au type secondaire (ancien,
  // neuf, viager) : chaque ligne n'apparaît que si son champ concerne ce bien.
  const lignesPropres: [ChampSelonType, string, string | null][] = [
    ['copropriete', 'Copropriété', bien.copropriete === null ? null : ouiNon(bien.copropriete)],
    [
      'charges_annuelles',
      'Charges',
      bien.charges_annuelles === null ? null : montant(bien.charges_annuelles, ' par an'),
    ],
    [
      'taxe_fonciere',
      'Taxe foncière',
      bien.taxe_fonciere === null ? null : montant(bien.taxe_fonciere, ' par an'),
    ],
    ['programme', 'Programme', bien.programme || null],
    ['lot', 'Lot', bien.lot || null],
    [
      'date_livraison',
      'Livraison',
      bien.date_livraison === null ? null : formaterDate(bien.date_livraison),
    ],
    [
      'viager_bouquet',
      'Bouquet',
      bien.viager_bouquet === null ? null : montant(bien.viager_bouquet),
    ],
    [
      'viager_rente',
      'Rente',
      bien.viager_rente === null ? null : montant(bien.viager_rente, ' par mois'),
    ],
    ['viager_occupation', 'Occupation', libelleOccupation(bien.viager_occupation)],
    [
      'viager_ages',
      'Crédirentiers',
      bien.viager_ages.length === 0
        ? null
        : `${bien.viager_ages.map((age) => `${age} ans`).join(' et ')} (âge noté à la saisie)`,
    ],
    ['commerce_nature', 'Vente', libelleNatureCommerce(bien.commerce_nature)],
    ['commerce_activite', 'Activité', bien.commerce_activite || null],
    ['commerce_bail', 'Bail', bien.commerce_bail || null],
    [
      'commerce_loyer',
      'Loyer',
      bien.commerce_loyer === null ? null : montant(bien.commerce_loyer, ' par an'),
    ],
    [
      'constructible',
      'Constructible',
      bien.constructible === null ? null : ouiNon(bien.constructible),
    ],
    ['viabilise', 'Viabilisé', bien.viabilise === null ? null : ouiNon(bien.viabilise)],
  ]
  const propres: [string, string | null][] = lignesPropres
    .filter(([champ]) => utilise(champ))
    .map(([, nom, valeur]) => [nom, valeur])

  const diagnostics: [string, string | null][] = utilise('dpe_classe')
    ? [
        ['DPE', diagnostic(bien.dpe_classe, bien.dpe_valeur, 'kWh/m²/an', bien.dpe_date)],
        ['GES', diagnostic(bien.ges_classe, bien.ges_valeur, 'kg CO₂/m²/an', bien.ges_date)],
      ]
    : []

  const rubrique = (titre: string, lignes: [string, string | null][], vide: string) => {
    const renseignees = lignes.filter(([, valeur]) => valeur !== null)
    return (
      <Carte titre={titre}>
        {renseignees.length === 0 ? (
          <p className="text-sm text-encre-douce">{vide}</p>
        ) : (
          <dl className="divide-y divide-bord">
            {renseignees.map(([nom, valeur]) => (
              <Information key={nom} nom={nom}>
                {valeur}
              </Information>
            ))}
          </dl>
        )}
      </Carte>
    )
  }
  const aCompleter = 'Rien de renseigné pour l’instant. Touchez « Modifier » pour compléter.'

  const message = archive && (
    <Message genre="info">
      Cette fiche est archivée depuis le {formaterDate(bien.archived_at)} : elle n'apparaît plus
      dans la liste des biens. « Restaurer la fiche » est dans le menu « … ».
    </Message>
  )

  const modifier = (
    <Link to={`/biens/${bien.id}/modifier`} className={CLASSES_MODIFIER}>
      <Icone nom="modifier" className="size-5 md:hidden" />
      <span className="max-md:sr-only">Modifier</span>
    </Link>
  )
  const menu = (
    <MenuActions
      libelle="Autres actions sur la fiche"
      elements={[
        archive
          ? {
              libelle: 'Restaurer la fiche',
              icone: 'archiver',
              desactive: envoi,
              onChoisir: () => void changerArchivage(),
            }
          : { libelle: 'Archiver', icone: 'archiver', onChoisir: () => setConfirmation(true) },
      ]}
    />
  )

  // Qui c'est, d'un coup d'œil : le statut, le type, l'adresse (titre), la commune, le prix.
  const etiquettes = (
    <p className="flex flex-wrap items-center gap-2">
      <PastilleStatut statut={bien.statut} />
      {/* Le type, moins décisif que le statut, en texte simple. */}
      <span className="text-sm text-encre-douce">{libelleTypes(bien)}</span>
      {archive && <Etiquette genre="alerte">Archivé</Etiquette>}
    </p>
  )
  const identite = (grande: boolean) => (
    <div className="flex min-w-0 flex-col gap-1">
      {grande && etiquettes}
      <h1
        className={`leading-tight font-bold tracking-tight break-words text-encre ${
          grande ? 'text-2xl' : 'text-[1.375rem] md:text-[1.75rem]'
        }`}
      >
        {bien.adresse}
      </h1>
      <div className="group/ligne flex min-w-0 items-center gap-1">
        {(bien.complement !== '' || commune !== '') && (
          <p className="min-w-0 text-base break-words text-encre-douce">
            {[bien.complement, commune].filter((morceau) => morceau !== '').join(' · ')}
          </p>
        )}
        <BoutonCopier valeur={adresse} quoi="l'adresse" />
      </div>
      <p className="text-xl font-bold text-encre tabular-nums">
        {resume === '' ? (
          <span className="text-base font-normal text-encre-douce">Prix non renseigné</span>
        ) : (
          resume
        )}
      </p>
    </div>
  )

  const proprietairesCarte = (
    <ProprietairesBien
      bienId={bien.id}
      etat={proprietaires}
      onChangement={() => setVersionProprietaires((v) => v + 1)}
      lectureSeule={archive}
    />
  )
  const prochaineTache = (
    <ProchaineTacheFiche
      fiche={{ bien }}
      version={version}
      onChangement={toutRelire}
      libelle="Prochaine tâche"
      vide="Aucune tâche prévue pour ce bien"
      compacte={ordinateur}
      lectureSeule={archive}
    />
  )
  const ligneDates = <p className="text-sm text-encre-douce">{ligneDatesFiche(bien, aujourdhui)}</p>

  function contenuOnglet(choisi: OngletBien): ReactNode {
    switch (choisi) {
      case 'activite':
        return (
          <>
            {!archive && (
              <ConsignerEchange
                // Un autre bien (bien suivant) repart d'un bloc vide, ou de son brouillon.
                key={bien.id}
                fiche={{ bien }}
                contacts={lesProprietaires}
                version={version}
                onEnregistre={toutRelire}
                demandeFocus={focusConsigner}
                onFocusDonne={() => setFocusConsigner(false)}
                repliable={!ordinateur}
              />
            )}
            <SectionTaches
              bien={bien}
              version={version}
              onChangement={toutRelire}
              titre="À venir"
              limite={TACHES_DANS_ACTIVITE}
              onVoirTout={() => choisirOnglet('taches')}
            />
            <SectionJournal bien={bien} version={version} onChangement={toutRelire} historique />
          </>
        )
      case 'projets':
        return (
          <>
            <SectionProjetsVendeurs bien={bien} lectureSeule={archive} avecEtapes />
            <SectionAcquereursDuBien bien={bien} lectureSeule={archive} />
          </>
        )
      case 'taches':
        return <SectionTaches bien={bien} version={version} onChangement={toutRelire} />
      case 'details':
        return (
          <>
            {!ordinateur && proprietairesCarte}
            <div className="grid gap-4 xl:grid-cols-2">
              {rubrique('Caractéristiques', caracteristiques, aCompleter)}
              {propres.length > 0 &&
                rubrique(`Propre au type « ${libelleTypes(bien)} »`, propres, aCompleter)}
              {diagnostics.length > 0 &&
                rubrique('Diagnostics', diagnostics, 'DPE et GES non renseignés.')}
              <Carte titre="Historique des prix">
                {prix === null ? (
                  <Message genre="erreur">
                    L'historique n'a pas pu être lu. Rechargez la page.
                  </Message>
                ) : prix.length === 0 ? (
                  <p className="text-sm text-encre-douce">
                    Aucun prix enregistré. Dès qu'un prix est saisi, puis à chaque changement, il
                    est noté ici avec sa date.
                  </p>
                ) : (
                  <ol className="divide-y divide-bord">
                    {prix.map((ligne, rang) => {
                      const evolution = evolutionPrix(ligne.prix, prix[rang + 1]?.prix ?? null)
                      return (
                        <li key={ligne.id} className="flex flex-wrap items-baseline gap-x-3 py-2">
                          <span className="text-base font-semibold text-encre">
                            {formaterPrix(ligne.prix)}
                          </span>
                          {evolution !== '' && (
                            <span className="text-sm text-encre-douce">{evolution}</span>
                          )}
                          <span className="ml-auto text-sm text-encre-douce">
                            {formaterDate(ligne.created_at)}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </Carte>
            </div>
            <Carte titre="Description">
              {bien.description === '' ? (
                <p className="text-sm text-encre-douce">{aCompleter}</p>
              ) : (
                <p className="text-base break-words whitespace-pre-wrap text-encre">
                  {bien.description}
                </p>
              )}
            </Carte>
            <PhotosBien bienId={bien.id} onChangement={() => setVersionPhotos((v) => v + 1)} />
            {!ordinateur && ligneDates}
          </>
        )
    }
  }

  const compteurDe: Record<OngletBien, number | null | undefined> = {
    activite: compteurs?.activites,
    projets: compteurs?.projets,
    taches: compteurs?.taches,
    details: undefined,
  }
  const ongletsFiche = (
    <OngletsFiche
      id="onglets-fiche-bien"
      libelle="Rubriques de la fiche"
      options={ONGLETS_BIEN.map((valeur) => ({
        valeur,
        libelle: LIBELLES_ONGLETS_BIEN[valeur],
        compteur: compteurDe[valeur],
      }))}
      valeur={onglet}
      onChange={choisirOnglet}
    >
      {contenuOnglet(onglet)}
    </OngletsFiche>
  )

  const confirmationArchivage = (
    <FenetreModale
      ouverte={confirmation}
      titre="Archiver ce bien ?"
      onFermer={() => setConfirmation(false)}
      pied={
        <>
          <Bouton pleineLargeur disabled={envoi} onClick={() => void changerArchivage()}>
            {envoi ? 'Archivage…' : 'Archiver'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={() => setConfirmation(false)}>
            Annuler
          </Bouton>
        </>
      }
    >
      <p className="text-base text-encre">
        {adresse} quittera la liste des biens. Rien n'est supprimé : la fiche reste dans « Biens
        archivés » et peut être restaurée à tout moment.
      </p>
    </FenetreModale>
  )

  if (ordinateur) {
    return (
      <Page
        fiche
        titre={bien.adresse}
        retour={RETOUR}
        enTete={null}
        finRetour={
          parcours !== null && (
            <NavigationFiche
              position={parcours.position}
              quoi="la liste des biens"
              enCours={parcours.enCours}
              onPrecedent={parcours.onPrecedent}
              onSuivant={parcours.onSuivant}
            />
          )
        }
      >
        {message}
        <div className={GRILLE_FICHE}>
          <ProfilFiche libelle={`Profil du bien ${adresse}`}>
            <PhotoPrincipale
              bienId={bien.id}
              version={versionPhotos}
              taille="grande"
              description={`Photo du bien, ${bien.adresse}`}
            />
            {identite(true)}
            <div className="flex gap-2">
              <LienAction
                libelle="Itinéraire"
                icone="itineraire"
                variante="secondaire"
                nouvelOnglet
                href={itineraire}
              />
            </div>
            {proprietairesCarte}
            {prochaineTache}
            <div className="flex flex-col gap-2">
              {ligneDates}
              <div className="flex gap-2">
                {modifier}
                {menu}
              </div>
            </div>
          </ProfilFiche>
          {ongletsFiche}
        </div>
        {confirmationArchivage}
      </Page>
    )
  }

  return (
    <Page
      fiche
      titre={bien.adresse}
      retour={RETOUR}
      enTete={
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <PhotoPrincipale
              bienId={bien.id}
              version={versionPhotos}
              taille="compacte"
              description={`Photo du bien, ${bien.adresse}`}
            />
            <div className="min-w-0 flex-1 pt-1">{etiquettes}</div>
            <div className="flex shrink-0 gap-2">
              {modifier}
              {menu}
            </div>
          </div>
          {identite(false)}
        </div>
      }
    >
      {message}
      {prochaineTache}
      {taille === 'tablette' && (
        <div className="flex gap-2">
          <LienAction
            libelle="Appeler le propriétaire"
            icone="telephone"
            href={appel.lien}
            annonce={appel.annonce}
          />
          <LienAction
            libelle="Itinéraire"
            icone="itineraire"
            variante="secondaire"
            nouvelOnglet
            href={itineraire}
          />
        </div>
      )}
      {ongletsFiche}
      {taille === 'telephone' && (
        <BarreActionsFiche libelle={`Actions sur ${adresse}`}>
          <div className="flex flex-[2]">
            <LienAction libelle="Itinéraire" icone="itineraire" nouvelOnglet href={itineraire} />
          </div>
          <LienAction
            libelle="Appeler"
            icone="telephone"
            variante="secondaire"
            href={appel.lien}
            annonce={appel.annonce}
          />
          <LienAction
            libelle="Consigner"
            icone="journal"
            variante="secondaire"
            onClick={
              archive
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
      {confirmationArchivage}
    </Page>
  )
}
