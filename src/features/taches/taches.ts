import type { SupabaseClient } from '@supabase/supabase-js'
import type { GenreEtiquette } from '../../components/Etiquette'
import {
  appeler,
  creer,
  listerPage,
  modifier,
  type Creation,
  type Filtre,
  type Ligne,
  type PageLignes,
  type Resultat,
} from '../../lib/donnees'
import { estDateValide, formaterDuree, formaterHeure, heureDeFin } from '../../lib/dates'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import { filtreLien, lireFichesLiees, type LienFiche } from '../liens/fiches-liees'
import { colonnesProjet, lienProjetDe, type LienProjet } from '../liens/lien-projet'
import { bornesVue, type Vue } from './echeances'
import { estRecurrence, occurrenceSuivante, type Recurrence } from './recurrence'

/**
 * Tâches et rendez-vous : toute action à venir, avec une date et un motif. Un rendez-vous
 * est une tâche qui a une heure. Une tâche n'est jamais supprimée : elle est faite ou
 * annulée (voir docs/donnees.md, « Tâches »).
 */

export type Tache = Ligne<'taches'>

/** Une tâche avec les fiches auxquelles elle est liée, pour l'affichage. */
export type TacheAffichee = {
  id: string
  tache: Tache
  contact: Contact | null
  bien: Bien | null
}

export type CategorieTache =
  'relance' | 'rendez_vous' | 'visite' | 'estimation' | 'administratif' | 'prospection' | 'autre'
export type EtatTache = 'a_faire' | 'faite' | 'annulee'

type Option<V extends string> = { valeur: V; libelle: string }

export const CATEGORIES_TACHE: readonly Option<CategorieTache>[] = [
  { valeur: 'relance', libelle: 'Relance' },
  { valeur: 'rendez_vous', libelle: 'Rendez-vous' },
  { valeur: 'visite', libelle: 'Visite' },
  { valeur: 'estimation', libelle: 'Estimation' },
  { valeur: 'administratif', libelle: 'Administratif' },
  { valeur: 'prospection', libelle: 'Prospection' },
  { valeur: 'autre', libelle: 'Autre' },
]

/** Priorités : enregistrées en nombre (1 : haute) pour que la base les trie dans l'ordre. */
export const PRIORITES: readonly (Option<'1' | '2' | '3'> & { genre: GenreEtiquette })[] = [
  { valeur: '1', libelle: 'Haute', genre: 'danger' },
  { valeur: '2', libelle: 'Normale', genre: 'neutre' },
  { valeur: '3', libelle: 'Basse', genre: 'neutre' },
]

export const ETATS_TACHE: readonly (Option<EtatTache> & { genre: GenreEtiquette })[] = [
  { valeur: 'a_faire', libelle: 'À faire', genre: 'info' },
  { valeur: 'faite', libelle: 'Faite', genre: 'succes' },
  { valeur: 'annulee', libelle: 'Annulée', genre: 'neutre' },
]

/** Durées proposées pour un rendez-vous ou un créneau, en minutes. */
export const DUREES: readonly Option<string>[] = [15, 30, 45, 60, 90, 120, 180, 240, 480].map(
  (minutes) => ({ valeur: String(minutes), libelle: formaterDuree(minutes) }),
)

export const LONGUEURS_MAX_TACHE = { titre: 200, motif: 2000, lieu: 300 } as const

export const TAILLE_PAGE_TACHES = 50

function libelleDe<V extends string>(options: readonly Option<V>[], valeur: string): string {
  return options.find((option) => option.valeur === valeur)?.libelle ?? valeur
}

export const libelleCategorie = (categorie: string) => libelleDe(CATEGORIES_TACHE, categorie)
export const libelleEtatTache = (etat: string) => libelleDe(ETATS_TACHE, etat)
export const libellePriorite = (priorite: number) => libelleDe(PRIORITES, String(priorite))
export const genreEtatTache = (etat: string): GenreEtiquette =>
  ETATS_TACHE.find((option) => option.valeur === etat)?.genre ?? 'neutre'

/** « 10 h – 11 h 30 », « 10 h » sans durée, chaîne vide sans heure. */
export function horaireTache(tache: Pick<Tache, 'heure' | 'duree'>): string {
  if (tache.heure === null) return ''
  const debut = formaterHeure(tache.heure)
  if (tache.duree === null) return debut
  const fin = heureDeFin(tache.heure, tache.duree)
  return fin === null
    ? `${debut} (${formaterDuree(tache.duree)})`
    : `${debut} – ${formaterHeure(fin)}`
}

/** Un rendez-vous est une tâche qui a une heure. */
export function estRendezVous(tache: Pick<Tache, 'heure'>): boolean {
  return tache.heure !== null
}

