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

/** Lit les trois actions du jour. */
export async function lirePriorites(
  client: SupabaseClient,
  jour: string,
): Promise<Resultat<Priorites>> {
  const page = await listerPage(client, 'priorites_du_jour', {
    filtres: [{ colonne: 'jour', genre: 'egal', valeur: jour }],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: 1,
  })
  if (!page.ok) return page
  return { ok: true, donnees: prioritesDepuis(page.donnees.lignes[0] ?? null) }
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
