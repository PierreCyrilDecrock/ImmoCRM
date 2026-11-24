import type { SupabaseClient } from '@supabase/supabase-js'
import {
  enregistrerUnique,
  listerPage,
  type Creation,
  type Ligne,
  type Resultat,
} from '../../lib/donnees'

/**
 * Les trois actions qui comptent : choisies librement chaque matin, en tête de l'écran
 * Aujourd'hui, et cochées au fil de la journée. Une ligne par jour dans la base, pour les
 * retrouver sur tous les appareils (table `priorites_du_jour`).
 */

export type Priorite = { texte: string; faite: boolean }

/** Toujours trois actions, dans l'ordre choisi ; une action vide n'est pas encore choisie. */
export type Priorites = readonly [Priorite, Priorite, Priorite]

export const LONGUEUR_MAX_PRIORITE = 200

/**
 * Les exemples affichés dans les champs vides, un par rang : ils montrent le genre d'action
 * attendu (jamais « Action 2 »).
 */
export const EXEMPLES_PRIORITES = [
  'Ex. : rappeler le notaire',
  'Ex. : envoyer l’avis de valeur',
  'Ex. : préparer la visite de 14 h',
] as const

/** Le nom de chaque action pour les lecteurs d'écran. */
export const NOMS_PRIORITES = ['Première action', 'Deuxième action', 'Troisième action'] as const

const VIDE: Priorite = { texte: '', faite: false }

export const PRIORITES_VIDES: Priorites = [VIDE, VIDE, VIDE]

type LignePriorites = Ligne<'priorites_du_jour'>

/** Les trois actions d'une ligne de la base ; trois actions vides s'il n'y en a pas. */
export function prioritesDepuis(
  ligne: Pick<
    LignePriorites,
    'action_1' | 'action_2' | 'action_3' | 'faite_1' | 'faite_2' | 'faite_3'
  > | null,
): Priorites {
  if (ligne === null) return PRIORITES_VIDES
  return [
    { texte: ligne.action_1, faite: ligne.faite_1 },
    { texte: ligne.action_2, faite: ligne.faite_2 },
    { texte: ligne.action_3, faite: ligne.faite_3 },
  ]
}

/** Nettoie une action : espaces retirés, longueur bornée ; vide, elle ne peut être faite. */
function nettoyer(priorite: Priorite): Priorite {
  const texte = priorite.texte.trim().slice(0, LONGUEUR_MAX_PRIORITE)
  return { texte, faite: texte !== '' && priorite.faite }
}

/** Les valeurs à enregistrer pour ce jour. */
export function valeursPriorites(
  jour: string,
  priorites: Priorites,
): Creation<'priorites_du_jour'> {
  const [a, b, c] = priorites.map(nettoyer) as [Priorite, Priorite, Priorite]
  return {
    jour,
    action_1: a.texte,
    action_2: b.texte,
    action_3: c.texte,
    faite_1: a.faite,
    faite_2: b.faite,
    faite_3: c.faite,
  }
}

/** Remplace une des trois actions, sans toucher aux autres. */
export function changerPriorite(
  priorites: Priorites,
  rang: 0 | 1 | 2,
  changement: Partial<Priorite>,
): Priorites {
  const copie = [...priorites] as [Priorite, Priorite, Priorite]
  copie[rang] = { ...copie[rang], ...changement }
  return copie
}

/** « 2 sur 3 faites » : où en est la journée (seules les actions choisies comptent). */
export function bilanPriorites(priorites: Priorites): { choisies: number; faites: number } {
  const choisies = priorites.filter((priorite) => priorite.texte.trim() !== '')
  return { choisies: choisies.length, faites: choisies.filter((p) => p.faite).length }
}

/**
 * Les trois actions du jour, et si l'outil a déjà servi : une ligne existe (ce jour-ci ou un
 * jour précédent) dès qu'une action a été écrite une fois.
 */
export type PrioritesLues = { priorites: Priorites; dejaUtilisees: boolean }

/**
 * Lit les trois actions du jour, en une lecture : la ligne la plus récente jusqu'à ce jour.
 * Si elle est d'un jour précédent, les actions du jour sont encore vides, mais l'outil a déjà
 * servi (`dejaUtilisees`).
 */
export async function lirePriorites(
  client: SupabaseClient,
  jour: string,
): Promise<Resultat<PrioritesLues>> {
  const page = await listerPage(client, 'priorites_du_jour', {
    filtres: [{ colonne: 'jour', genre: 'max', valeur: jour }],
    tri: [{ colonne: 'jour', croissant: false }, { colonne: 'id' }],
    debut: 0,
    taille: 1,
  })
  if (!page.ok) return page
  const ligne = page.donnees.lignes[0] ?? null
  return {
    ok: true,
    donnees: {
      priorites: prioritesDepuis(ligne !== null && ligne.jour === jour ? ligne : null),
      dejaUtilisees: ligne !== null,
    },
  }
}

/** La forme du bloc : une seule ligne à déplier, ou les trois champs. */
export type FormeTroisActions = 'ligne' | 'complete'

/**
 * Tant qu'aucune action n'a jamais été écrite, le bloc tient en une ligne « Choisir mes
 * trois actions du jour », qui déplie les champs (étape F.2, proposition 3). Dès qu'une
 * action est écrite, il garde ses trois champs, y compris les jours suivants. Pendant la
 * lecture, `dejaUtilisees` est ce dont l'appareil se souvient (`utiliseesMemorisees`) : le
 * bloc prend d'emblée sa forme habituelle. En cas d'erreur, les champs, avec le message.
 */
export function formeTroisActions(etat: {
  erreur: boolean
  choisies: number
  dejaUtilisees: boolean
  deplie: boolean
}): FormeTroisActions {
  return etat.erreur || etat.deplie || etat.choisies > 0 || etat.dejaUtilisees
    ? 'complete'
    : 'ligne'
}

const CLE_UTILISEES = 'immocrm.aujourdhui.trois-actions-utilisees'

/** L'appareil se souvient que les trois actions ont déjà servi (forme du bloc à la lecture). */
export function utiliseesMemorisees(): boolean {
  try {
    return window.localStorage.getItem(CLE_UTILISEES) === 'oui'
  } catch {
    return false
  }
}

export function memoriserUtilisees(): void {
  try {
    window.localStorage.setItem(CLE_UTILISEES, 'oui')
  } catch {
    // Mémoire de l'appareil indisponible (navigation privée) : on s'en passe.
  }
}

/** Enregistre les trois actions du jour (la ligne est créée au premier enregistrement). */
export async function enregistrerPriorites(
  client: SupabaseClient,
  jour: string,
  priorites: Priorites,
): Promise<Resultat<Priorites>> {
  const resultat = await enregistrerUnique(
    client,
    'priorites_du_jour',
    valeursPriorites(jour, priorites),
    ['user_id', 'jour'],
  )
  if (!resultat.ok) return resultat
  return { ok: true, donnees: prioritesDepuis(resultat.donnees) }
}
