import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import BarreActionsFiche from '../components/BarreActionsFiche'
import BarreEtapes from '../components/BarreEtapes'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import EtatChargement from '../components/EtatChargement'
import Etiquette from '../components/Etiquette'
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
import SectionJournal from '../features/activites/SectionJournal'
import { cartesDeLAppareil } from '../features/aujourdhui/journee'
import { libelleSource, nomComplet } from '../features/contacts/contacts'
import { estPortable, lienSms } from '../features/contacts/telephone'
import { appelFiche } from '../features/liens/appel-fiche'
import { lireCompteursFiche, type CompteursFiche } from '../features/liens/compteurs-fiche'
import {
  enTeteProjetVendeur,
  LIBELLES_ONGLETS_PROJET,
  ongletsProjet,
  pastilleEtatProjet,
  ALERTE_PROJET,
  PLANIFIER_PROJET,
  videTachesProjet,
  type OngletProjet,
} from '../features/liens/fiche-projet'
import LiensProjet from '../features/liens/LiensProjet'
import { useSuiteProjet } from '../features/liens/suite-projet'
import { useChangementEtape } from '../features/projets/changement-etape'
import FormulaireProjetVendeur from '../features/projets/FormulaireProjetVendeur'
import {
  aideEtapeSuivante,
  ancienneteFrise,
  estEtapeVendeur,
  estRenseignable,
  ETAPES_VENDEUR,
  libelleEtape,
  libelleMotifPerte,
  libelleTypeMandat,
  resumeEtat,
  type InfoRenseignable,
} from '../features/projets/pipeline-vendeur'
import {
  archiverProjetVendeur,
  completerProjets,
  lireProjetVendeur,
  reprendreProjetVendeur,
  type ProjetVendeurAffiche,
} from '../features/projets/projets-vendeurs'
import SortieProjet from '../features/projets/SortieProjet'
import ConsignerEchange from '../features/saisie/ConsignerEchange'
import { champConsigner, placerCurseur } from '../features/saisie/curseur-consigner'
import { ficheDeProjetVendeur } from '../features/saisie/fiches-consultees'
import { useConsultation } from '../features/saisie/recents'
import ProchaineTacheFiche from '../features/taches/ProchaineTacheFiche'
import SectionTaches from '../features/taches/SectionTaches'
import { dateDuJour, formaterDate } from '../lib/dates'
import { useTailleEcran } from '../lib/ecran'
import { etatsEtapes, titrePassage } from '../lib/etapes'
import { ligneDatesFiche, useOngletFiche, useParcoursFiche, useRaccourcisFiche } from '../lib/fiche'
import { formaterPrix } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; affiche: ProjetVendeurAffiche }

const RETOUR = { vers: '/pipelines', libelle: 'Pipelines' }

/** Nombre de tâches à venir montrées dans l'onglet Activité (les autres sont dans Tâches). */
const TACHES_DANS_ACTIVITE = 3

const ONGLETS = ongletsProjet('vendeur')

const prix = (montant: number | null) => (montant === null ? null : formaterPrix(montant))

/**
 * Fiche d'un projet de vente (étapes D.7 et E.7), pleine page sur tous les écrans. La
 * question de la fiche est « qu'est-ce qui manque pour avancer ? » : en haut, le bien en
 * titre (« Projet de vente · vendeur » au-dessus, Modifier et le menu « … »), puis la frise
 * des étapes (l'étape en cours, écrite là seulement, avec son ancienneté), les critères pour
 * passer à la suivante et le bouton « Passer à … ». « À recontacter » et « Perdu » sont dans
 * le menu « … ». Dessous, vendeur et bien, la prochaine action, puis les onglets Activité,
 * Tâches, Détails (touches 1 à 3). Sur ordinateur, depuis le pipeline, « 2 sur 5 » et deux
 * flèches (K, J). Sur téléphone, vendeur et bien sont en tête de Détails, et Appeler, SMS et
 * Consigner en bas de l'écran.
 */
