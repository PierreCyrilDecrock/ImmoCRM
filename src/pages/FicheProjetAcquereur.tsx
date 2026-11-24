import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import BiensProposes from '../features/acquereurs/BiensProposes'
import {
  compterVisitesProjet,
  listerBiensProposes,
  type BienProposeAffiche,
} from '../features/acquereurs/biens-proposes'
import { useChangementEtapeAcquereur } from '../features/acquereurs/changement-etape-acquereur'
import FormulaireRecherche from '../features/acquereurs/FormulaireRecherche'
import OffreAcceptee from '../features/acquereurs/OffreAcceptee'
import {
  aideEtapeSuivanteAcquereur,
  estEtapeAcquereur,
  ETAPES_ACQUEREUR,
  genreEtatAcquereur,
  libelleBudget,
  libelleEtapeAcquereur,
  libelleEtatAcquereur,
  libelleFinancement,
  libelleMotifPerteAcquereur,
  libelleTypesRecherches,
  libelleUrgence,
  resumeEtatAcquereur,
  resumeOrigine,
} from '../features/acquereurs/pipeline-acquereur'
import {
  archiverProjetAcquereur,
  changerCoAcquereur,
  lireProjetAcquereurAffiche,
  reprendreProjetAcquereur,
  type ProjetAcquereurAffiche,
} from '../features/acquereurs/projets-acquereurs'
import SortieProjetAcquereur from '../features/acquereurs/SortieProjetAcquereur'
import SectionJournal from '../features/activites/SectionJournal'
import { cartesDeLAppareil } from '../features/aujourdhui/journee'
import { adresseBien } from '../features/biens/biens'
import { nomComplet, type Contact } from '../features/contacts/contacts'
import SelecteurContact from '../features/contacts/SelecteurContact'
import { estPortable, lienSms } from '../features/contacts/telephone'
import { appelFiche } from '../features/liens/appel-fiche'
import { lireCompteursFiche, type CompteursFiche } from '../features/liens/compteurs-fiche'
import {
  LIBELLES_ONGLETS_PROJET,
  ongletsProjet,
  type OngletProjet,
} from '../features/liens/fiche-projet'
import LiensProjet from '../features/liens/LiensProjet'
import { ancienneteEtape, etapeQuiTraine } from '../features/projets/pipeline-vendeur'
import ConsignerEchange from '../features/saisie/ConsignerEchange'
import { champConsigner, placerCurseur } from '../features/saisie/curseur-consigner'
import { ficheDeProjetAcquereur } from '../features/saisie/fiches-consultees'
import { useConsultation } from '../features/saisie/recents'
import ProchaineTacheFiche from '../features/taches/ProchaineTacheFiche'
import SectionTaches from '../features/taches/SectionTaches'
import {
  dateDuJour,
  formaterDate,
  formaterHeure,
  formaterJourCourt,
  heureDuMoment,
} from '../lib/dates'
import { useTailleEcran } from '../lib/ecran'
import { etatsEtapes, phraseManque, phrasePassage } from '../lib/etapes'
import { ligneDatesFiche, useOngletFiche, useParcoursFiche, useRaccourcisFiche } from '../lib/fiche'
import { formaterNombre, formaterPrix } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | {
      phase: 'pret'
      affiche: ProjetAcquereurAffiche
      proposes: BienProposeAffiche[]
      nbVisites: number
    }

const RETOUR = { vers: '/pipelines', libelle: 'Pipelines' }

/** Nombre de tâches à venir montrées dans l'onglet Activité (les autres sont dans Tâches). */
const TACHES_DANS_ACTIVITE = 3

const ONGLETS = ongletsProjet('acquereur')

const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/** « mar. 17 nov. 2026 à 14 h 30 » : l'instant de réception, à l'heure de Paris. */
function momentReception(instant: string): string {
  const date = new Date(instant)
  return `${formaterDate(instant)} à ${formaterHeure(heureDuMoment(date))}`
}

/**
 * Fiche d'un projet d'achat (étape D.7), organisée comme la fiche Contact.
 * - Ordinateur : à gauche le profil (état, étapes en barre avec « Pour passer à l'étape
 *   suivante : … » et « Étape suivante », sorties et offre acceptée, acquéreur et demande,
 *   prochaine action), qui ne bouge pas ; à droite les onglets Activité, Biens proposés,
 *   Tâches, Détails (touches 1 à 4). Depuis le pipeline, « 2 sur 5 » et deux flèches (K, J)
 *   dans l'ordre de la colonne de l'étape.
 * - Tablette et téléphone : un en-tête compact, les étapes, la prochaine action, puis les
 *   onglets (acquéreur et demande en tête de Détails). Sur téléphone, Appeler, SMS et
 *   Consigner sont en bas de l'écran.
 */
