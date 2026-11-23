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
import ProfilFiche from '../components/ProfilFiche'
import SectionJournal from '../features/activites/SectionJournal'
import { cartesDeLAppareil } from '../features/aujourdhui/journee'
import { libelleSource } from '../features/contacts/contacts'
import { estPortable, lienSms } from '../features/contacts/telephone'
import { appelFiche } from '../features/liens/appel-fiche'
import { lireCompteursFiche, type CompteursFiche } from '../features/liens/compteurs-fiche'
import {
  LIBELLES_ONGLETS_PROJET,
  ongletsProjet,
  type OngletProjet,
} from '../features/liens/fiche-projet'
import LiensProjet from '../features/liens/LiensProjet'
import { useChangementEtape } from '../features/projets/changement-etape'
import FormulaireProjetVendeur from '../features/projets/FormulaireProjetVendeur'
import {
  aideEtapeSuivante,
  ancienneteEtape,
  estEtapeVendeur,
  ETAPES_VENDEUR,
  etapeQuiTraine,
  genreEtatProjet,
  libelleEtape,
  libelleEtatProjet,
  libelleMotifPerte,
  libelleTypeMandat,
  resumeEtat,
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
import { dateDuJour, formaterDate, formaterJourCourt } from '../lib/dates'
import { useTailleEcran } from '../lib/ecran'
import { etatsEtapes, phraseManque, phrasePassage } from '../lib/etapes'
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
 * Fiche d'un projet de vente (étape D.7), organisée comme la fiche Contact.
 * - Ordinateur : à gauche le profil (état, étapes en barre avec « Pour passer à l'étape
 *   suivante : … » et « Étape suivante », sorties, vendeur et bien, prochaine action), qui
 *   ne bouge pas ; à droite les onglets Activité, Tâches, Détails (touches 1 à 3). Depuis le
 *   pipeline, « 2 sur 5 » et deux flèches (K, J) dans l'ordre de la colonne de l'étape.
 * - Tablette et téléphone : un en-tête compact, les étapes, la prochaine action, puis les
 *   onglets (vendeur et bien en tête de Détails). Sur téléphone, Appeler, SMS et Consigner
 *   sont en bas de l'écran.
 */
export default function FicheProjetVendeur() {
  const { id = '' } = useParams()
  const taille = useTailleEcran()
  const ordinateur = taille === 'ordinateur'
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [version, setVersion] = useState(0)
  const [compteurs, setCompteurs] = useState<CompteursFiche | null>(null)
  const [modification, setModification] = useState(false)
  const [sortie, setSortie] = useState<'a_recontacter' | 'perdu' | null>(null)
  const [archivage, setArchivage] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [focusConsigner, setFocusConsigner] = useState(false)
  const [cartes] = useState(() => cartesDeLAppareil(navigator.userAgent))
  const toutRelire = () => setVersion((v) => v + 1)
  const changement = useChangementEtape(toutRelire)
  const aujourdhui = dateDuJour()
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
      <Page titre="Projet de vente" retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page titre="Projet de vente" retour={RETOUR}>
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
    <Bouton variante="secondaire" onClick={() => setModification(true)}>
      <Icone nom="modifier" className="size-5 md:hidden" />
      <span className="max-md:sr-only">Modifier</span>
    </Bouton>
  )
  const menu = archive ? null : (
    <MenuActions
      libelle="Autres actions sur le projet"
      elements={[{ libelle: 'Archiver', icone: 'archiver', onChoisir: () => setArchivage(true) }]}
    />
  )

  const identite = (grande: boolean) => (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="flex flex-wrap items-center gap-2">
        <Etiquette genre={genreEtatProjet(projet.etat)}>{libelleEtatProjet(projet.etat)}</Etiquette>
        <span className="text-sm text-encre-douce">Projet de vente</span>
      </p>
      <h1
        className={`leading-tight font-bold tracking-tight break-words text-encre ${
          grande ? 'text-2xl' : 'text-[1.375rem] md:text-[1.75rem]'
        }`}
      >
        {titre}
      </h1>
      <p className="text-sm text-encre-douce">{resumeEtat(projet)}</p>
    </div>
  )

  // L'étape en barre, ce qu'il faut pour la suivante, et les sorties du pipeline.
  const etapes = dansLePipeline && (
    <Carte titre="Étape">
      <BarreEtapes
        etapes={etatsEtapes(ETAPES_VENDEUR, projet.etape, projet.etat === 'gagne')}
        anciennete={
          projet.etat === 'actif'
            ? {
                texte: ancienneteEtape(projet.etape_le, aujourdhui),
                alerte: etapeQuiTraine(projet.etape_le, aujourdhui),
              }
            : undefined
        }
        critere={
          aide === null ? undefined : phrasePassage(libelleEtape(aide.suivante), aide.critere)
        }
        manque={aide === null ? undefined : phraseManque(aide.manquantes)}
        suivante={
          aide === null
            ? undefined
            : {
                libelle: libelleEtape(aide.suivante),
                onPasser: () => changement.demander(affiche, aide.suivante),
                desactive: changement.enCours !== null,
              }
        }
        choix={{
          onChoisir: (valeur) => {
            if (estEtapeVendeur(valeur)) changement.demander(affiche, valeur)
          },
          desactive: changement.enCours !== null,
        }}
      />
      <p className="mt-2 text-sm text-encre-douce">
        Touchez une étape pour y passer. Pour avancer, le critère de sortie des étapes franchies est
        demandé s'il manque.
      </p>
      {actif && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Bouton variante="secondaire" onClick={() => setSortie('a_recontacter')}>
            À recontacter…
          </Bouton>
          <Bouton variante="secondaire" onClick={() => setSortie('perdu')}>
            Perdu…
          </Bouton>
        </div>
      )}
    </Carte>
  )

  const horsPipeline = (projet.etat === 'a_recontacter' || projet.etat === 'perdu') && !archive && (
    <Carte titre="Hors du pipeline">
      <dl className="divide-y divide-bord">
        <Information nom="Étape atteinte" empilee={ordinateur}>
          {libelleEtape(projet.etape)}
        </Information>
        {projet.etat === 'a_recontacter' && (
          <Information nom="À recontacter le" empilee={ordinateur}>
            {formaterDate(projet.recontacter_le)}
          </Information>
        )}
        {projet.etat === 'perdu' && (
          <Information nom="Motif" empilee={ordinateur}>
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
      empilee={ordinateur}
    />
  )

  const prochaineAction = (
    <ProchaineTacheFiche
      fiche={{ projet: origine }}
      version={version}
      onChangement={toutRelire}
      libelle="Prochaine action"
      vide="Aucune action prévue pour ce projet"
      alerte={actif}
      repli={
        contact?.prochaine_action_le == null
          ? undefined
          : `Prochaine action du vendeur, hors de ce projet : ${formaterJourCourt(contact.prochaine_action_le, aujourdhui)}.`
      }
      compacte={ordinateur}
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
              />
            )}
            <SectionTaches
              projet={origine}
              version={version}
              onChangement={toutRelire}
              titre="À venir"
              limite={TACHES_DANS_ACTIVITE}
              onVoirTout={() => choisirOnglet('taches')}
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
        return <SectionTaches projet={origine} version={version} onChangement={toutRelire} />
      case 'biens':
      case 'details':
        return (
          <>
            {!ordinateur && liens}
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
            {!ordinateur && ligneDates}
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

  if (ordinateur) {
    return (
      <Page
        titre={titre}
        retour={RETOUR}
        enTete={null}
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
      >
        {message}
        <div className="grid items-start gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <ProfilFiche libelle={`Profil du projet ${titre}`}>
            {identite(true)}
            {etapes}
            {horsPipeline}
            {liens}
            {prochaineAction}
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
        {fenetres}
      </Page>
    )
  }

  return (
    <Page
      titre={titre}
      retour={RETOUR}
      enTete={
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">{identite(false)}</div>
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
      {prochaineAction}
      {taille === 'tablette' && (
        <div className="flex gap-2">
          <LienAction
            libelle="Appeler"
            icone="telephone"
            href={appel.lien}
            annonce={appel.annonce}
          />
          <LienAction
            libelle="SMS"
            icone="sms"
            variante="secondaire"
            href={portable === undefined ? undefined : lienSms(portable)}
          />
        </div>
      )}
      {ongletsFiche}
      {taille === 'telephone' && (
        <BarreActionsFiche libelle={`Actions sur ${titre}`}>
          <div className="flex flex-[2]">
            <LienAction
              libelle="Appeler"
              icone="telephone"
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
