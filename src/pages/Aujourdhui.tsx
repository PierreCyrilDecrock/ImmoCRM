import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EtatChargement from '../components/EtatChargement'
import Onglets from '../components/Onglets'
import Page from '../components/Page'
import AnneauProgression from '../features/aujourdhui/AnneauProgression'
import BlocJournee from '../features/aujourdhui/BlocJournee'
import CarteMaintenant from '../features/aujourdhui/CarteMaintenant'
import CompteursJournee from '../features/aujourdhui/CompteursJournee'
import {
  basculerRepli,
  cartesDeLAppareil,
  idDuBloc,
  memoriserReplis,
  replisMemorises,
  type CleBloc,
} from '../features/aujourdhui/journee'
import { lireJournee, type Journee } from '../features/aujourdhui/lecture-journee'
import LigneAlerte from '../features/aujourdhui/LigneAlerte'
import LigneNouveaute from '../features/aujourdhui/LigneNouveaute'
import LigneRelance from '../features/aujourdhui/LigneRelance'
import LigneRendezVous from '../features/aujourdhui/LigneRendezVous'
import {
  aPreparer,
  choisirMaintenant,
  compteursJournee,
  etatRendezVous,
  finDeJournee,
  finDuDernierRendezVous,
  nomDuRendezVous,
  placeDuTrait,
  progression,
  rendezVousCiDessus,
  rendezVousRestants,
  resumeJournee,
  salutation,
  sansAPreparer,
  type BlocCompte,
} from '../features/aujourdhui/maintenant'
import {
  basculerRelance,
  compteurRappels,
  echeanceADroite,
  filtrerRappels,
  filtreRappelsMemorise,
  FILTRES_RAPPELS,
  grouperTaches,
  memoriserFiltreRappels,
  parUrgence,
  premieresRelances,
  relanceDeplieeAffichee,
  RELANCES_D_EMBLEE,
  videAutresTaches,
  videRappels,
  type FiltreRappels,
} from '../features/aujourdhui/ordre-journee'
import TraitMaintenant from '../features/aujourdhui/TraitMaintenant'
import TroisActions from '../features/aujourdhui/TroisActions'
import type { Contact } from '../features/contacts/contacts'
import { FILTRES_VIDES, memoriserFiltres } from '../features/contacts/filtres'
import { titreRelance } from '../features/relances/boucle'
import FormulaireTache from '../features/taches/FormulaireTache'
import { useGestesTache } from '../features/taches/gestes-tache'
import LigneTache from '../features/taches/LigneTache'
import { dateDuJour, formaterJourEtSemaine, heureDuMoment, minutesDuJour } from '../lib/dates'
import type { Resultat } from '../lib/donnees'
import { useSurvolPossible } from '../lib/ecran'
import { useMaintenant } from '../lib/horloge'
import { exigerSupabase } from '../lib/supabase'

/** Au retour sur l'écran après ce délai (application remise au premier plan), il se relit. */
const RELIRE_APRES_MS = 60_000

const CLASSES_LIEN =
  'inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/** Le nombre d'éléments d'un bloc lu, ou `null` s'il n'est pas (encore) connu. */
function compteur<D extends { total: number }>(bloc: Resultat<D> | undefined): number | null {
  return bloc !== undefined && bloc.ok ? bloc.donnees.total : null
}

function erreurDe(bloc: Resultat<unknown> | undefined): string | null {
  return bloc !== undefined && !bloc.ok ? bloc.erreur.message : null
}

/** « Voir les 42 » quand le bloc n'affiche qu'une partie de ses éléments. */
function VoirTout({
  affiches,
  total,
  vers,
  libelle,
  onClick,
}: {
  affiches: number
  total: number
  vers: string
  libelle: string
  onClick?: () => void
}) {
  if (total <= affiches) return null
  return (
    <p className="mt-1 text-sm text-encre-douce">
      {affiches} affichés sur {total}.{' '}
      <Link to={vers} onClick={onClick} className={CLASSES_LIEN}>
        {libelle}
      </Link>
    </p>
  )
}

