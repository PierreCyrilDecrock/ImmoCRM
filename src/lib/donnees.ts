import type { SupabaseClient } from '@supabase/supabase-js'
import { erreurDonnees, traduireErreurDonnees, type ErreurDonnees } from './erreurs-donnees'
import type { Database } from './types-base'

/**
 * Couche d'accès aux données, commune à tous les domaines (contacts, biens, tâches…).
 *
 * Chaque fonction renvoie un `Resultat` : soit les données, soit une erreur dont le message
 * est déjà en français. Aucune ne lève d'erreur. Les conventions des tables sont décrites
 * dans docs/donnees.md.
 */

type TablesBase = Database['public']['Tables']

/** Nom d'une table de la base. */
export type NomTable = keyof TablesBase

/** Une ligne d'une table, telle qu'elle est lue. */
export type Ligne<T extends NomTable> = TablesBase[T]['Row']

/** Colonnes remplies par la base : l'application ne les envoie jamais. */
type ColonnesGerees = 'id' | 'user_id' | 'created_at' | 'updated_at' | 'archived_at'

/** Valeurs à fournir pour créer une ligne. */
export type Creation<T extends NomTable> = Omit<TablesBase[T]['Insert'], ColonnesGerees>

/** Valeurs modifiables d'une ligne (toutes facultatives). */
export type Modification<T extends NomTable> = Omit<TablesBase[T]['Update'], ColonnesGerees>

/** Tables qui possèdent la colonne `archived_at`, donc que l'on peut archiver. */
export type TableArchivable = {
  [T in NomTable]: 'archived_at' extends keyof Ligne<T> ? T : never
}[NomTable]

/**
 * Toutes les tables de la base. À compléter à chaque migration qui crée une table
 * (TypeScript signale un oubli). `archivable` : la table a une colonne `archived_at`.
 */
export const TABLES: Record<NomTable, { archivable: boolean }> = {
  contacts: { archivable: true },
  reglages: { archivable: false },
}

/** Résultat d'un accès aux données : les données, ou une erreur expliquée en français. */
export type Resultat<D> = { ok: true; donnees: D } | { ok: false; erreur: ErreurDonnees }

export type OptionsListe<T extends NomTable> = {
  /** `sans` (par défaut) : lignes actives ; `avec` : toutes ; `seulement` : les archivées. */
  archives?: 'sans' | 'avec' | 'seulement'
  /** Colonne de tri. Par défaut : les plus récentes d'abord. */
  tri?: { colonne: keyof Ligne<T> & string; croissant?: boolean }
  /** Nombre maximal de lignes. */
  limite?: number
}

type Reponse = {
  data: unknown
  error: { code?: string; message?: string } | null
  status?: number
}

/** Attend une requête et range sa réponse dans un `Resultat`, sans jamais lever d'erreur. */
async function executer<D>(requete: PromiseLike<Reponse>, ligneAttendue: boolean) {
  let reponse: Reponse
  try {
    reponse = await requete
  } catch {
    return { ok: false, erreur: erreurDonnees('reseau') } satisfies Resultat<D>
  }
  if (reponse.error !== null) {
    const erreur = traduireErreurDonnees({ ...reponse.error, status: reponse.status })
    return { ok: false, erreur } satisfies Resultat<D>
  }
  // Aucune ligne renvoyée : l'identifiant n'existe pas, ou appartient à un autre compte.
  if (ligneAttendue && reponse.data === null) {
    return { ok: false, erreur: erreurDonnees('introuvable') } satisfies Resultat<D>
  }
  // La forme des données est garantie par les types générés depuis le schéma.
  return { ok: true, donnees: reponse.data as D } satisfies Resultat<D>
}

/** Lit les lignes d'une table. Les lignes archivées sont écartées, sauf demande contraire. */
export function lister<T extends NomTable>(
  client: SupabaseClient,
  table: T,
  options: OptionsListe<T> = {},
): Promise<Resultat<Ligne<T>[]>> {
  const { archives = 'sans', tri, limite } = options
  let requete = client.from(table).select('*')
  if (TABLES[table].archivable) {
    if (archives === 'sans') requete = requete.is('archived_at', null)
    if (archives === 'seulement') requete = requete.not('archived_at', 'is', null)
  }
  requete = requete.order(tri?.colonne ?? 'created_at', { ascending: tri?.croissant ?? false })
  if (limite !== undefined) requete = requete.limit(limite)
  return executer<Ligne<T>[]>(requete, false)
}

/** Lit une ligne par son identifiant (archivée ou non). */
export function lire<T extends NomTable>(
  client: SupabaseClient,
  table: T,
  id: string,
): Promise<Resultat<Ligne<T>>> {
  return executer<Ligne<T>>(client.from(table).select('*').eq('id', id).maybeSingle(), true)
}

/** Crée une ligne et la renvoie complète (identifiant et dates compris). */
export function creer<T extends NomTable>(
  client: SupabaseClient,
  table: T,
  valeurs: Creation<T>,
): Promise<Resultat<Ligne<T>>> {
  return executer<Ligne<T>>(client.from(table).insert(valeurs).select().single(), true)
}

/** Modifie une ligne et la renvoie à jour. */
export function modifier<T extends NomTable>(
  client: SupabaseClient,
  table: T,
  id: string,
  valeurs: Modification<T>,
): Promise<Resultat<Ligne<T>>> {
  return executer<Ligne<T>>(
    client.from(table).update(valeurs).eq('id', id).select().maybeSingle(),
    true,
  )
}

/**
 * Crée la ligne, ou la modifie si elle existe déjà pour la colonne unique indiquée.
 * Sert aux tables qui n'ont qu'une ligne par utilisateur (`reglages`, colonne `user_id`).
 */
export function enregistrerUnique<T extends NomTable>(
  client: SupabaseClient,
  table: T,
  valeurs: Creation<T>,
  colonneUnique: keyof Ligne<T> & string,
): Promise<Resultat<Ligne<T>>> {
  return executer<Ligne<T>>(
    client.from(table).upsert(valeurs, { onConflict: colonneUnique }).select().single(),
    true,
  )
}

function daterArchivage<T extends TableArchivable>(
  client: SupabaseClient,
  table: T,
  id: string,
  date: string | null,
): Promise<Resultat<Ligne<T>>> {
  return executer<Ligne<T>>(
    client.from(table).update({ archived_at: date }).eq('id', id).select().maybeSingle(),
    true,
  )
}

/** Archive une ligne : elle disparaît des listes mais reste dans la base (suppression logique). */
export function archiver<T extends TableArchivable>(
  client: SupabaseClient,
  table: T,
  id: string,
): Promise<Resultat<Ligne<T>>> {
  return daterArchivage(client, table, id, new Date().toISOString())
}

/** Annule un archivage : la ligne revient dans les listes. */
export function restaurer<T extends TableArchivable>(
  client: SupabaseClient,
  table: T,
  id: string,
): Promise<Resultat<Ligne<T>>> {
  return daterArchivage(client, table, id, null)
}
