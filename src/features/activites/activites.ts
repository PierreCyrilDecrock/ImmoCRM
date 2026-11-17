import type { SupabaseClient } from '@supabase/supabase-js'
import type { NomIcone } from '../../components/Icone'
import {
  archiver,
  creer,
  listerPage,
  modifier,
  type Creation,
  type Filtre,
  type Ligne,
  type PageLignes,
  type Resultat,
} from '../../lib/donnees'
import { estDateValide, estHeureValide, formaterDuree, formaterHeure } from '../../lib/dates'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import { filtreLien, lireFichesLiees, type LienFiche } from '../liens/fiches-liees'
import { colonnesProjet, lienProjetDe, type LienProjet } from '../liens/lien-projet'
import type { Bornes } from './periodes'

/**
 * Journal d'activité : tout événement passé (appel, message, visite, note, document
 * envoyé…), avec son compte rendu. Une activité est le passé, une tâche le futur : ce sont
 * deux objets distincts (voir docs/donnees.md, « Journal d'activité »).
 */

export type Activite = Ligne<'activites'>

/** Une activité avec les fiches auxquelles elle est liée, pour l'affichage. */
export type ActiviteAffichee = {
  id: string
  activite: Activite
  contact: Contact | null
  bien: Bien | null
}

export type TypeActivite =
  | 'appel'
  | 'sms'
  | 'courriel'
  | 'rendez_vous'
  | 'visite'
  | 'estimation'
  | 'porte_a_porte'
  | 'note'
  | 'document'
  | 'autre'

export type ResultatAppel = 'joint' | 'messagerie' | 'pas_de_reponse' | 'rappeler'

type Option<V extends string> = { valeur: V; libelle: string }

/** Les types d'activité, dans l'ordre où ils sont proposés (les plus fréquents d'abord). */
export const TYPES_ACTIVITE: readonly (Option<TypeActivite> & { icone: NomIcone })[] = [
  { valeur: 'appel', libelle: 'Appel', icone: 'telephone' },
  { valeur: 'sms', libelle: 'SMS', icone: 'sms' },
  { valeur: 'courriel', libelle: 'Courriel', icone: 'courriel' },
  { valeur: 'note', libelle: 'Note', icone: 'note' },
  { valeur: 'rendez_vous', libelle: 'Rendez-vous', icone: 'horloge' },
  { valeur: 'visite', libelle: 'Visite', icone: 'biens' },
  { valeur: 'estimation', libelle: 'Estimation', icone: 'estimation' },
  { valeur: 'porte_a_porte', libelle: 'Porte-à-porte', icone: 'lieu' },
  { valeur: 'document', libelle: 'Document envoyé', icone: 'document' },
  { valeur: 'autre', libelle: 'Autre', icone: 'journal' },
]

/** Résultats d'un appel. */
export const RESULTATS_APPEL: readonly Option<ResultatAppel>[] = [
  { valeur: 'joint', libelle: 'Joint' },
  { valeur: 'messagerie', libelle: 'Messagerie' },
  { valeur: 'pas_de_reponse', libelle: 'Pas de réponse' },
  { valeur: 'rappeler', libelle: 'À rappeler' },
]

/** Durées proposées, en minutes. */
export const DUREES_ACTIVITE: readonly Option<string>[] = [5, 10, 15, 30, 45, 60, 90, 120].map(
  (minutes) => ({ valeur: String(minutes), libelle: formaterDuree(minutes) }),
)

export const LONGUEUR_MAX_COMPTE_RENDU = 5000

// ---------------------------------------------------------------------------
// Compte rendu de visite
// ---------------------------------------------------------------------------

export type InteretVisite = 'fort' | 'moyen' | 'faible' | 'aucun'
export type SuiteVisite = 'offre' | 'contre_visite' | 'reflexion' | 'autres_biens' | 'abandon'

export const INTERETS_VISITE: readonly Option<InteretVisite>[] = [
  { valeur: 'fort', libelle: 'Fort' },
  { valeur: 'moyen', libelle: 'Moyen' },
  { valeur: 'faible', libelle: 'Faible' },
  { valeur: 'aucun', libelle: 'Aucun' },
]

export const SUITES_VISITE: readonly Option<SuiteVisite>[] = [
  { valeur: 'offre', libelle: 'Offre envisagée' },
  { valeur: 'contre_visite', libelle: 'Contre-visite' },
  { valeur: 'reflexion', libelle: 'Réfléchit' },
  { valeur: 'autres_biens', libelle: 'Voir d’autres biens' },
  { valeur: 'abandon', libelle: 'Ne donne pas suite' },
]

export const LONGUEUR_MAX_POINTS_VISITE = 2000

export const libelleInteretVisite = (interet: string | null) =>
  INTERETS_VISITE.find((option) => option.valeur === interet)?.libelle ?? null