/**
 * Écran « Aujourd'hui », page d'accueil : qui contacter aujourd'hui, et pourquoi. En tête, la
 * date, la salutation (l'anneau de progression à sa droite, dès le premier geste), puis la
 * journée en compteurs qu'on touche pour descendre au bloc (« 3 rendez-vous », « 4 à
 * rappeler », « 1 tâche ») et une ligne courte (la fin du dernier rendez-vous, l'avancement
 * dès le premier geste) ; puis la carte « Maintenant » (le rendez-vous en cours ou le
 * prochain) à côté des trois actions qui comptent ; enfin cinq blocs dans l'ordre où la
 * journée se vit : agenda, relances, autres tâches, alertes, nouveautés. Chaque bloc a son
 * compteur et se replie. L'écran suit l'heure à la minute (temps restant, trait
 * « maintenant ») sans relire la base.
 */
export default function Aujourdhui() {
  const maintenant = useMaintenant()
  const aujourdhui = dateDuJour(maintenant)
  const heure = heureDuMoment(maintenant)
  const minutes = minutesDuJour(heure) ?? 0
  const [journee, setJournee] = useState<Journee | null>(null)
  const [lecture, setLecture] = useState(true)
  const [version, setVersion] = useState(0)
  const [replies, setReplies] = useState<CleBloc[]>(replisMemorises)
  const [aPlanifier, setAPlanifier] = useState<Contact | null>(null)
  const [filtreRappels, setFiltreRappels] = useState<FiltreRappels>(filtreRappelsMemorise)
  const [toutesRelances, setToutesRelances] = useState(false)
  // Sur écran tactile, une seule relance dépliée à la fois.
  const [relanceTouchee, setRelanceTouchee] = useState<string | null>(null)
  // De même, un seul rendez-vous de l'agenda déplié à la fois.
  const [rendezVousTouche, setRendezVousTouche] = useState<string | null>(null)
  const survol = useSurvolPossible()
  const derniereLecture = useRef(0)
  const [cartes] = useState(() => cartesDeLAppareil(navigator.userAgent))

  const relire = useCallback(() => {
    setLecture(true)
    setVersion((v) => v + 1)
  }, [])
  const gestes = useGestesTache({ aujourdhui, onChangement: relire })

  useEffect(() => {
    let actif = true
    void lireJournee(exigerSupabase(), aujourdhui).then((lue) => {
      if (!actif) return
      derniereLecture.current = Date.now()
      setJournee(lue)
      setLecture(false)
    })
    return () => {
      actif = false
    }
  }, [aujourdhui, version])

  // L'écran reste ouvert toute la journée : il se relit quand on y revient.
  useEffect(() => {
    function auRetour() {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - derniereLecture.current > RELIRE_APRES_MS
      ) {
        relire()
      }
    }
    document.addEventListener('visibilitychange', auRetour)
    return () => document.removeEventListener('visibilitychange', auRetour)
  }, [relire])

  function choisirFiltreRappels(filtre: FiltreRappels) {
    setFiltreRappels(filtre)
    memoriserFiltreRappels(filtre)
  }

  function basculer(bloc: CleBloc) {
    const suivants = basculerRepli(replies, bloc)
    setReplies(suivants)
    memoriserReplis(suivants)
  }

  /** Un compteur de l'en-tête : déplie son bloc s'il est replié, et y descend. */
  function allerAuBloc(bloc: BlocCompte) {
    if (replies.includes(bloc)) basculer(bloc)
    // Après l'affichage du bloc déplié.
    requestAnimationFrame(() => {
      const section = document.getElementById(idDuBloc(bloc))
      if (section === null) return
      const doux = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      section.scrollIntoView({ block: 'start', behavior: doux ? 'smooth' : 'auto' })
      // Le clavier suit : il se pose sur le titre du bloc.
      section.querySelector('button')?.focus({ preventScroll: true })
    })
  }

  const proprietesBloc = (bloc: CleBloc) => ({
    cle: bloc,
    replie: replies.includes(bloc),
    onBasculer: () => basculer(bloc),
  })

  const agenda = journee?.agenda
  const relances = journee?.relances
  const taches = journee?.taches
  const alertes = journee?.alertes
  const nouveautes = journee?.nouveautes
  const totalAlertes =
    alertes !== undefined && alertes.ok
      ? alertes.donnees.reduce((somme, groupe) => somme + groupe.total, 0)
      : null

  // Tout ce qui suit se calcule sur les données déjà lues : aucune requête de plus.
  const lignesAgenda = agenda?.ok ? agenda.donnees.lignes : []
  const lignesRelances = relances?.ok ? relances.donnees.lignes : []
  const lignesTaches = taches?.ok ? taches.donnees.lignes : []
  const choix = agenda?.ok ? choisirMaintenant(lignesAgenda, lignesRelances, minutes) : null
  const fin = finDuDernierRendezVous(lignesAgenda.map((affichee) => affichee.tache))
  // Lu par les lecteurs d'écran : la journée en une phrase.
  const resume =
    agenda?.ok && relances?.ok
      ? resumeJournee({
          rendezVous: agenda.donnees.total,
          rappels: relances.donnees.total,
          fin,
          minutes,
        })
      : null
  const compteurs =
    agenda?.ok && relances?.ok && taches?.ok
      ? compteursJournee({
          rendezVous: agenda.donnees.total,
          rappels: relances.donnees.total,
          rappelsEnRetard: lignesRelances.some((relance) => relance.tache.echeance < aujourdhui),
          taches: taches.donnees.total,
          tachesEnRetard: lignesTaches.some((affichee) => affichee.tache.echeance < aujourdhui),
        })
      : null
  const ligneFin = agenda?.ok ? finDeJournee(fin, agenda.donnees.total, minutes) : null
  const avancement =
    agenda?.ok && relances?.ok && taches?.ok && journee?.faitesDuJour.ok
      ? progression(
          agenda.donnees.total + relances.donnees.total + taches.donnees.total,
          journee.faitesDuJour.donnees,
        )
      : null
  const placeTrait = placeDuTrait(lignesAgenda, minutes)
  const rappelsAffiches = filtrerRappels(parUrgence(lignesRelances), filtreRappels)
  const compteRappels = relances?.ok
    ? compteurRappels(
        filtreRappels,
        relances.donnees.total,
        lignesRelances.length,
        rappelsAffiches.length,
      )
    : null
  const { affichees: relancesMontrees, reste: relancesRepliees } = premieresRelances(
    rappelsAffiches,
    toutesRelances,
  )
  const relanceDepliee = relanceDeplieeAffichee(relanceTouchee, relancesMontrees)
  const rendezVousDeplie = relanceDeplieeAffichee(rendezVousTouche, lignesAgenda)
  const ciDessus = rendezVousCiDessus(choix)
  const preparees =
    choix !== null && choix.genre === 'rendez_vous'
      ? aPreparer(choix.affichee, [...lignesTaches, ...lignesRelances])
      : []
  // Règle 12 : une tâche « À préparer » dans la carte n'est pas répétée dans « Autres tâches ».
  const autresTaches = sansAPreparer(lignesTaches, preparees)
  const tachesMasquees = lignesTaches.length - autresTaches.length
  const compteurTaches = taches?.ok ? taches.donnees.total - tachesMasquees : null
  const groupesTaches = grouperTaches(autresTaches, aujourdhui)
  // Vide, « Autres tâches » situe ce qui reste ailleurs ; le vert attend une journée finie.
  const videTaches = videAutresTaches({
    relances: relances?.ok ? relances.donnees.total : 0,
    rendezVous: rendezVousRestants(lignesAgenda, minutes),
    aPreparer:
      choix !== null && choix.genre === 'rendez_vous'
        ? { nombre: tachesMasquees, pour: nomDuRendezVous(choix.affichee.tache) }
        : undefined,
  })
  const titre = salutation(journee?.nomAffiche ?? '')

  return (
    <Page
      titre={titre}
      titreOnglet="Aujourd'hui"
      surtitre={
        <p className="text-base font-medium text-encre-douce">
          {formaterJourEtSemaine(aujourdhui)}
        </p>
      }
      enTete={
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h1 className="min-w-0 text-titre leading-tight font-bold tracking-tight break-words text-encre md:text-4xl">
            {titre}
          </h1>
          {avancement?.anneau === true && <AnneauProgression progression={avancement} />}
        </div>
      }
    >
      {resume !== null && compteurs !== null && (
        <div className="-mt-3 flex flex-col gap-1.5">
          {/* Les lecteurs d'écran entendent la journée en une phrase, comme avant les compteurs. */}
          <p className="sr-only">{resume}</p>
          {compteurs.length > 0 ? (
            <CompteursJournee compteurs={compteurs} onAller={allerAuBloc} />
          ) : (
            <p aria-hidden="true" className="text-base text-encre">
              {resume}
            </p>
          )}
          {(ligneFin !== null || avancement?.anneau === true) && (
            <p aria-hidden="true" className="text-sm text-encre-douce">
              {/* Chaque morceau passe à la ligne d'un bloc : jamais « faits. » seul (recette D.8). */}
              {[ligneFin, avancement?.anneau === true ? avancement.phrase : null]
                .filter((morceau) => morceau !== null)
                .flatMap((morceau, rang) => [
                  rang > 0 ? ' ' : null,
                  <span key={morceau} className="inline-block">
                    {morceau}
                  </span>,
                ])}
            </p>
          )}
          {/* L'avancement, annoncé quand il change. */}
          <p className="sr-only" aria-live="polite">
            {avancement?.annonce ?? ''}
          </p>
        </div>
      )}

      <div
        className={`grid gap-4 ${choix !== null ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start' : ''}`}
      >
        {choix !== null && (
          <CarteMaintenant
            choix={choix}
            minutes={minutes}
            aujourdhui={aujourdhui}
            aPreparer={preparees}
            cartes={cartes}
            occupee={gestes.occupee}
            onCocher={gestes.cocher}
            onOuvrir={gestes.ouvrir}
          />
        )}
        <TroisActions key={aujourdhui} jour={aujourdhui} />
      </div>

      {journee === null ? (
        <EtatChargement libelle="Lecture de la journée…" />
      ) : (
        <div className={`flex flex-col gap-4 ${lecture ? 'opacity-60' : ''}`} aria-busy={lecture}>
          <BlocJournee
            {...proprietesBloc('agenda')}
            titre="Agenda du jour"
            icone="horloge"
            compteur={compteur(agenda)}
            erreur={erreurDe(agenda)}
            vide={{
              titre: 'Aucun rendez-vous aujourd’hui.',
              texte: 'Du temps libre pour prospecter ou rappeler vos contacts.',
            }}
          >
            {agenda?.ok && (
              // La frise déborde sur la marge du bloc : le titre gagne une trentaine de lettres.
              <ul className="-mx-2 divide-y divide-bord">
                {lignesAgenda.map((affichee, rang) => (
                  <Fragment key={affichee.id}>
                    {rang === placeTrait && <TraitMaintenant heure={heure} />}
                    <LigneRendezVous
                      affichee={affichee}
                      cartes={cartes}
                      occupee={gestes.occupee === affichee.id}
                      onCocher={() => gestes.cocher(affichee)}
                      onOuvrir={() => gestes.ouvrir(affichee)}
                      survol={survol}
                      depliee={affichee.id === rendezVousDeplie}
                      onBasculer={() =>
                        setRendezVousTouche(basculerRelance(rendezVousDeplie, affichee.id))
                      }
                      passe={etatRendezVous(affichee.tache, minutes) === 'passe'}
                      ciDessus={affichee.id === ciDessus}
                    />
                  </Fragment>
                ))}
                {placeTrait === lignesAgenda.length && <TraitMaintenant heure={heure} />}
              </ul>
            )}
          </BlocJournee>

          <BlocJournee
            {...proprietesBloc('relances')}
            titre="À rappeler"
            sousTitre="La plus urgente en premier"
            icone="telephone"
            compteur={compteRappels?.nombre ?? null}
            compteurPartiel={compteRappels?.partiel === true}
            compteurAlerte={rappelsAffiches.some((relance) => relance.tache.echeance < aujourdhui)}
            erreur={erreurDe(relances)}
            vide={videRappels(
              relances?.ok === true && relances.donnees.total > 0 ? filtreRappels : 'tous',
            )}
            filtre={
              relances?.ok === true && relances.donnees.total > 0 ? (
                <Onglets
                  libelle="Qui rappeler"
                  options={FILTRES_RAPPELS}
                  valeur={filtreRappels}
                  onChange={choisirFiltreRappels}
                />
              ) : undefined
            }
            pied={
              relances?.ok && (
                <VoirTout
                  affiches={relances.donnees.lignes.length}
                  total={relances.donnees.total}
                  vers="/taches?vue=en_retard"
                  libelle="Voir les tâches en retard"
                />
              )
            }
          >
            {relances?.ok && (
              <ul className="-mx-4 divide-y divide-bord">
                {relancesMontrees.map((relance) => (
                  <LigneRelance
                    key={relance.id}
                    relance={relance}
                    aujourdhui={aujourdhui}
                    occupee={gestes.occupee === relance.id}
                    survol={survol}
                    depliee={relance.id === relanceDepliee}
                    onBasculer={() =>
                      setRelanceTouchee(basculerRelance(relanceDepliee, relance.id))
                    }
                    onConsigner={() => gestes.cocher(relance)}
                    onReporter={() => gestes.reporter(relance)}
                    onReporterA={(echeance) => gestes.reporterA(relance, echeance)}
                    onOuvrir={() => gestes.ouvrir(relance)}
                  />
                ))}
              </ul>
            )}
            {/* Le bouton reste en place une fois la liste dépliée : le clavier ne se perd pas. */}
            {(relancesRepliees > 0 ||
              (toutesRelances && rappelsAffiches.length > RELANCES_D_EMBLEE)) && (
              <button
                type="button"
                aria-expanded={toutesRelances}
                onClick={() => setToutesRelances((toutes) => !toutes)}
                className={`${CLASSES_LIEN} mt-1`}
              >
                {toutesRelances
                  ? `N’afficher que les ${RELANCES_D_EMBLEE} premières`
                  : `Afficher ${relancesRepliees === 1 ? 'l’autre' : `les ${relancesRepliees} autres`}`}
              </button>
            )}
          </BlocJournee>

          <BlocJournee
            {...proprietesBloc('taches')}
            titre="Autres tâches"
            icone="taches"
            compteur={compteurTaches}
            compteurAlerte={autresTaches.some((affichee) => affichee.tache.echeance < aujourdhui)}
            erreur={erreurDe(taches)}
            vide={videTaches}
            pied={
              compteurTaches !== null && (
                <VoirTout
                  affiches={autresTaches.length}
                  total={compteurTaches}
                  vers="/taches?vue=en_retard"
                  libelle="Voir les tâches en retard"
                />
              )
            }
          >
            {taches?.ok && (
              <div className="flex flex-col gap-2">
                {groupesTaches.map((groupe) => (
                  <section key={groupe.cle} aria-label={groupe.titre}>
                    <h3
                      className={`text-sm font-semibold ${groupe.cle === 'en_retard' ? 'text-danger' : 'text-encre-douce'}`}
                    >
                      {groupe.titre} ({groupe.lignes.length})
                    </h3>
                    <ul className="-mx-4 divide-y divide-bord">
                      {groupe.lignes.map((affichee) => (
                        <LigneTache
                          key={affichee.id}
                          affichee={affichee}
                          aujourdhui={aujourdhui}
                          occupee={gestes.occupee === affichee.id}
                          onCocher={() => gestes.cocher(affichee)}
                          onReporter={() => gestes.reporter(affichee)}
                          onOuvrir={() => gestes.ouvrir(affichee)}
                          onRouvrir={() => gestes.rouvrir(affichee)}
                          onReporterA={(echeance) => gestes.reporterA(affichee, echeance)}
                          echeanceADroite={echeanceADroite(affichee.tache, aujourdhui)}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </BlocJournee>

          <BlocJournee
            {...proprietesBloc('alertes')}
            titre="Alertes"
            icone="alerte"
            compteur={totalAlertes}
            compteurAlerte
            erreur={erreurDe(alertes)}
            vide={{
              titre: 'Aucune alerte.',
              texte:
                'Vos données sont exportées, chaque projet avance et chaque contact a sa prochaine action.',
            }}
          >
            {alertes?.ok && (
              <div className="flex flex-col gap-3">
                {alertes.donnees.map((groupe) => (
                  <section key={groupe.cle} aria-label={groupe.titre}>
                    <h3 className="text-sm font-semibold text-encre-douce">
                      {groupe.titre} ({groupe.total})
                    </h3>
                    <ul
                      className={`divide-y divide-bord ${groupe.cle === 'contact_sans_action' ? '-mx-2' : ''}`}
                    >
                      {groupe.alertes.map((alerte) => (
                        <LigneAlerte
                          key={alerte.cle}
                          alerte={alerte}
                          aujourdhui={aujourdhui}
                          onPlanifier={setAPlanifier}
                        />
                      ))}
                    </ul>
                    {groupe.cle === 'contact_sans_action' &&
                      groupe.total > groupe.alertes.length && (
                        // La suite, dans Contacts, sur l'onglet « Sans prochaine action ».
                        <Link
                          to="/contacts"
                          onClick={() => memoriserFiltres({ ...FILTRES_VIDES, sansAction: true })}
                          className={`${CLASSES_LIEN} mt-1`}
                        >
                          Voir les {groupe.total}
                          <span className="sr-only"> contacts sans prochaine action</span>
                        </Link>
                      )}
                    {groupe.cle === 'projet_sans_activite' && (
                      <VoirTout
                        affiches={groupe.alertes.length}
                        total={groupe.total}
                        vers="/pipelines"
                        libelle="Ouvrir les pipelines"
                      />
                    )}
                  </section>
                ))}
              </div>
            )}
          </BlocJournee>

          <BlocJournee
            {...proprietesBloc('nouveautes')}
            titre="Nouveautés"
            icone="nouveaute"
            compteur={compteur(nouveautes)}
            compteurAlerte={
              nouveautes?.ok === true &&
              nouveautes.donnees.lignes.some(
                (nouveaute) =>
                  maintenant.getTime() - new Date(nouveaute.recueLe).getTime() > 3_600_000,
              )
            }
            erreur={erreurDe(nouveautes)}
            vide={{
              titre: 'Aucune demande en attente.',
              texte: 'Toutes les demandes entrantes sont qualifiées.',
            }}
            pied={
              nouveautes?.ok && (
                <VoirTout
                  affiches={nouveautes.donnees.lignes.length}
                  total={nouveautes.donnees.total}
                  vers="/pipelines"
                  libelle="Ouvrir le pipeline acquéreur"
                />
              )
            }
          >
            {nouveautes?.ok && (
              <ul className="divide-y divide-bord">
                {nouveautes.donnees.lignes.map((nouveaute) => (
                  <LigneNouveaute
                    key={nouveaute.projet.id}
                    nouveaute={nouveaute}
                    maintenant={maintenant}
                  />
                ))}
              </ul>
            )}
          </BlocJournee>
        </div>
      )}

      {gestes.fenetres}

      {aPlanifier !== null && (
        <FormulaireTache
          aujourdhui={aujourdhui}
          depart={{ titre: titreRelance(aPlanifier), contact: aPlanifier }}
          onFermer={() => setAPlanifier(null)}
          onChangement={relire}
        />
      )}
    </Page>
  )
}
