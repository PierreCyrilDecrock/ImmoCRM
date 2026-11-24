import type { SupabaseClient } from '@supabase/supabase-js'
import { instantDeParis } from '../../lib/dates'
import {
  appeler,
  compter,
  listerPage,
  type Filtre,
  type PageLignes,
  type Resultat,
} from '../../lib/donnees'
import type { Activite } from '../activites/activites'
import type { ProjetAcquereur } from '../acquereurs/pipeline-acquereur'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import { ordreSansAction, SANS_ACTION_A_L_ACCUEIL } from '../contacts/jamais-contactes'
import { lireReglagesEtSauvegardes, type DatesSauvegarde } from '../reglages/reglages'
import { exportARappeler, joursDepuisExport } from '../sauvegarde/rappel-export'
import { fichesDe, lireFiches, type AvecLiens, type FichesLues } from '../liens/fiches-liees'
import type { Tache, TacheAffichee } from '../taches/taches'
import {
  assembler,
  conditionsAgenda,
  conditionsRelances,
  conditionsTaches,
  JOURS_SANS_ACTIVITE,
  LIMITES,
  type ContenuBloc,
} from './journee'

/**
 * Lecture de l'écran Aujourd'hui. Toutes les requêtes sont bornées (voir `LIMITES`) et
 * partent ensemble, en deux vagues : d'abord les lignes de chaque bloc, puis, en une fois,
 * les fiches liées (contacts, biens) et la dernière activité des contacts à relancer.
 * Un bloc qui n'a pas pu être lu affiche son erreur sans empêcher les autres.
 */

/**
 * Une relance : la tâche, ses fiches et la dernière activité du contact (`null` : aucune
 * activité au journal ; `undefined` : la lecture a échoué, on n'en dit rien).
 */
export type Relance = TacheAffichee & { derniere: Activite | null | undefined }

/** Un projet en cours sans activité récente (vendeur ou acquéreur). */
export type ProjetCalme = {
  genre: 'vendeur' | 'acquereur'
  projetId: string
  etape: string
  /** Jour de la dernière activité, ou de l'entrée dans l'étape si elle est plus récente. */
  calmeDepuis: string
  contact: Contact | null
  bien: Bien | null
}

/**
 * Une alerte. Chaque genre a son affichage. La version 2 ajoutera les échéances de mandat
 * et les conditions suspensives des transactions.
 */
export type Alerte =
  | {
      genre: 'export_a_faire'
      cle: string
      /** Jours depuis le dernier export, ou `null` s'il n'y en a jamais eu. */
      jours: number | null
    }
  | {
      genre: 'contact_sans_action'
      cle: string
      contact: Contact
      /** Aucune activité au journal ; `undefined` : la lecture a échoué, on n'en dit rien. */
      jamaisContacte: boolean | undefined
    }
  | { genre: 'projet_sans_activite'; cle: string; projet: ProjetCalme }

/** Un groupe d'alertes du même genre, avec son nombre total. */
export type GroupeAlertes = {
  cle: Alerte['genre']
  titre: string
  alertes: Alerte[]
  total: number
}

/** Une demande entrante non qualifiée (projet acquéreur à l'étape « Demande »). */
export type Nouveaute = {
  projet: ProjetAcquereur
  /** Moment de réception (ou, à défaut, de saisie) de la demande. */
  recueLe: string
  contact: Contact | null
  bien: Bien | null
}

export type Journee = {
  agenda: Resultat<ContenuBloc<TacheAffichee>>
  relances: Resultat<ContenuBloc<Relance>>
  taches: Resultat<ContenuBloc<TacheAffichee>>
  alertes: Resultat<GroupeAlertes[]>
  nouveautes: Resultat<ContenuBloc<Nouveaute>>
  /** Le nom affiché (Réglages), vide s'il n'est pas indiqué ou n'a pas pu être lu. */
  nomAffiche: string
  /** Le nombre de tâches faites aujourd'hui, pour l'anneau de progression. */
  faitesDuJour: Resultat<number>
}

/** Ordre des tâches : par jour, puis par heure, priorité et ancienneté. */
const TRI_TACHES = [
  { colonne: 'echeance' },
  { colonne: 'heure' },
  { colonne: 'priorite' },
  { colonne: 'created_at' },
  { colonne: 'id' },
] as const

function lireTaches(client: SupabaseClient, filtres: Filtre<'taches'>[], taille: number) {
  return listerPage(client, 'taches', {
    filtres,
    tri: TRI_TACHES,
    debut: 0,
    taille,
    compter: true,
  })
}

type LigneProjetCalme = {
  genre: string
  projet_id: string
  contact_id: string
  bien_id: string | null
  etape: string
  calme_depuis: string
  total: number
}