// ---------------------------------------------------------------------------
// Saisie
// ---------------------------------------------------------------------------

/** Le formulaire d'une tâche, tel qu'il est saisi (tout en texte). */
export type BrouillonTache = {
  titre: string
  motif: string
  categorie: CategorieTache
  echeance: string
  /** `HH:MM`, ou vide pour une tâche sans heure. */
  heure: string
  /** Minutes, ou vide. */
  duree: string
  lieu: string
  priorite: '1' | '2' | '3'
  recurrence: Recurrence | ''
  contact: Contact | null
  bien: Bien | null
  /** Projet (de vente ou d'achat) lié, ou `null`. */
  projet: LienProjet | null
}

export type ErreursTache = Partial<Record<'titre' | 'echeance' | 'heure' | 'duree', string>>

export function brouillonTacheVide(
  echeance: string,
  liens: { contact?: Contact | null; bien?: Bien | null; projet?: LienProjet | null } = {},
): BrouillonTache {
  const contact = liens.contact ?? null
  return {
    titre: '',
    motif: '',
    // Depuis la fiche d'un contact, la tâche la plus courante est une relance.
    categorie: contact === null ? 'autre' : 'relance',
    echeance,
    heure: '',
    duree: '',
    lieu: '',
    priorite: '2',
    recurrence: '',
    contact,
    bien: liens.bien ?? null,
    projet: liens.projet ?? null,
  }
}

function categorieConnue(valeur: string): CategorieTache {
  return CATEGORIES_TACHE.find((option) => option.valeur === valeur)?.valeur ?? 'autre'
}

export function brouillonTacheDepuis({ tache, contact, bien }: TacheAffichee): BrouillonTache {
  const priorite = String(tache.priorite)
  return {
    titre: tache.titre,
    motif: tache.motif,
    categorie: categorieConnue(tache.categorie),
    echeance: tache.echeance,
    heure: tache.heure?.slice(0, 5) ?? '',
    duree: tache.duree === null ? '' : String(tache.duree),
    lieu: tache.lieu,
    priorite: priorite === '1' || priorite === '3' ? priorite : '2',
    recurrence: estRecurrence(tache.recurrence) ? tache.recurrence : '',
    contact,
    bien,
    projet: lienProjetDe(tache),
  }
}

/** Valeurs envoyées à la base pour créer ou modifier une tâche. */
export type ValeursTache = Omit<Creation<'taches'>, 'etat' | 'cloturee_le'>

/**
 * Vérifie la saisie et prépare les valeurs à enregistrer.
 *
 * Récurrence : une nouvelle série part de la date saisie. En modification, la série garde
 * son point de départ tant que ni sa fréquence ni la date ne changent ; changer la date
 * dans le formulaire fait repartir la série de la nouvelle date (le bouton « Reporter »,
 * lui, ne déplace que l'occurrence).
 */
