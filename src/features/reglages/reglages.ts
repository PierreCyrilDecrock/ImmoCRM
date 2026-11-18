import type { SupabaseClient } from '@supabase/supabase-js'
import { enregistrerUnique, lister, type Ligne, type Resultat } from '../../lib/donnees'
import { DELAIS_PAR_DEFAUT, delaisLisibles, type DelaisRelance } from '../relances/delais'

/** Les réglages modifiables par l'utilisateur. */
export type Reglages = {
  /** Nom du mandataire, tel qu'il apparaît dans l'application. */
  nom_affiche: string
  /** Délai de relance par défaut de chaque température (« 1s », « 1m »…). */
  delais_relance: DelaisRelance
}

/** Dates des sauvegardes, en lecture seule ici (voir `noterExport`). */
export type DatesSauvegarde = {
  /** Dernier export complet fait depuis Réglages. */
  dernier_export_le: string | null
  /** Dernière sauvegarde automatique chiffrée (inscrite par le workflow GitHub). */
  derniere_sauvegarde_le: string | null
}

/** Valeurs utilisées tant que rien n'a été enregistré. */
export const REGLAGES_PAR_DEFAUT: Reglages = {
  nom_affiche: '',
  delais_relance: DELAIS_PAR_DEFAUT,
}

export const LONGUEUR_MAX_NOM_AFFICHE = 80

/** Vérifie le nom saisi. Renvoie un message, ou `null` si tout va bien. */
export function validerNomAffiche(nom: string): string | null {
  if (nom.trim().length > LONGUEUR_MAX_NOM_AFFICHE) {
    return `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_AFFICHE} caractères.`
  }
  return null
}

/** Les réglages tels que l'application les utilise, depuis la ligne de la base. */
function depuisLigne(ligne: Partial<Ligne<'reglages'>>): Reglages {
  return {
    nom_affiche: ligne.nom_affiche ?? '',
    delais_relance: delaisLisibles({
      chaud: ligne.relance_chaud,
      tiede: ligne.relance_tiede,
      froid: ligne.relance_froid,
      veille: ligne.relance_veille,
    }),
  }
}

/** Lit les dates des sauvegardes du compte connecté ; aucune si rien n'est enregistré. */
export async function lireDatesSauvegarde(
  client: SupabaseClient,
): Promise<Resultat<DatesSauvegarde>> {
  const resultat = await lister(client, 'reglages', { limite: 1 })
  if (!resultat.ok) return resultat
  const ligne = resultat.donnees[0]
  return {
    ok: true,
    donnees: {
      dernier_export_le: ligne?.dernier_export_le ?? null,
      derniere_sauvegarde_le: ligne?.derniere_sauvegarde_le ?? null,
    },
  }
}

/** Inscrit le moment d'un export complet réussi (la ligne est créée au besoin). */
export async function noterExport(
  client: SupabaseClient,
  quand: Date,
): Promise<Resultat<DatesSauvegarde>> {
  const resultat = await enregistrerUnique(
    client,
    'reglages',
    { dernier_export_le: quand.toISOString() },
    'user_id',
  )
  if (!resultat.ok) return resultat
  return {
    ok: true,
    donnees: {
      dernier_export_le: resultat.donnees.dernier_export_le,
      derniere_sauvegarde_le: resultat.donnees.derniere_sauvegarde_le,
    },
  }
}

/** Lit les réglages du compte connecté ; les valeurs par défaut si rien n'est enregistré. */
export async function lireReglages(client: SupabaseClient): Promise<Resultat<Reglages>> {
  const resultat = await lister(client, 'reglages', { limite: 1 })
  if (!resultat.ok) return resultat
  const ligne = resultat.donnees[0]
  return { ok: true, donnees: ligne === undefined ? REGLAGES_PAR_DEFAUT : depuisLigne(ligne) }
}

/**
 * Enregistre les réglages du compte connecté (la ligne est créée au premier
 * enregistrement). Seuls les réglages fournis sont changés.
 */
export async function enregistrerReglages(
  client: SupabaseClient,
  reglages: Partial<Reglages>,
): Promise<Resultat<Reglages>> {
  const { nom_affiche, delais_relance } = reglages
  const valeurs = {
    ...(nom_affiche === undefined ? {} : { nom_affiche: nom_affiche.trim() }),
    ...(delais_relance === undefined
      ? {}
      : {
          relance_chaud: delais_relance.chaud,
          relance_tiede: delais_relance.tiede,
          relance_froid: delais_relance.froid,
          relance_veille: delais_relance.veille,
        }),
  }
  const resultat = await enregistrerUnique(client, 'reglages', valeurs, 'user_id')
  if (!resultat.ok) return resultat
  return { ok: true, donnees: depuisLigne(resultat.donnees) }
}