/** Réunit deux parties lues (en retard, d'aujourd'hui) en un bloc, si les deux ont réussi. */
function reunir<L>(
  parties: readonly Resultat<PageLignes<L>>[],
  limite: number,
): Resultat<ContenuBloc<L>> {
  const lues: PageLignes<L>[] = []
  for (const partie of parties) {
    if (!partie.ok) return partie
    lues.push(partie.donnees)
  }
  return { ok: true, donnees: assembler(lues, limite) }
}

function afficher(tache: Tache, fiches: FichesLues): TacheAffichee {
  return { id: tache.id, tache, ...fichesDe(tache, fiches) }
}

/** Lit tout l'écran Aujourd'hui. Ne lève jamais d'erreur : chaque bloc porte la sienne. */
export async function lireJournee(client: SupabaseClient, aujourdhui: string): Promise<Journee> {
  // Première vague : les lignes de chaque bloc, toutes en même temps.
  const [
    agenda,
    relancesEnRetard,
    relancesDuJour,
    tachesEnRetard,
    tachesDuJour,
    sansAction,
    calmes,
    demandes,
    reglages,
    faitesDuJour,
  ] = await Promise.all([
    lireTaches(client, conditionsAgenda(aujourdhui), LIMITES.agenda),
    lireTaches(client, conditionsRelances('en_retard', aujourdhui), LIMITES.relances),
    lireTaches(client, conditionsRelances('du_jour', aujourdhui), LIMITES.relances),
    lireTaches(client, conditionsTaches('en_retard', aujourdhui), LIMITES.taches),
    lireTaches(client, conditionsTaches('du_jour', aujourdhui), LIMITES.taches),
    listerPage(client, 'contacts', {
      filtres: [
        { colonne: 'prochaine_action_le', genre: 'vide' },
        { colonne: 'sans_prochaine_action_le', genre: 'vide' },
      ],
      tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
      debut: 0,
      taille: LIMITES.contactsSansAction,
      compter: true,
    }),
    appeler(client, 'projets_sans_activite', {
      p_aujourdhui: aujourdhui,
      p_jours: JOURS_SANS_ACTIVITE,
      p_limite: LIMITES.projetsSansActivite,
    }),
    listerPage(client, 'projets_acquereurs', {
      filtres: [
        { colonne: 'etat', genre: 'egal', valeur: 'actif' },
        { colonne: 'etape', genre: 'egal', valeur: 'demande' },
      ],
      tri: [{ colonne: 'recue_le' }, { colonne: 'created_at' }, { colonne: 'id' }],
      debut: 0,
      taille: LIMITES.nouveautes,
      compter: true,
    }),
    lireReglagesEtSauvegardes(client),
    // Un simple comptage, sans lire de ligne : les tâches faites depuis minuit (Paris).
    compter(client, 'taches', {
      filtres: [
        { colonne: 'etat', genre: 'egal', valeur: 'faite' },
        { colonne: 'cloturee_le', genre: 'min', valeur: instantDeParis(aujourdhui, '00:00') },
      ],
    }),
  ])
  const sauvegardes = reglages.ok ? reglages.donnees.sauvegardes : null
  const nomAffiche = reglages.ok ? reglages.donnees.reglages.nom_affiche : ''

  const blocAgenda = reunir([agenda], LIMITES.agenda)
  const blocRelances = reunir([relancesEnRetard, relancesDuJour], LIMITES.relances)
  const blocTaches = reunir([tachesEnRetard, tachesDuJour], LIMITES.taches)
  const lignesCalmes: LigneProjetCalme[] = calmes.ok ? calmes.donnees : []

  // Seconde vague : les fiches liées à toutes ces lignes, et la dernière activité des
  // contacts à relancer et des contacts sans prochaine action.
  const liees: AvecLiens[] = [
    ...(blocAgenda.ok ? blocAgenda.donnees.lignes : []),
    ...(blocRelances.ok ? blocRelances.donnees.lignes : []),
    ...(blocTaches.ok ? blocTaches.donnees.lignes : []),
    ...lignesCalmes,
    ...(demandes.ok
      ? demandes.donnees.lignes.map((p) => ({
          contact_id: p.contact_id,
          bien_id: p.bien_origine_id,
        }))
      : []),
  ]
  const contactsARelancer = [
    ...new Set([
      ...(blocRelances.ok
        ? blocRelances.donnees.lignes.flatMap((t) => (t.contact_id === null ? [] : [t.contact_id]))
        : []),
      ...(sansAction.ok ? sansAction.donnees.lignes.map((contact) => contact.id) : []),
    ]),
  ]
  const [fiches, dernieres] = await Promise.all([
    lireFiches(client, liees),
    contactsARelancer.length > 0
      ? appeler(client, 'dernieres_activites', { p_contacts: contactsARelancer })
      : Promise.resolve({ ok: true, donnees: [] } as Resultat<Activite[]>),
  ])
  if (!fiches.ok) {
    return {
      agenda: fiches,
      relances: fiches,
      taches: fiches,
      alertes: fiches,
      nouveautes: fiches,
      nomAffiche,
      faitesDuJour,
    }
  }
  const lues = fiches.donnees
  const derniereDe = new Map(
    (dernieres.ok ? dernieres.donnees : []).flatMap((a) =>
      a.contact_id === null ? [] : [[a.contact_id, a] as const],
    ),
  )

  return {
    agenda: avecFiches(blocAgenda, (tache) => afficher(tache, lues)),
    relances: avecFiches(blocRelances, (tache) => ({
      ...afficher(tache, lues),
      derniere:
        tache.contact_id === null || !dernieres.ok
          ? undefined
          : (derniereDe.get(tache.contact_id) ?? null),
    })),
    taches: avecFiches(blocTaches, (tache) => afficher(tache, lues)),
    alertes: construireAlertes(
      sansAction,
      dernieres.ok ? (id) => !derniereDe.has(id) : () => undefined,
      calmes.ok ? { ok: true, donnees: lignesCalmes } : calmes,
      lues,
      // Si les réglages n'ont pas pu être lus, le rappel est simplement omis.
      sauvegardes,
      aujourdhui,
    ),
    nouveautes: demandes.ok
      ? {
          ok: true,
          donnees: {
            total: demandes.donnees.total ?? demandes.donnees.lignes.length,
            lignes: demandes.donnees.lignes.map((projet) => ({
              projet,
              recueLe: projet.recue_le ?? projet.created_at,
              ...fichesDe({ contact_id: projet.contact_id, bien_id: projet.bien_origine_id }, lues),
            })),
          },
        }
      : demandes,
    nomAffiche,
    faitesDuJour,
  }
}