export const libelleSuiteVisite = (suite: string | null) =>
  SUITES_VISITE.find((option) => option.valeur === suite)?.libelle ?? null

/** Le compte rendu structuré d'une visite, tel qu'il est saisi. */
export type CompteRenduVisite = {
  pointsPositifs: string
  pointsNegatifs: string
  interet: InteretVisite | ''
  suite: SuiteVisite | ''
}

export const COMPTE_RENDU_VISITE_VIDE: CompteRenduVisite = {
  pointsPositifs: '',
  pointsNegatifs: '',
  interet: '',
  suite: '',
}

/** Colonnes du compte rendu de visite d'une activité. */
export type ColonnesVisite = Pick<
  Activite,
  'visite_points_positifs' | 'visite_points_negatifs' | 'visite_interet' | 'visite_suite'
>

/** Les colonnes à enregistrer : vides pour tout autre type qu'une visite (règle de la base). */
export function colonnesVisite(type: string, saisie: CompteRenduVisite): ColonnesVisite {
  const visite = type === 'visite'
  return {
    visite_points_positifs: visite
      ? saisie.pointsPositifs.trim().slice(0, LONGUEUR_MAX_POINTS_VISITE)
      : '',
    visite_points_negatifs: visite
      ? saisie.pointsNegatifs.trim().slice(0, LONGUEUR_MAX_POINTS_VISITE)
      : '',
    visite_interet: visite && saisie.interet !== '' ? saisie.interet : null,
    visite_suite: visite && saisie.suite !== '' ? saisie.suite : null,
  }
}

export function compteRenduVisiteDepuis(activite: ColonnesVisite): CompteRenduVisite {
  return {
    pointsPositifs: activite.visite_points_positifs,
    pointsNegatifs: activite.visite_points_negatifs,
    interet: INTERETS_VISITE.find((o) => o.valeur === activite.visite_interet)?.valeur ?? '',
    suite: SUITES_VISITE.find((o) => o.valeur === activite.visite_suite)?.valeur ?? '',
  }
}

/** Le compte rendu structuré, ligne par ligne, pour le fil et l'export (vide s'il n'y a rien). */
export function lignesCompteRenduVisite(activite: ColonnesVisite): [string, string][] {
  const lignes: [string, string | null][] = [
    ['Points positifs', activite.visite_points_positifs || null],
    ['Points négatifs', activite.visite_points_negatifs || null],
    ['Intérêt', libelleInteretVisite(activite.visite_interet)],
    ['Suite envisagée', libelleSuiteVisite(activite.visite_suite)],
  ]
  return lignes.filter((ligne): ligne is [string, string] => ligne[1] !== null)
}

export const TAILLE_PAGE_ACTIVITES = 50

export function estTypeActivite(valeur: string): valeur is TypeActivite {
  return TYPES_ACTIVITE.some((option) => option.valeur === valeur)
}

function estResultatAppel(valeur: string | null): valeur is ResultatAppel {
  return RESULTATS_APPEL.some((option) => option.valeur === valeur)
}

export function libelleTypeActivite(type: string): string {
  return TYPES_ACTIVITE.find((option) => option.valeur === type)?.libelle ?? type
}

export function iconeTypeActivite(type: string): NomIcone {
  return TYPES_ACTIVITE.find((option) => option.valeur === type)?.icone ?? 'journal'
}

export function libelleResultatAppel(resultat: string | null): string | null {
  return RESULTATS_APPEL.find((option) => option.valeur === resultat)?.libelle ?? null
}

/** Ce qu'affiche une ligne du fil : « Appel · Messagerie », « Visite ». */
export function titreActivite(activite: Pick<Activite, 'type' | 'resultat'>): string {
  const resultat = activite.type === 'appel' ? libelleResultatAppel(activite.resultat) : null
  const type = libelleTypeActivite(activite.type)
  return resultat === null ? type : `${type} · ${resultat}`
}

/** Ce que demande le champ du compte rendu, selon le type d'activité. */
const INVITES: Partial<Record<TypeActivite, string>> = {
  appel: 'Ce qui a été dit, ce qui est convenu',
  sms: 'Le message envoyé ou reçu, en résumé',
  courriel: 'Objet ou résumé du courriel',
  note: 'Votre note',
  visite: 'Impressions de la visite, objections, suite',
  estimation: 'Valeur avancée, état du bien, projet du vendeur',
  porte_a_porte: 'Rue, numéro, personne rencontrée, intérêt',
  document: 'Quel document, à qui',
}

export function inviteCompteRendu(type: TypeActivite): string {
  return INVITES[type] ?? 'Ce qui s’est passé'
}

