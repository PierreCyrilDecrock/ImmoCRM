import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EtatChargement from '../components/EtatChargement'
import Page from '../components/Page'
import AnneauProgression from '../features/aujourdhui/AnneauProgression'
import BlocJournee from '../features/aujourdhui/BlocJournee'
import CarteMaintenant from '../features/aujourdhui/CarteMaintenant'
import {
  basculerRepli,
  cartesDeLAppareil,
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
  etatRendezVous,
  finDuDernierRendezVous,
  placeDuTrait,
  progression,
  resumeJournee,
  salutation,
} from '../features/aujourdhui/maintenant'
import TraitMaintenant from '../features/aujourdhui/TraitMaintenant'
import TroisActions from '../features/aujourdhui/TroisActions'
import type { Contact } from '../features/contacts/contacts'
import { FILTRES_VIDES, memoriserFiltres } from '../features/contacts/filtres'
import { titreRelance } from '../features/relances/boucle'
import FormulaireTache from '../features/taches/FormulaireTache'
import { useGestesTache } from '../features/taches/gestes-tache'
import ListeTaches from '../features/taches/ListeTaches'
import { dateDuJour, formaterJourEtSemaine, heureDuMoment, minutesDuJour } from '../lib/dates'
import type { Resultat } from '../lib/donnees'
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
 * date, la salutation, la journée résumée en une phrase et l'anneau de progression ; puis la
 * carte « Maintenant » (le rendez-vous en cours ou le prochain) à côté des trois actions qui
 * comptent ; enfin cinq blocs dans l'ordre où la journée se vit : agenda, relances, tâches,
 * alertes, nouveautés. Chaque bloc a son compteur et se replie. L'écran suit l'heure à la
 * minute (temps restant, trait « maintenant ») sans relire la base.
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

  function basculer(bloc: CleBloc) {
    const suivants = basculerRepli(replies, bloc)
    setReplies(suivants)
    memoriserReplis(suivants)
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
  const resume =
    agenda?.ok && relances?.ok
      ? resumeJournee({
          rendezVous: agenda.donnees.total,
          rappels: relances.donnees.total,
          fin: finDuDernierRendezVous(lignesAgenda.map((affichee) => affichee.tache)),
          minutes,
        })
      : null
  const avancement =
    agenda?.ok && relances?.ok && taches?.ok && journee?.faitesDuJour.ok
      ? progression(
          agenda.donnees.total + relances.donnees.total + taches.donnees.total,
          journee.faitesDuJour.donnees,
        )
      : null
  const placeTrait = placeDuTrait(lignesAgenda, minutes)

  return (
    <Page
      titre={salutation(journee?.nomAffiche ?? '')}
      titreOnglet="Aujourd'hui"
      surtitre={
        <p className="text-base font-medium text-encre-douce">
          {formaterJourEtSemaine(aujourdhui)}
        </p>
      }
    >
      {(resume !== null || avancement !== null) && (
        <div className="-mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          {resume !== null && <p className="text-base text-encre">{resume}</p>}
          {avancement !== null && <AnneauProgression progression={avancement} />}
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
            aPreparer={
              choix.genre === 'rendez_vous'
                ? aPreparer(choix.affichee, [...lignesTaches, ...lignesRelances])
                : []
            }
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
              <ul className="divide-y divide-bord">
                {lignesAgenda.map((affichee, rang) => (
                  <Fragment key={affichee.id}>
                    {rang === placeTrait && <TraitMaintenant heure={heure} />}
                    <LigneRendezVous
                      affichee={affichee}
                      cartes={cartes}
                      occupee={gestes.occupee === affichee.id}
                      onCocher={() => gestes.cocher(affichee)}
                      onOuvrir={() => gestes.ouvrir(affichee)}
                      passe={etatRendezVous(affichee.tache, minutes) === 'passe'}
                    />
                  </Fragment>
                ))}
                {placeTrait === lignesAgenda.length && <TraitMaintenant heure={heure} />}
              </ul>
            )}
          </BlocJournee>

          <BlocJournee
            {...proprietesBloc('relances')}
            titre="À relancer"
            icone="telephone"
            compteur={compteur(relances)}
            compteurAlerte={
              relances?.ok === true &&
              relances.donnees.lignes.some((relance) => relance.tache.echeance < aujourdhui)
            }
            erreur={erreurDe(relances)}
            vide={{
              titre: 'Personne à relancer.',
              texte: 'Toutes vos relances sont à jour.',
            }}
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
              <ul className="divide-y divide-bord">
                {relances.donnees.lignes.map((relance) => (
                  <LigneRelance
                    key={relance.id}
                    relance={relance}
                    aujourdhui={aujourdhui}
                    occupee={gestes.occupee === relance.id}
                    onConsigner={() => gestes.cocher(relance)}
                    onReporter={() => gestes.reporter(relance)}
                    onOuvrir={() => gestes.ouvrir(relance)}
                  />
                ))}
              </ul>
            )}
          </BlocJournee>

          <BlocJournee
            {...proprietesBloc('taches')}
            titre="Tâches"
            icone="taches"
            compteur={compteur(taches)}
            compteurAlerte={
              taches?.ok === true &&
              taches.donnees.lignes.some((affichee) => affichee.tache.echeance < aujourdhui)
            }
            erreur={erreurDe(taches)}
            vide={{
              titre: 'Aucune tâche en attente.',
              texte: 'Rien d’autre à faire aujourd’hui : place au terrain.',
            }}
            pied={
              taches?.ok && (
                <VoirTout
                  affiches={taches.donnees.lignes.length}
                  total={taches.donnees.total}
                  vers="/taches?vue=en_retard"
                  libelle="Voir les tâches en retard"
                />
              )
            }
          >
            {taches?.ok && (
              <div className="-mx-4">
                <ListeTaches
                  taches={taches.donnees.lignes}
                  aujourdhui={aujourdhui}
                  onChangement={relire}
                />
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
                    <ul className="divide-y divide-bord">
                      {groupe.alertes.map((alerte) => (
                        <LigneAlerte
                          key={alerte.cle}
                          alerte={alerte}
                          aujourdhui={aujourdhui}
                          onPlanifier={setAPlanifier}
                        />
                      ))}
                    </ul>
                    {groupe.cle === 'contact_sans_action' && (
                      <VoirTout
                        affiches={groupe.alertes.length}
                        total={groupe.total}
                        vers="/contacts"
                        libelle="Voir la liste"
                        onClick={() => memoriserFiltres({ ...FILTRES_VIDES, sansAction: true })}
                      />
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