function avecFiches<L>(
  bloc: Resultat<ContenuBloc<Tache>>,
  transformer: (tache: Tache) => L,
): Resultat<ContenuBloc<L>> {
  if (!bloc.ok) return bloc
  return {
    ok: true,
    donnees: { total: bloc.donnees.total, lignes: bloc.donnees.lignes.map(transformer) },
  }
}

/**
 * Les groupes d'alertes, dans l'ordre d'importance : la sauvegarde des données (le fichier
 * clients est l'actif principal), les projets en cours qui s'endorment, puis les contacts
 * sans prochaine action. Un groupe vide n'apparaît pas.
 */
function construireAlertes(
  sansAction: Resultat<PageLignes<Contact>>,
  jamaisContacte: (id: string) => boolean | undefined,
  calmes: Resultat<LigneProjetCalme[]>,
  fiches: FichesLues,
  sauvegardes: DatesSauvegarde | null,
  aujourdhui: string,
): Resultat<GroupeAlertes[]> {
  if (!sansAction.ok) return sansAction
  if (!calmes.ok) return calmes
  const rappelExport =
    sauvegardes !== null && exportARappeler(sauvegardes.dernier_export_le, aujourdhui)
  const groupes: GroupeAlertes[] = [
    {
      cle: 'export_a_faire',
      titre: 'Sauvegarde de vos données',
      total: rappelExport ? 1 : 0,
      alertes: rappelExport
        ? [
            {
              genre: 'export_a_faire',
              cle: 'export',
              jours: joursDepuisExport(sauvegardes.dernier_export_le, aujourdhui),
            },
          ]
        : [],
    },
    {
      cle: 'projet_sans_activite',
      titre: `Projets sans activité depuis ${JOURS_SANS_ACTIVITE} jours`,
      total: calmes.donnees[0]?.total ?? 0,
      alertes: calmes.donnees.map((ligne) => ({
        genre: 'projet_sans_activite',
        cle: `projet-${ligne.projet_id}`,
        projet: {
          genre: ligne.genre === 'acquereur' ? 'acquereur' : 'vendeur',
          projetId: ligne.projet_id,
          etape: ligne.etape,
          calmeDepuis: ligne.calme_depuis,
          ...fichesDe(ligne, fiches),
        },
      })),
    },
    {
      cle: 'contact_sans_action',
      titre: 'Contacts sans prochaine action',
      total: sansAction.donnees.total ?? sansAction.donnees.lignes.length,
      // Vendeurs et acquéreurs d'abord, les plus chauds en tête ; trois d'emblée.
      alertes: ordreSansAction(sansAction.donnees.lignes)
        .slice(0, SANS_ACTION_A_L_ACCUEIL)
        .map((contact) => ({
          genre: 'contact_sans_action',
          cle: `contact-${contact.id}`,
          contact,
          jamaisContacte: jamaisContacte(contact.id),
        })),
    },
  ]
  return { ok: true, donnees: groupes.filter((groupe) => groupe.total > 0) }
}
