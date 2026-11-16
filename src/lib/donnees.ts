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
  appels_sans_accord: { archivable: true },
  biens: { archivable: true },
  biens_photos: { archivable: false },
  biens_prix: { archivable: true },
  biens_proprietaires: { archivable: true },
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

/** Condition appliquée par la base lors d'une lecture par page. */
export type Filtre<T extends NomTable> = { colonne: keyof Ligne<T> & string } & (
  | { genre: 'egal'; valeur: string }
  /** Le texte de la colonne contient ce texte (sans caractère joker). */
  | { genre: 'contient'; valeur: string }
  /** La colonne, un tableau, comprend toutes ces valeurs. */
  | { genre: 'comprend'; valeur: string[] }
  /** La colonne vaut l'une de ces valeurs (liste d'identifiants, par exemple). */
  | { genre: 'parmi'; valeur: string[] }
  /** La colonne, un nombre, vaut au moins / au plus cette valeur. */
  | { genre: 'min'; valeur: number }
  | { genre: 'max'; valeur: number }
)

export type OptionsPage<T extends NomTable> = {
  archives?: 'sans' | 'avec' | 'seulement'
  /** Conditions à remplir toutes à la fois. */
  filtres?: readonly Filtre<T>[]
  /** Colonnes de tri, dans l'ordre. La dernière doit départager toutes les lignes (`id`). */
  tri: readonly { colonne: keyof Ligne<T> & string; croissant?: boolean }[]
  /** Rang de la première ligne voulue (0 pour le début). */
  debut: number
  /** Nombre de lignes voulues. */
  taille: number
  /** Demande aussi le nombre total de lignes qui remplissent les conditions. */
  compter?: boolean
}

/** Une page de lignes ; `total` n'est connu que s'il a été demandé. */
export type PageLignes<L> = { lignes: L[]; total: number | null }

type FonctionsBase = Database['public']['Functions']

/** Nom d'une fonction de la base, appelable par l'application. */
export type NomFonction = keyof FonctionsBase

type Reponse = {
  data: unknown
  error: { code?: string; message?: string } | null
  status?: number
  count?: number | null
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

/**
 * Lit une page de lignes, filtrées et triées par la base : jamais toute la table.
 * À utiliser pour toute liste qui peut grossir (contacts, biens…).
 */
export async function listerPage<T extends NomTable>(
  client: SupabaseClient,
  table: T,
  options: OptionsPage<T>,
): Promise<Resultat<PageLignes<Ligne<T>>>> {
  const { archives = 'sans', filtres = [], tri, debut, taille, compter = false } = options
  let requete = compter
    ? client.from(table).select('*', { count: 'exact' })
    : client.from(table).select('*')
  if (TABLES[table].archivable) {
    if (archives === 'sans') requete = requete.is('archived_at', null)
    if (archives === 'seulement') requete = requete.not('archived_at', 'is', null)
  }
  for (const filtre of filtres) {
    // Le nom de colonne est déjà vérifié par le type `Filtre`.
    const colonne: string = filtre.colonne
    if (filtre.genre === 'egal') requete = requete.eq(colonne, filtre.valeur)
    if (filtre.genre === 'contient') requete = requete.like(colonne, `%${filtre.valeur}%`)
    if (filtre.genre === 'parmi') requete = requete.in(colonne, filtre.valeur)
    if (filtre.genre === 'min') requete = requete.gte(colonne, filtre.valeur)
    if (filtre.genre === 'max') requete = requete.lte(colonne, filtre.valeur)
    if (filtre.genre === 'comprend') {
      // Entre guillemets : une valeur peut contenir une espace ou une virgule (étiquette libre).
      const valeurs = filtre.valeur.map((valeur) => `"${valeur.replace(/(["\\])/g, '\\$1')}"`)
      requete = requete.contains(colonne, valeurs)
    }
  }
  for (const { colonne, croissant = true } of tri) {
    requete = requete.order(colonne, { ascending: croissant })
  }
  const requetePage: PromiseLike<Reponse> = requete.range(debut, debut + taille - 1)

  let total: number | null = null
  const resultat = await executer<Ligne<T>[]>(
    requetePage.then((reponse) => {
      total = reponse.count ?? null
      return reponse
    }),
    false,
  )
  if (!resultat.ok) return resultat
  return { ok: true, donnees: { lignes: resultat.donnees, total } }
}

/**
 * Appelle une fonction de la base (recherche de doublons, fusion…). Elle s'exécute avec
 * les droits du compte connecté : les règles d'accès par ligne s'appliquent.
 */
export function appeler<F extends NomFonction>(
  client: SupabaseClient,
  fonction: F,
  parametres?: FonctionsBase[F]['Args'],
): Promise<Resultat<FonctionsBase[F]['Returns']>> {
  return executer<FonctionsBase[F]['Returns']>(client.rpc(fonction, parametres ?? {}), false)
}

/**
 * Tables dont une ligne peut être supprimée pour de bon. Exception à la règle « rien ne se
 * supprime » : une photo libère ainsi la place qu'elle occupe (voir docs/donnees.md).
 */
export type TableSupprimable = 'biens_photos'

/** Supprime définitivement une ligne. Réservé aux tables de `TableSupprimable`. */
export function supprimer<T extends TableSupprimable>(
  client: SupabaseClient,
  table: T,
  id: string,
): Promise<Resultat<{ id: string }>> {
  return executer<{ id: string }>(
    client.from(table).delete().eq('id', id).select('id').maybeSingle(),
    true,
  )
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