export function preparerTache(
  brouillon: BrouillonTache,
  existante: Tache | null = null,
): { ok: true; valeurs: ValeursTache } | { ok: false; erreurs: ErreursTache } {
  const erreurs: ErreursTache = {}
  const titre = brouillon.titre.trim()
  if (titre === '') erreurs.titre = 'Indiquez ce qu’il faut faire.'
  else if (titre.length > LONGUEURS_MAX_TACHE.titre)
    erreurs.titre = `${LONGUEURS_MAX_TACHE.titre} caractères au plus.`

  if (!estDateValide(brouillon.echeance)) erreurs.echeance = 'Choisissez une date.'

  const heure = brouillon.heure.trim()
  if (heure !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(heure)) {
    erreurs.heure = 'Heure illisible. Exemple : 14:30.'
  }

  const duree = brouillon.duree === '' ? null : Number(brouillon.duree)
  if (duree !== null && (!Number.isInteger(duree) || duree < 1 || duree > 1440)) {
    erreurs.duree = 'Durée non reconnue : choisissez-en une dans la liste.'
  } else if (duree !== null && heure === '') {
    erreurs.duree = 'Une durée demande une heure de début.'
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }

  const recurrence = brouillon.recurrence === '' ? null : brouillon.recurrence
  const garderSerie =
    existante !== null &&
    recurrence !== null &&
    existante.recurrence === recurrence &&
    existante.echeance === brouillon.echeance &&
    existante.recurrence_ancre !== null

  return {
    ok: true,
    valeurs: {
      titre,
      motif: brouillon.motif.trim().slice(0, LONGUEURS_MAX_TACHE.motif),
      categorie: brouillon.categorie,
      echeance: brouillon.echeance,
      heure: heure === '' ? null : heure,
      duree,
      lieu: brouillon.lieu.trim().slice(0, LONGUEURS_MAX_TACHE.lieu),
      priorite: Number(brouillon.priorite),
      recurrence,
      recurrence_ancre:
        recurrence === null ? null : garderSerie ? existante.recurrence_ancre : brouillon.echeance,
      recurrence_rang: garderSerie ? existante.recurrence_rang : 0,
      contact_id: brouillon.contact?.id ?? null,
      bien_id: brouillon.bien?.id ?? null,
      ...colonnesProjet(brouillon.projet),
    },
  }
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

/** Conditions d'une vue de la page Tâches, à passer à la base. */
export function conditionsVue(vue: Vue, aujourdhui: string): Filtre<'taches'>[] {
  if (vue === 'terminees') {
    return [{ colonne: 'etat', genre: 'parmi', valeur: ['faite', 'annulee'] }]
  }
  const { min, max } = bornesVue(vue, aujourdhui)
  const conditions: Filtre<'taches'>[] = [{ colonne: 'etat', genre: 'egal', valeur: 'a_faire' }]
  if (min !== undefined) conditions.push({ colonne: 'echeance', genre: 'min', valeur: min })
  if (max !== undefined) conditions.push({ colonne: 'echeance', genre: 'max', valeur: max })
  return conditions
}

/** Ordre des tâches à faire : par jour, les rendez-vous par heure, puis par priorité. */
const TRI_A_FAIRE = [
  { colonne: 'echeance' },
  { colonne: 'heure' },
  { colonne: 'priorite' },
  { colonne: 'created_at' },
  { colonne: 'id' },
] as const

/** Les tâches closes : les plus récemment closes d'abord. */
const TRI_CLOSES = [{ colonne: 'cloturee_le', croissant: false }, { colonne: 'id' }] as const

/** Ajoute à chaque tâche la fiche du contact et celle du bien liés (deux lectures en tout). */
export async function completerTaches(
  client: SupabaseClient,
  taches: Tache[],
): Promise<Resultat<TacheAffichee[]>> {
  const liees = await lireFichesLiees(client, taches)
  if (!liees.ok) return liees
  return {
    ok: true,
    donnees: liees.donnees.map(({ ligne, contact, bien }) => ({
      id: ligne.id,
      tache: ligne,
      contact,
      bien,
    })),
  }
}

/** Une page d'une vue de la page Tâches, avec les fiches liées. */
export async function lirePageTaches(
  client: SupabaseClient,
  options: { vue: Vue; aujourdhui: string; debut: number; compter: boolean },
): Promise<Resultat<PageLignes<TacheAffichee>>> {
  const page = await listerPage(client, 'taches', {
    filtres: conditionsVue(options.vue, options.aujourdhui),
    tri: options.vue === 'terminees' ? TRI_CLOSES : TRI_A_FAIRE,
    debut: options.debut,
    taille: TAILLE_PAGE_TACHES,
    compter: options.compter,
  })
  if (!page.ok) return page
  const lignes = await completerTaches(client, page.donnees.lignes)
  if (!lignes.ok) return lignes
  return { ok: true, donnees: { lignes: lignes.donnees, total: page.donnees.total } }
}

/** Nombre de tâches à faire dans chaque vue (pour les onglets). `null` : nombre inconnu. */
export async function compterVues(
  client: SupabaseClient,
  aujourdhui: string,
): Promise<Record<Exclude<Vue, 'terminees'>, number | null>> {
  const vues = ['en_retard', 'aujourdhui', 'semaine', 'plus_tard'] as const
  const comptes = await Promise.all(
    vues.map((vue) =>
      listerPage(client, 'taches', {
        filtres: conditionsVue(vue, aujourdhui),
        tri: [{ colonne: 'id' }],
        debut: 0,
        taille: 1,
        compter: true,
      }),
    ),
  )
  const nombre = (rang: number) => {
    const compte = comptes[rang]
    return compte !== undefined && compte.ok ? compte.donnees.total : null
  }
  return { en_retard: nombre(0), aujourdhui: nombre(1), semaine: nombre(2), plus_tard: nombre(3) }
}

/**
 * Les tâches liées à un contact, un bien ou un projet. `etat: 'a_faire'` (par défaut) :
 * celles qui restent à faire, par date ; `'toutes'` : y compris les closes et archivées
 * (export).
 */
export async function listerTachesLiees(
  client: SupabaseClient,
  lien: LienFiche,
  etat: 'a_faire' | 'toutes' = 'a_faire',
): Promise<Resultat<TacheAffichee[]>> {
  const filtres: Filtre<'taches'>[] = [filtreLien(lien)]
  if (etat === 'a_faire') filtres.push({ colonne: 'etat', genre: 'egal', valeur: 'a_faire' })
  const page = await listerPage(client, 'taches', {
    archives: etat === 'toutes' ? 'avec' : 'sans',
    filtres,
    tri: TRI_A_FAIRE,
    debut: 0,
    taille: 200,
  })
  if (!page.ok) return page
  return completerTaches(client, page.donnees.lignes)
}

/** La prochaine tâche à faire d'un contact (la plus proche), ou `null` s'il n'y en a pas. */
export async function lireProchaineTache(
  client: SupabaseClient,
  contactId: string,
): Promise<Resultat<Tache | null>> {
  const page = await listerPage(client, 'taches', {
    filtres: [
      { colonne: 'contact_id', genre: 'egal', valeur: contactId },
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
    ],
    tri: TRI_A_FAIRE,
    debut: 0,
    taille: 1,
  })
  if (!page.ok) return page
  return { ok: true, donnees: page.donnees.lignes[0] ?? null }
}

/**
 * La prochaine tâche à faire liée à une fiche (un bien, un projet), avec son contact et son
 * bien, ou `null` s'il n'y en a pas. Deux lectures au plus.
 */
export async function lireProchaineTacheLiee(
  client: SupabaseClient,
  lien: LienFiche,
): Promise<Resultat<TacheAffichee | null>> {
  const page = await listerPage(client, 'taches', {
    filtres: [filtreLien(lien), { colonne: 'etat', genre: 'egal', valeur: 'a_faire' }],
    tri: TRI_A_FAIRE,
    debut: 0,
    taille: 1,
  })
  if (!page.ok) return page
  const completees = await completerTaches(client, page.donnees.lignes)
  if (!completees.ok) return completees
  return { ok: true, donnees: completees.donnees[0] ?? null }
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------

export function creerTache(
  client: SupabaseClient,
  valeurs: ValeursTache,
): Promise<Resultat<Tache>> {
  return creer(client, 'taches', valeurs)
}

export function modifierTache(
  client: SupabaseClient,
  id: string,
  valeurs: ValeursTache,
): Promise<Resultat<Tache>> {
  return modifier(client, 'taches', id, valeurs)
}

/** Reporte une tâche à une autre date : seule cette occurrence bouge, pas sa série. */
export function reporterTache(
  client: SupabaseClient,
  id: string,
  echeance: string,
): Promise<Resultat<Tache>> {
  return modifier(client, 'taches', id, { echeance })
}

/** Remet une tâche faite ou annulée dans les tâches à faire. */
export function rouvrirTache(client: SupabaseClient, id: string): Promise<Resultat<Tache>> {
  return modifier(client, 'taches', id, { etat: 'a_faire', cloturee_le: null })
}

/**
 * L'occurrence que crée la clôture d'une tâche récurrente (date et rang dans la série) ;
 * `null` pour une tâche unique.
 */
export function suivanteDeSerie(
  tache: Pick<Tache, 'recurrence' | 'recurrence_ancre' | 'recurrence_rang' | 'echeance'>,
  aujourdhui: string,
): { echeance: string; rang: number } | null {
  if (!estRecurrence(tache.recurrence) || tache.recurrence_ancre === null) return null
  return occurrenceSuivante(
    {
      recurrence: tache.recurrence,
      ancre: tache.recurrence_ancre,
      rang: tache.recurrence_rang,
      echeance: tache.echeance,
    },
    aujourdhui,
  )
}

/**
 * Clôture une tâche : faite, ou annulée. Pour une tâche récurrente, l'occurrence suivante
 * est créée dans la même opération, sauf si `arreterSerie` est demandé (annulation de toute
 * la série). Renvoie l'occurrence créée, ou `null`.
 */
export async function cloturerTache(
  client: SupabaseClient,
  tache: Tache,
  options: { etat: 'faite' | 'annulee'; aujourdhui: string; arreterSerie?: boolean },
): Promise<Resultat<Tache | null>> {
  const suivante = options.arreterSerie === true ? null : suivanteDeSerie(tache, options.aujourdhui)
  const resultat = await appeler(client, 'cloturer_tache', {
    p_id: tache.id,
    p_etat: options.etat,
    ...(suivante === null
      ? {}
      : { p_suivante_echeance: suivante.echeance, p_suivante_rang: suivante.rang }),
  })
  if (!resultat.ok) {
    // Refus de la base : la tâche a déjà été close (double appui, autre appareil).
    if (resultat.erreur.genre === 'invalide') {
      return {
        ok: false,
        erreur: {
          genre: 'invalide',
          message:
            'Cette tâche a déjà été close, peut-être depuis un autre appareil. Rechargez la page.',
        },
      }
    }
    return resultat
  }
  return { ok: true, donnees: resultat.donnees[0] ?? null }
}