export default function FicheProjetAcquereur() {
  const { id = '' } = useParams()
  const taille = useTailleEcran()
  const ordinateur = taille === 'ordinateur'
  const telephone = taille === 'telephone'
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [version, setVersion] = useState(0)
  const [compteurs, setCompteurs] = useState<CompteursFiche | null>(null)
  const [modification, setModification] = useState(false)
  const [sortie, setSortie] = useState<'a_recontacter' | 'perdu' | null>(null)
  const [offre, setOffre] = useState(false)
  const [archivage, setArchivage] = useState(false)
  const [coAcquereur, setCoAcquereur] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [focusConsigner, setFocusConsigner] = useState(false)
  const [cartes] = useState(() => cartesDeLAppareil(navigator.userAgent))
  const toutRelire = () => setVersion((v) => v + 1)
  const changement = useChangementEtapeAcquereur(toutRelire)
  const aujourdhui = dateDuJour()
  useConsultation(etat.phase === 'pret' ? ficheDeProjetAcquereur(etat.affiche) : null)

  const [onglet, choisirOnglet] = useOngletFiche(ONGLETS)
  // Le parcours de la colonne du pipeline d'où l'on vient.
  const parcours = useParcoursFiche({
    domaine: 'projets-acquereurs',
    id,
    actif: ordinateur,
    chemin: (voisin) => `/pipelines/acquereurs/${voisin}`,
    echec: "Le projet suivant n'a pas pu être lu.",
  })
  useRaccourcisFiche({ onglets: ONGLETS, choisir: choisirOnglet, parcours })

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      const client = exigerSupabase()
      const [lu, proposes, visites] = await Promise.all([
        lireProjetAcquereurAffiche(client, id),
        listerBiensProposes(client, id),
        compterVisitesProjet(client, id),
      ])
      if (!lu.ok) return { phase: 'erreur', message: lu.erreur.message }
      if (!proposes.ok) return { phase: 'erreur', message: proposes.erreur.message }
      return {
        phase: 'pret',
        affiche: lu.donnees,
        proposes: proposes.donnees,
        nbVisites: visites.ok ? visites.donnees : 0,
      }
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
    void lireCompteursFiche(exigerSupabase(), { projetAcquereurId: id }).then((lus) => {
      if (actif) setCompteurs(lus)
    })
    return () => {
      actif = false
    }
  }, [id, version])

  if (etat.phase === 'chargement') {
    return (
      <Page fiche titre="Projet d'achat" retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page fiche titre="Projet d'achat" retour={RETOUR}>
        <Message genre="erreur">Le projet n'a pas pu être ouvert. {etat.message}</Message>
      </Page>
    )
  }

  const { affiche, proposes, nbVisites } = etat
  const { projet, contact, bienOrigine } = affiche
  const archive = projet.archived_at !== null
  const actif = projet.etat === 'actif' && !archive
  const dansLePipeline = (projet.etat === 'actif' || projet.etat === 'gagne') && !archive
  const aide = actif ? aideEtapeSuivanteAcquereur(projet, proposes.length) : null
  const origine = {
    lien: { genre: 'acquereur' as const, id: projet.id },
    contact,
    bien: null,
  }
  const offreBien = proposes.find((p) => p.propose.bien_id === projet.offre_bien_id)?.bien ?? null
  const titre = contact === null ? "Projet d'achat" : `Achat — ${nomComplet(contact)}`
  const personnes = [contact, affiche.coAcquereur].filter(
    (personne): personne is Contact => personne !== null,
  )
  const appel = appelFiche(personnes, 'contact introuvable')
  const portable = contact?.telephones.find(estPortable) ?? contact?.telephones[0]

  async function executer(action: () => Promise<{ ok: boolean; message?: string }>) {
    setEnvoi(true)
    const resultat = await action()
    setEnvoi(false)
    if (resultat.ok) toutRelire()
  }

  function reprendre() {
    void executer(async () => {
      const resultat = await reprendreProjetAcquereur(exigerSupabase(), projet.id)
      if (!resultat.ok) notifier('erreur', `La reprise a échoué. ${resultat.erreur.message}`)
      else notifier('succes', `Projet repris, à l’étape « ${libelleEtapeAcquereur(projet.etape)} »`)
      return resultat
    })
  }

  function archiver() {
    void executer(async () => {
      const resultat = await archiverProjetAcquereur(exigerSupabase(), projet.id)
      setArchivage(false)
      if (!resultat.ok) notifier('erreur', `L'archivage a échoué. ${resultat.erreur.message}`)
      else notifier('succes', 'Projet archivé')
      return resultat
    })
  }

  function choisirCoAcquereur(choisi: Contact | null) {
    setCoAcquereur(false)
    void executer(async () => {
      const resultat = await changerCoAcquereur(exigerSupabase(), projet.id, choisi?.id ?? null)
      if (!resultat.ok) notifier('erreur', `L'enregistrement a échoué. ${resultat.erreur.message}`)
      else notifier('succes', choisi === null ? 'Co-acquéreur retiré' : 'Co-acquéreur ajouté')
      return resultat
    })
  }

  const recherche: [string, string | null][] = [
    ['Types de biens', libelleTypesRecherches(projet) || null],
    ['Secteurs', projet.secteurs.length === 0 ? null : projet.secteurs.join(', ')],
    ['Budget', libelleBudget(projet.budget_min, projet.budget_max) || null],
    [
      'Surface minimum',
      projet.surface_min === null ? null : `${formaterNombre(projet.surface_min)} m²`,
    ],
    ['Pièces minimum', projet.pieces_min === null ? null : String(projet.pieces_min)],
    ['Indispensable', projet.criteres_indispensables || null],
    ['Souhaité', projet.criteres_souhaites || null],
    ['Urgence', projet.urgence === null ? null : libelleUrgence(projet.urgence)],
    [
      'Financement',
      projet.financement === null
        ? null
        : `${libelleFinancement(projet.financement)}${
            projet.financement === 'pret'
              ? projet.accord_principe
                ? ', accord de principe obtenu'
                : ', sans accord de principe'
              : ''
          }`,
    ],
    ['Apport', projet.apport === null ? null : formaterPrix(projet.apport)],
    ['Bien à vendre avant', projet.bien_a_vendre ? 'Oui' : null],
  ]
  const renseignees = recherche.filter((info): info is [string, string] => info[1] !== null)

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
        <Etiquette genre={genreEtatAcquereur(projet.etat)}>
          {libelleEtatAcquereur(projet.etat)}
        </Etiquette>
        <span className="text-sm text-encre-douce">Projet d’achat</span>
      </p>
      <h1
        className={`leading-tight font-bold tracking-tight break-words text-encre ${
          grande ? 'text-2xl' : 'text-[1.375rem] md:text-[1.75rem]'
        }`}
      >
        {titre}
      </h1>
      <p className="text-sm text-encre-douce">{resumeEtatAcquereur(projet)}</p>
    </div>
  )

  // L'étape en barre, ce qu'il faut pour la suivante, les sorties et l'offre acceptée.
  const etapes = dansLePipeline && (
    <Carte titre="Étape">
      <BarreEtapes
        etapes={etatsEtapes(ETAPES_ACQUEREUR, projet.etape, projet.etat === 'gagne')}
        anciennete={
          projet.etat === 'actif'
            ? {
                texte: ancienneteEtape(projet.etape_le, aujourdhui),
                alerte: etapeQuiTraine(projet.etape_le, aujourdhui),
              }
            : undefined
        }
        critere={
          aide === null
            ? undefined
            : phrasePassage(libelleEtapeAcquereur(aide.suivante), aide.critere)
        }
        manque={aide === null ? undefined : phraseManque(aide.manquantes)}
        suivante={
          aide === null
            ? undefined
            : {
                libelle: libelleEtapeAcquereur(aide.suivante),
                onPasser: () => changement.demander(affiche, aide.suivante),
                desactive: changement.enCours !== null,
              }
        }
        choix={
          actif
            ? {
                onChoisir: (valeur) => {
                  if (estEtapeAcquereur(valeur)) changement.demander(affiche, valeur)
                },
                desactive: changement.enCours !== null,
              }
            : undefined
        }
      />
      {projet.etat === 'gagne' ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-base text-encre">
            Offre acceptée le {formaterDate(projet.offre_le)}
            {offreBien === null ? '' : ` pour ${adresseBien(offreBien)}`}. Le suivi du dossier
            (compromis, financement, acte) viendra avec les transactions.
          </p>
          <div>
            <Bouton variante="secondaire" disabled={envoi} onClick={reprendre}>
              {envoi ? 'Reprise…' : 'Annuler l’offre et reprendre la recherche'}
            </Bouton>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-encre-douce">
            Touchez une étape pour y passer. Pour avancer, ce qui manque (budget, critères, biens
            proposés) est demandé.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {aide === null && <Bouton onClick={() => setOffre(true)}>Offre acceptée…</Bouton>}
            <Bouton variante="secondaire" onClick={() => setSortie('a_recontacter')}>
              À recontacter…
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setSortie('perdu')}>
              Perdu…
            </Bouton>
          </div>
        </>
      )}
    </Carte>
  )

  const horsPipeline = (projet.etat === 'a_recontacter' || projet.etat === 'perdu') && !archive && (
    <Carte titre="Hors du pipeline">
      <dl className="divide-y divide-bord">
        <Information nom="Étape atteinte">{libelleEtapeAcquereur(projet.etape)}</Information>
        {projet.etat === 'a_recontacter' && (
          <Information nom="À recontacter le">{formaterDate(projet.recontacter_le)}</Information>
        )}
        {projet.etat === 'perdu' && (
          <Information nom="Motif">
            {libelleMotifPerteAcquereur(projet.motif_perte)}
            {projet.motif_perte_detail !== '' && (
              <span className="block text-sm text-encre-douce">{projet.motif_perte_detail}</span>
            )}
          </Information>
        )}
      </dl>
      <div className="mt-4">
        <Bouton variante="secondaire" disabled={envoi} onClick={reprendre}>
          {envoi ? 'Reprise…' : 'Remettre dans le pipeline'}
        </Bouton>
      </div>
    </Carte>
  )

  const liens = (
    <LiensProjet
      titre="Acquéreur et demande"
      contact={{ role: 'Acquéreur', fiche: contact }}
      bien={bienOrigine === null ? undefined : { role: 'Bien concerné', fiche: bienOrigine }}
      cartes={cartes}

      apres={
        coAcquereur &&
        contact !== null && (
          <div className="mt-3 flex flex-col gap-2">
            <SelecteurContact
              libelle="Chercher le co-acquéreur"
              sauf={contact.id}
              autoFocus
              onChoisir={choisirCoAcquereur}
            />
            <div>
              <Bouton variante="discret" onClick={() => setCoAcquereur(false)}>
                Fermer la recherche
              </Bouton>
            </div>
          </div>
        )
      }
    >
      <Information nom="Co-acquéreur">
        {affiche.coAcquereur !== null ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/contacts/${affiche.coAcquereur.id}`} className={CLASSES_LIEN}>
              {nomComplet(affiche.coAcquereur)}
            </Link>
            {!archive && (
              <Bouton variante="discret" disabled={envoi} onClick={() => choisirCoAcquereur(null)}>
                Retirer
              </Bouton>
            )}
          </span>
        ) : archive ? (
          'Aucun'
        ) : (
          <Bouton variante="discret" icone="ajouter" onClick={() => setCoAcquereur(true)}>
            Ajouter un co-acquéreur
          </Bouton>
        )}
      </Information>
      {(projet.origine !== null || projet.portail !== '') && (
        <Information nom="Origine">{resumeOrigine(projet)}</Information>
      )}
      {projet.recue_le !== null && (
        <Information nom="Reçue le">{momentReception(projet.recue_le)}</Information>
      )}
    </LiensProjet>
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
          : `Prochaine action de l’acquéreur, hors de ce projet : ${formaterJourCourt(contact.prochaine_action_le, aujourdhui)}.`
      }
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
                contacts={personnes}
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
      case 'biens':
        return (
          <BiensProposes
            projetId={projet.id}
            proposes={proposes}
            lectureSeule={!actif}
            onChangement={toutRelire}
          />
        )
      case 'taches':
        return <SectionTaches projet={origine} version={version} onChangement={toutRelire} />
      case 'details':
        return (
          <>
            {telephone && liens}
            <Carte titre="La recherche">
              {renseignees.length === 0 && projet.notes === '' ? (
                <p className="text-sm text-encre-douce">
                  Rien de noté pour l'instant. Touchez « Modifier » pour indiquer le budget, les
                  critères et le financement.
                </p>
              ) : (
                <dl className="divide-y divide-bord">
                  {renseignees.map(([nom, valeur]) => (
                    <Information key={nom} nom={nom}>
                      <span className="break-words whitespace-pre-wrap">{valeur}</span>
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
    biens: proposes.length,
    taches: compteurs?.taches,
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
        <FormulaireRecherche
          projet={projet}
          onFermer={() => setModification(false)}
          onEnregistre={() => {
            setModification(false)
            toutRelire()
          }}
        />
      )}
      {sortie !== null && (
        <SortieProjetAcquereur
          projetId={projet.id}
          genre={sortie}
          onFermer={() => setSortie(null)}
          onFait={() => {
            setSortie(null)
            toutRelire()
          }}
        />
      )}
      {offre && (
        <OffreAcceptee
          projetId={projet.id}
          proposes={proposes}
          nbVisites={nbVisites}
          onFermer={() => setOffre(false)}
          onFait={() => {
            setOffre(false)
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
            <Bouton pleineLargeur disabled={envoi} onClick={archiver}>
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
          pipeline et des fiches. Pour une recherche qui n'aboutit pas, utilisez plutôt « Perdu » ou
          « À recontacter » : le motif est gardé pour les statistiques.
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
      {telephone ? (
        prochaineAction
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {liens}
          {prochaineAction}
        </div>
      )}
      {ongletsFiche}
      {telephone && (
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
