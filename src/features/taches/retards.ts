import type { SupabaseClient } from '@supabase/supabase-js'
import { compter, type Resultat } from '../../lib/donnees'
import { conditionsVue } from './taches'

/**
 * Pastille des retards : le nombre de tâches en retard, porté par l'entrée Tâches de la
 * navigation. Une seule requête de comptage, sans lire aucune tâche ; elle se refait après
 * chaque enregistrement (tâche cochée, reportée…) et au retour dans l'application
 * (`suivi-retards.ts`).
 */

/** Au-delà, la pastille affiche « 9+ ». */
export const MAX_PASTILLE = 9

/** Ce que montre la pastille et ce qu'entendent les lecteurs d'écran ; `null` : pas de pastille. */
export function pastilleRetards(nombre: number | null): { texte: string; annonce: string } | null {
  if (nombre === null || nombre <= 0) return null
  return {
    texte: nombre > MAX_PASTILLE ? `${MAX_PASTILLE}+` : String(nombre),
    annonce: `${nombre} en retard`,
  }
}

/** Compte les tâches à faire dont l'échéance est passée (même règle que la vue « En retard »). */
export function compterTachesEnRetard(
  client: SupabaseClient,
  aujourdhui: string,
): Promise<Resultat<number>> {
  return compter(client, 'taches', { filtres: conditionsVue('en_retard', aujourdhui) })
}