/** « 14 h 30 », ou « 14 h 30 · 45 min » avec une durée. */
export function horaireActivite(activite: Pick<Activite, 'heure' | 'duree'>): string {
  const heure = formaterHeure(activite.heure)
  return activite.duree === null ? heure : `${heure} · ${formaterDuree(activite.duree)}`
}

/**
 * Une note est une remarque pour soi, pas un échange avec la personne : elle ne compte pas
 * dans la date du dernier contact (même règle que dans la base).
 */
export function compteCommeContact(type: string): boolean {
  return type !== 'note'
}

/** Regroupe des activités déjà triées (les plus récentes d'abord) par jour. */
export function parJour<A extends { activite: { date_activite: string } }>(
  activites: readonly A[],
): { date: string; activites: A[] }[] {
  const jours: { date: string; activites: A[] }[] = []
  for (const affichee of activites) {
    const dernier = jours.at(-1)
    if (dernier !== undefined && dernier.date === affichee.activite.date_activite) {
      dernier.activites.push(affichee)
    } else {
      jours.push({ date: affichee.activite.date_activite, activites: [affichee] })
    }
  }
  return jours
}

// ---------------------------------------------------------------------------
// Saisie
// ---------------------------------------------------------------------------

/** Le formulaire d'une activité, tel qu'il est saisi (tout en texte). */
export type BrouillonActivite = {
  type: TypeActivite
  resultat: ResultatAppel | ''
  compteRendu: string
  date: string
  /** `HH:MM`. */
  heure: string
  /** Minutes, ou vide. */
  duree: string
  contact: Contact | null
  bien: Bien | null
  /** Projet (de vente ou d'achat) lié, ou `null`. */
  projet: LienProjet | null
  /** Compte rendu structuré, pour une visite. */
  visite: CompteRenduVisite
}

export type ErreursActivite = Partial<Record<'compteRendu' | 'date' | 'heure' | 'duree', string>>

/** Une nouvelle activité, datée de maintenant. */
export function brouillonActiviteVide(
  type: TypeActivite,
  maintenant: { date: string; heure: string },
  liens: { contact?: Contact | null; bien?: Bien | null; projet?: LienProjet | null } = {},
): BrouillonActivite {
  return {
    type,
    resultat: '',
    compteRendu: '',
    date: maintenant.date,
    heure: maintenant.heure,
    duree: '',
    contact: liens.contact ?? null,
    bien: liens.bien ?? null,
    projet: liens.projet ?? null,
    visite: COMPTE_RENDU_VISITE_VIDE,
  }
}

export function brouillonActiviteDepuis({
  activite,
  contact,
  bien,
}: ActiviteAffichee): BrouillonActivite {
  return {
    type: estTypeActivite(activite.type) ? activite.type : 'autre',
    resultat: estResultatAppel(activite.resultat) ? activite.resultat : '',
    compteRendu: activite.compte_rendu,
    date: activite.date_activite,
    heure: activite.heure.slice(0, 5),
    duree: activite.duree === null ? '' : String(activite.duree),
    contact,
    bien,
    projet: lienProjetDe(activite),
    visite: compteRenduVisiteDepuis(activite),
  }
}

/** Valeurs envoyées à la base pour créer ou modifier une activité. */
export type ValeursActivite = Creation<'activites'>

/**
 * Vérifie la saisie et prépare les valeurs à enregistrer. Une activité est passée : sa date
 * ne peut pas dépasser aujourd'hui. Le résultat n'est gardé que pour un appel. Une note
 * sans texte n'a pas de sens ; les autres types peuvent rester sans compte rendu (« SMS
 * envoyé », « messagerie »).
 */