export default function FicheProjetVendeur() {
  const { id = '' } = useParams()
  const taille = useTailleEcran()
  const ordinateur = taille === 'ordinateur'
  const telephone = taille === 'telephone'
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [version, setVersion] = useState(0)
  const [compteurs, setCompteurs] = useState<CompteursFiche | null>(null)
  const [modification, setModification] = useState(false)
  /** Le champ à ouvrir, quand la fenêtre s'ouvre depuis un critère manquant. */
  const [champ, setChamp] = useState<InfoRenseignable | undefined>(undefined)
  const [sortie, setSortie] = useState<'a_recontacter' | 'perdu' | null>(null)
  const [archivage, setArchivage] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [focusConsigner, setFocusConsigner] = useState(false)
  const [cartes] = useState(() => cartesDeLAppareil(navigator.userAgent))
  const toutRelire = () => setVersion((v) => v + 1)
  const changement = useChangementEtape(toutRelire)
  const aujourdhui = dateDuJour()
  // Ce qui est prévu pour le projet, ou pour son contact ailleurs : carte orange ou phrase grise.
  const projetLu = etat.phase === 'pret' ? etat.affiche.projet : null
  const suite = useSuiteProjet({
    lien: { genre: 'vendeur', id },
    contact: etat.phase === 'pret' ? etat.affiche.contact : null,
    actif: projetLu !== null && projetLu.etat === 'actif' && projetLu.archived_at === null,
    aujourdhui,
    version,
    pret: etat.phase === 'pret',
  })
  useConsultation(etat.phase === 'pret' ? ficheDeProjetVendeur(etat.affiche) : null)

  const [onglet, choisirOnglet] = useOngletFiche(ONGLETS)
  // Le parcours de la colonne du pipeline d'où l'on vient.
  const parcours = useParcoursFiche({
    domaine: 'projets-vendeurs',
    id,
    actif: ordinateur,
    chemin: (voisin) => `/pipelines/vendeurs/${voisin}`,
    echec: "Le projet suivant n'a pas pu être lu.",
  })
  useRaccourcisFiche({ onglets: ONGLETS, choisir: choisirOnglet, parcours })

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      const client = exigerSupabase()
      const lu = await lireProjetVendeur(client, id)
      if (!lu.ok) return { phase: 'erreur', message: lu.erreur.message }
      const complet = await completerProjets(client, [lu.donnees])
      if (!complet.ok) return { phase: 'erreur', message: complet.erreur.message }
      const affiche = complet.donnees[0]
      return affiche === undefined
        ? { phase: 'erreur', message: 'Projet introuvable.' }
        : { phase: 'pret', affiche }
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
    }
  }, [id, version])

  // Les compteurs des onglets, relus après chaque geste.
  useEffect(() => {
    let actif = true
    void lireCompteursFiche(exigerSupabase(), { projetVendeurId: id }).then((lus) => {
      if (actif) setCompteurs(lus)
    })
    return () => {
      actif = false
    }
  }, [id, version])

  if (etat.phase === 'chargement') {
    return (
      <Page fiche titre="Projet de vente" retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page fiche titre="Projet de vente" retour={RETOUR}>
        <Message genre="erreur">Le projet n'a pas pu être ouvert. {etat.message}</Message>
      </Page>
    )
  }

  const { affiche } = etat
  const { projet, contact, bien } = affiche
  const archive = projet.archived_at !== null
  const actif = projet.etat === 'actif' && !archive
  const dansLePipeline = (projet.etat === 'actif' || projet.etat === 'gagne') && !archive
  const aide = actif ? aideEtapeSuivante(projet, contact?.source ?? null) : null
  const origine = { lien: { genre: 'vendeur' as const, id: projet.id }, contact, bien }
  const titre = bien === null ? 'Projet de vente' : `Vente — ${bien.adresse}`
  const enTete = enTeteProjetVendeur(
    bien?.adresse ?? null,
    contact === null ? null : nomComplet(contact),
  )
  const pastille = pastilleEtatProjet({
    etat: projet.etat,
    archive,
    recontacterLe: projet.recontacter_le,
    gagne: resumeEtat(projet),
  })
  const appel = appelFiche(contact === null ? [] : [contact], 'contact introuvable')
  const portable = contact?.telephones.find(estPortable) ?? contact?.telephones[0]

  async function reprendre() {
    setEnvoi(true)
    const resultat = await reprendreProjetVendeur(exigerSupabase(), projet.id)
    setEnvoi(false)
    if (!resultat.ok) {
      notifier('erreur', `La reprise a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', `Projet repris, à l’étape « ${libelleEtape(projet.etape)} »`)
    toutRelire()
  }

  async function archiver() {
    setEnvoi(true)
    const resultat = await archiverProjetVendeur(exigerSupabase(), projet.id)
    setEnvoi(false)
    setArchivage(false)
    if (!resultat.ok) {
      notifier('erreur', `L'archivage a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Projet archivé')
    toutRelire()
  }

  const informations: [string, string | null][] = [
    ['Motif de la vente', projet.motif_vente === '' ? null : projet.motif_vente],
    [
      'Vendu idéalement avant le',
      projet.echeance_souhaitee === null ? null : formaterDate(projet.echeance_souhaitee),
    ],
    ['Prix espéré par le vendeur', prix(projet.prix_espere)],
    [
      'Estimation',
      projet.estimation_basse === null && projet.estimation_haute === null
        ? null
        : `${prix(projet.estimation_basse) ?? '?'} à ${prix(projet.estimation_haute) ?? '?'}${
            projet.estimation_le === null ? '' : `, le ${formaterDate(projet.estimation_le)}`
          }`,
    ],
    [
      'Avis de valeur remis le',
      projet.avis_remis_le === null ? null : formaterDate(projet.avis_remis_le),
    ],
    [
      'Autres agences consultées',
      projet.agences_consultees === '' ? null : projet.agences_consultees,
    ],
    [
      'Mandat signé ailleurs',
      projet.mandat_ailleurs
        ? projet.mandat_ailleurs_fin === null
          ? 'Oui'
          : `Oui, jusqu’au ${formaterDate(projet.mandat_ailleurs_fin)}`
        : null,
    ],
    [
      'Mandat',
      projet.mandat_type === null
        ? null
        : `${libelleTypeMandat(projet.mandat_type)}${projet.mandat_le === null ? '' : `, signé le ${formaterDate(projet.mandat_le)}`}`,
    ],
  ]
  const renseignees = informations.filter((info): info is [string, string] => info[1] !== null)

  const message = archive && (
    <Message genre="info">
      Ce projet est archivé depuis le {formaterDate(projet.archived_at)} : il n'apparaît plus dans
      le pipeline ni sur les fiches.
    </Message>
  )

  const modifier = archive ? null : (
    <Bouton
      variante="secondaire"
      onClick={() => {
        setChamp(undefined)
        setModification(true)
      }}
    >
      <Icone nom="modifier" className="size-5 md:hidden" />
      <span className="max-md:sr-only">Modifier</span>
    </Bouton>
  )
  // Les gestes rares : sortir du pipeline (projet en cours), archiver.
  const menu = archive ? null : (
    <MenuActions
      libelle="Autres actions sur le projet"
      elements={[
        ...(actif
          ? [
              {
                libelle: 'À recontacter…',
                icone: 'horloge' as const,
                onChoisir: () => setSortie('a_recontacter'),
              },
              { libelle: 'Perdu…', icone: 'fermer' as const, onChoisir: () => setSortie('perdu') },
            ]
          : []),
        { libelle: 'Archiver', icone: 'archiver', onChoisir: () => setArchivage(true) },
      ]}
    />
  )

  // Le type de projet et le vendeur, avec l'état d'un projet hors du pipeline ; puis le bien.
  const identite = (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-encre-douce">
        {pastille !== null && <Etiquette genre={pastille.genre}>{pastille.texte}</Etiquette>}
        <span>{enTete.surtitre}</span>
      </p>
      <h1 className="text-[1.375rem] leading-tight font-bold tracking-tight break-words text-encre md:text-[1.75rem]">
        {enTete.titre}
      </h1>
    </div>
  )

  // La frise des étapes, ce qu'il faut pour la suivante et le bouton qui y fait passer.
  const etapes = dansLePipeline && (
    <Carte>
      <BarreEtapes
        etapes={etatsEtapes(ETAPES_VENDEUR, projet.etape, projet.etat === 'gagne')}
        anciennete={
          projet.etat === 'actif' ? ancienneteFrise(projet.etape_le, aujourdhui) : undefined
        }
        passage={
          aide === null
            ? undefined
            : { titre: titrePassage(libelleEtape(aide.suivante)), criteres: aide.criteres }
        }
        suivante={
          aide === null
            ? undefined
            : {
                libelle: libelleEtape(aide.suivante),
                onPasser: () => changement.demander(affiche, aide.suivante),
                desactive: changement.enCours !== null,
                principal: true,
              }
        }
        choix={{
          onChoisir: (valeur) => {
            if (estEtapeVendeur(valeur)) changement.demander(affiche, valeur)
          },
          desactive: changement.enCours !== null,
        }}
        // « Renseigner le motif de la vente › » : la fenêtre du projet, le champ prêt.
        onRenseigner={
          archive
            ? undefined
            : (info) => {
                if (!estRenseignable(info)) return
                setChamp(info)
                setModification(true)
              }
        }
      />
    </Carte>
  )

  const horsPipeline = (projet.etat === 'a_recontacter' || projet.etat === 'perdu') && !archive && (
    <Carte titre="Hors du pipeline">
      <dl className="divide-y divide-bord">
        <Information nom="Étape atteinte">{libelleEtape(projet.etape)}</Information>
        {projet.etat === 'perdu' && (
          <Information nom="Motif">
            {libelleMotifPerte(projet.motif_perte)}
            {projet.motif_perte_detail !== '' && (
              <span className="block text-sm text-encre-douce">{projet.motif_perte_detail}</span>
            )}
          </Information>
        )}
      </dl>
      <div className="mt-4">
        <Bouton variante="secondaire" disabled={envoi} onClick={() => void reprendre()}>
          {envoi ? 'Reprise…' : 'Remettre dans le pipeline'}
        </Bouton>
      </div>
    </Carte>
  )

  const liens = (
    <LiensProjet
      titre="Vendeur et bien"
      contact={{
        role: 'Vendeur',
        fiche: contact,
        detail:
          contact === null
            ? undefined
            : `Source : ${libelleSource(contact.source) ?? 'non précisée'}`,
      }}
      bien={bien === null ? undefined : { role: 'Bien', fiche: bien }}
      cartes={cartes}
    />
  )

  const prochaineAction = (
    <ProchaineTacheFiche
      fiche={{ projet: origine }}
      version={version}
      onChangement={toutRelire}
      libelle="Prochaine action"
      vide={ALERTE_PROJET}
      alerte={actif}
      // Rien pour ce projet mais une action ailleurs : pas d'orange, « À venir » le dit en gris.
      masquerSiVide={suite.forme !== 'alerte'}
      libelleCreer={PLANIFIER_PROJET}
      lectureSeule={archive}
    />
  )
  const ligneDates = (
    <p className="text-sm text-encre-douce">{ligneDatesFiche(projet, aujourdhui, true)}</p>
  )

  function contenuOnglet(choisi: OngletProjet): ReactNode {
    switch (choisi) {
      case 'activite':
        return (
          <>
            {!archive && (
              <ConsignerEchange
                key={projet.id}
                fiche={{ projet: origine }}
                version={version}
                onEnregistre={toutRelire}
                demandeFocus={focusConsigner}
                onFocusDonne={() => setFocusConsigner(false)}
                repliable={!ordinateur}
              />
            )}
            <SectionTaches
              projet={origine}
              version={version}
              onChangement={toutRelire}
              titre="À venir"
              limite={TACHES_DANS_ACTIVITE}
              // La prochaine action, montrée au-dessus des onglets, n'est pas répétée.
              sansLaPremiere
              onVoirTout={() => choisirOnglet('taches')}
              vide={videTachesProjet(suite, 'a_venir', archive)}
              libelleAjout={PLANIFIER_PROJET}
            />
            <SectionJournal
              projet={origine}
              version={version}
              onChangement={toutRelire}
              historique
            />
          </>
        )
      case 'taches':
        return (
          <SectionTaches
            projet={origine}
            version={version}
            onChangement={toutRelire}
            vide={videTachesProjet(suite, 'taches', archive)}
            libelleAjout={PLANIFIER_PROJET}
          />
        )
      case 'biens':
      case 'details':
        return (
          <>
            {telephone && liens}
            <Carte titre="Le projet">
              {renseignees.length === 0 && projet.notes === '' ? (
                <p className="text-sm text-encre-douce">
                  Rien de noté pour l'instant. Touchez « Modifier » pour ajouter le motif, le délai,
                  le prix espéré ou la concurrence.
                </p>
              ) : (
                <dl className="divide-y divide-bord">
                  {renseignees.map(([nom, valeur]) => (
                    <Information key={nom} nom={nom}>
                      {valeur}
                    </Information>
                  ))}
                  {projet.notes !== '' && (
                    <Information nom="Notes">
                      <span className="break-words whitespace-pre-wrap">{projet.notes}</span>
                    </Information>
                  )}
                </dl>
              )}
            </Carte>
            {ligneDates}
          </>
        )
    }
  }

  const compteurDe: Record<OngletProjet, number | null | undefined> = {
    activite: compteurs?.activites,
    taches: compteurs?.taches,
    biens: undefined,
    details: undefined,
  }
  const ongletsFiche = (
    <OngletsFiche
      id="onglets-fiche-projet"
      libelle="Rubriques du projet"
      options={ONGLETS.map((valeur) => ({
        valeur,
        libelle: LIBELLES_ONGLETS_PROJET[valeur],
        compteur: compteurDe[valeur],
      }))}
      valeur={onglet}
      onChange={choisirOnglet}
    >
      {contenuOnglet(onglet)}
    </OngletsFiche>
  )

  const fenetres = (
    <>
      {changement.fenetre}
      {modification && (
        <FormulaireProjetVendeur
          projet={projet}
          champ={champ}
          onFermer={() => setModification(false)}
          onEnregistre={() => {
            setModification(false)
            toutRelire()
          }}
        />
      )}
      {sortie !== null && (
        <SortieProjet
          projet={projet}
          genre={sortie}
          onFermer={() => setSortie(null)}
          onFait={() => {
            setSortie(null)
            toutRelire()
          }}
        />
      )}
      <FenetreModale
        ouverte={archivage}
        titre="Archiver ce projet ?"
        onFermer={() => setArchivage(false)}
        pied={
          <>
            <Bouton pleineLargeur disabled={envoi} onClick={() => void archiver()}>
              {envoi ? 'Archivage…' : 'Archiver'}
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setArchivage(false)}>
              Annuler
            </Bouton>
          </>
        }
      >
        <p className="text-base text-encre">
          L'archivage sert à retirer un projet saisi par erreur ou en double : il disparaît du
          pipeline et des fiches. Pour un projet qui n'aboutit pas, utilisez plutôt « Perdu » ou « À
          recontacter » : le motif est gardé pour les statistiques.
        </p>
      </FenetreModale>
    </>
  )

  // Pleine page sur tous les écrans : l'en-tête, la frise des étapes en premier, puis le reste
  // et les onglets dessous. Pas de colonne de profil : la frise a toute la largeur.
  return (
    <Page
      fiche
      titre={titre}
      retour={RETOUR}
      finRetour={
        parcours !== null && (
          <NavigationFiche
            position={parcours.position}
            quoi="la colonne du pipeline"
            enCours={parcours.enCours}
            onPrecedent={parcours.onPrecedent}
            onSuivant={parcours.onSuivant}
          />
        )
      }
      enTete={
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">{identite}</div>
          <div className="flex shrink-0 gap-2">
            {modifier}
            {menu}
          </div>
        </div>
      }
    >
      {message}
      {etapes}
      {horsPipeline}
      {telephone ? (
        prochaineAction
      ) : (
        <div
          className={`grid items-start gap-4 ${suite.forme === 'phrase' ? '' : 'lg:grid-cols-2'}`}
        >
          {liens}
          {prochaineAction}
        </div>
      )}
      {ongletsFiche}
      {telephone && (
        <BarreActionsFiche libelle={`Actions sur ${titre}`}>
          <div className="flex flex-[2]">
            {/* Un seul bouton bleu : « Passer à … » l'est quand il est là. */}
            <LienAction
              libelle="Appeler"
              icone="telephone"
              variante={aide === null ? 'principal' : 'secondaire'}
              href={appel.lien}
              annonce={appel.annonce}
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
              archive
                ? undefined
                : () => {
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
      {fenetres}
    </Page>
  )
}
