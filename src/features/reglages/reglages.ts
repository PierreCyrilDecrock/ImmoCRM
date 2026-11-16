import type { SupabaseClient } from '@supabase/supabase-js'
import { enregistrerUnique, lister, type Resultat } from '../../lib/donnees'

/** Les réglages modifiables par l'utilisateur. */
export type Reglages = {
  /** Nom du mandataire, tel qu'il apparaît dans l'application. */
  nom_affiche: string
}

/** Valeurs utilisées tant que rien n'a été enregistré. */
export const REGLAGES_PAR_DEFAUT: Reglages = { nom_affiche: '' }

export const LONGUEUR_MAX_NOM_AFFICHE = 80

/** Vérifie le nom saisi. Renvoie un message, ou `null` si tout va bien. */
export function validerNomAffiche(nom: string): string | null {
  if (nom.trim().length > LONGUEUR_MAX_NOM_AFFICHE) {
    return `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_AFFICHE} caractères.`
  }
  return null
}

/** Lit les réglages du compte connecté ; les valeurs par défaut si rien n'est enregistré. */
export async function lireReglages(client: SupabaseClient): Promise<Resultat<Reglages>> {
  const resultat = await lister(client, 'reglages', { limite: 1 })
  if (!resultat.ok) return resultat
  const ligne = resultat.donnees[0]
  return {
    ok: true,
    donnees: ligne === undefined ? REGLAGES_PAR_DEFAUT : { nom_affiche: ligne.nom_affiche },
  }
}

/** Enregistre les réglages du compte connecté (la ligne est créée au premier enregistrement). */
export async function enregistrerReglages(
  client: SupabaseClient,
  reglages: Reglages,
): Promise<Resultat<Reglages>> {
  const valeurs = { nom_affiche: reglages.nom_affiche.trim() }
  const resultat = await enregistrerUnique(client, 'reglages', valeurs, 'user_id')
  if (!resultat.ok) return resultat
  return { ok: true, donnees: { nom_affiche: resultat.donnees.nom_affiche } }
}