export function preparerActivite(
  brouillon: BrouillonActivite,
  aujourdhui: string,
): { ok: true; valeurs: ValeursActivite } | { ok: false; erreurs: ErreursActivite } {
  const erreurs: ErreursActivite = {}
  const compteRendu = brouillon.compteRendu.trim()
  if (brouillon.type === 'note' && compteRendu === '') {
    erreurs.compteRendu = 'Écrivez ou dictez la note.'
  } else if (compteRendu.length > LONGUEUR_MAX_COMPTE_RENDU) {
    erreurs.compteRendu = `${LONGUEUR_MAX_COMPTE_RENDU} caractères au plus.`
  }

  if (!estDateValide(brouillon.date)) erreurs.date = 'Choisissez une date.'
  else if (brouillon.date > aujourdhui) {
    erreurs.date = 'Le journal note ce qui a eu lieu : pour une action à venir, créez une tâche.'
  }

  const heure = brouillon.heure.trim()
  if (!estHeureValide(heure)) erreurs.heure = 'Heure illisible. Exemple : 14:30.'

  const duree = brouillon.duree === '' ? null : Number(brouillon.duree)
  if (duree !== null && (!Number.isInteger(duree) || duree < 1 || duree > 1440)) {
    erreurs.duree = 'Durée illisible.'
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }

  return {
    ok: true,
    valeurs: {
      type: brouillon.type,
      resultat: brouillon.type === 'appel' && brouillon.resultat !== '' ? brouillon.resultat : null,
      compte_rendu: compteRendu,
      date_activite: brouillon.date,
      heure,
      duree,
      contact_id: brouillon.contact?.id ?? null,
      bien_id: brouillon.bien?.id ?? null,
      ...colonnesProjet(brouillon.projet),
      ...colonnesVisite(brouillon.type, brouillon.visite),
    },
  }
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

/** Ce que l'on cherche dans le journal : une fiche, un type, une période. */
export type CritereJournal = {
  lien?: LienFiche
  /** Vide : tous les types. */
  type?: TypeActivite | ''
  bornes?: Bornes
}

/** Conditions passées à la base pour lire le journal. */
export function conditionsJournal(critere: CritereJournal): Filtre<'activites'>[] {
  const conditions: Filtre<'activites'>[] = []
  const { lien, type, bornes = {} } = critere
  if (lien !== undefined) conditions.push(filtreLien(lien))
  if (type !== undefined && type !== '') {
    conditions.push({ colonne: 'type', genre: 'egal', valeur: type })
  }
  if (bornes.min !== undefined) {
    conditions.push({ colonne: 'date_activite', genre: 'min', valeur: bornes.min })
  }
  if (bornes.max !== undefined) {
    conditions.push({ colonne: 'date_activite', genre: 'max', valeur: bornes.max })
  }
  return conditions
}

/** Du plus récent au plus ancien ; à moment égal, la dernière saisie d'abord. */
const TRI_JOURNAL = [
  { colonne: 'date_activite', croissant: false },
  { colonne: 'heure', croissant: false },
  { colonne: 'created_at', croissant: false },
  { colonne: 'id', croissant: false },
] as const

/** Ajoute à chaque activité la fiche du contact et celle du bien liés. */
export async function completerActivites(
  client: SupabaseClient,
  activites: Activite[],
): Promise<Resultat<ActiviteAffichee[]>> {
  const liees = await lireFichesLiees(client, activites)
  if (!liees.ok) return liees
  return {
    ok: true,
    donnees: liees.donnees.map(({ ligne, contact, bien }) => ({
      id: ligne.id,
      activite: ligne,
      contact,
      bien,
    })),
  }
}

/** Une page du journal (50 activités), du plus récent au plus ancien, avec les fiches liées. */
export async function lirePageActivites(
  client: SupabaseClient,
  options: { critere: CritereJournal; debut: number; compter: boolean },
): Promise<Resultat<PageLignes<ActiviteAffichee>>> {
  const page = await listerPage(client, 'activites', {
    filtres: conditionsJournal(options.critere),
    tri: TRI_JOURNAL,
    debut: options.debut,
    taille: TAILLE_PAGE_ACTIVITES,
    compter: options.compter,
  })
  if (!page.ok) return page
  const lignes = await completerActivites(client, page.donnees.lignes)
  if (!lignes.ok) return lignes
  return { ok: true, donnees: { lignes: lignes.donnees, total: page.donnees.total } }
}

/**
 * Tout le journal d'un contact, y compris les activités retirées (export : la base les
 * conserve, la personne doit pouvoir les connaître). Lu par pages de 500.
 */
export async function listerToutJournalContact(
  client: SupabaseClient,
  contactId: string,
): Promise<Resultat<ActiviteAffichee[]>> {
  const toutes: Activite[] = []
  for (let debut = 0; ; debut += 500) {
    const page = await listerPage(client, 'activites', {
      archives: 'avec',
      filtres: conditionsJournal({ lien: { contactId } }),
      tri: TRI_JOURNAL,
      debut,
      taille: 500,
    })
    if (!page.ok) return page
    toutes.push(...page.donnees.lignes)
    if (page.donnees.lignes.length < 500) break
  }
  return completerActivites(client, toutes)
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------

export function creerActivite(
  client: SupabaseClient,
  valeurs: ValeursActivite,
): Promise<Resultat<Activite>> {
  return creer(client, 'activites', valeurs)
}

export function modifierActivite(
  client: SupabaseClient,
  id: string,
  valeurs: ValeursActivite,
): Promise<Resultat<Activite>> {
  return modifier(client, 'activites', id, valeurs)
}

/**
 * Retire une activité du journal (saisie en double, erreur de fiche). Elle est archivée,
 * pas supprimée : elle ne compte plus dans la date du dernier contact.
 */
export function retirerActivite(client: SupabaseClient, id: string): Promise<Resultat<Activite>> {
  return archiver(client, 'activites', id)
}
