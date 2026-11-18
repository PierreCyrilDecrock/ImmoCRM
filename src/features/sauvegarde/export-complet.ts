import type { SupabaseClient } from '@supabase/supabase-js'
import { listerPage, TABLES, type Ligne, type NomTable, type Resultat } from '../../lib/donnees'
import type { Environnement } from '../../lib/environnement'

/**
 * Export complet : toutes les lignes de toutes les tables du compte (fiches archivées
 * comprises), dans un seul fichier JSON. Le JSON est un format texte standard, lisible par
 * la plupart des logiciels (tableur par import, outils de base de données) et par
 * l'application elle-même plus tard.
 *
 * Les lectures passent par la couche d'accès commune, avec la session de l'utilisateur :
 * les règles d'accès par ligne s'appliquent, rien ne sort qui ne soit à lui.
 */

/** Identifie le fichier, pour qu'un outil sache le reconnaître. */
export const FORMAT_EXPORT = 'immocrm-export-complet'

/** Version de la structure du fichier : à augmenter si elle change. */
export const VERSION_FORMAT_EXPORT = 1

/** Lignes lues par requête : la base n'en renvoie pas davantage d'un coup. */
export const TAILLE_LOT_EXPORT = 1000

/** Ce que le fichier ne contient pas, dit dans le fichier lui-même. */
export const REMARQUES_EXPORT: readonly string[] = [
  'Toutes les lignes de chaque table, fiches archivées comprises.',
  "Les photos des biens ne sont pas dans ce fichier : seules leurs références (table biens_photos) y figurent. Les fichiers d'image restent dans le stockage de Supabase.",
  "Les dates sont en temps universel (UTC) au format ISO 8601, sauf les jours sans heure (AAAA-MM-JJ) et les heures (HH:MM), à l'heure de Paris.",
]

export type TableExportee = { nombre: number; lignes: unknown[] }

export type ExportComplet = {
  format: typeof FORMAT_EXPORT
  version_format: number
  application: { nom: 'ImmoCRM'; version: string }
  projet: Environnement | null
  exporte_le: string
  remarques: readonly string[]
  tables: Record<string, TableExportee>
}

/** Une page de lignes, lue à partir du rang `debut`. */
export type LirePage = (debut: number, taille: number) => Promise<Resultat<unknown[]>>

/**
 * Lit toutes les lignes, page après page, jusqu'à une page incomplète. Le tri par
 * identifiant rend le découpage stable d'une page à l'autre.
 */
export async function lireToutesLesPages(
  lirePage: LirePage,
  taille: number = TAILLE_LOT_EXPORT,
  surPage?: (lues: number) => void,
): Promise<Resultat<unknown[]>> {
  const lignes: unknown[] = []
  for (;;) {
    const page = await lirePage(lignes.length, taille)
    if (!page.ok) return page
    lignes.push(...page.donnees)
    surPage?.(lignes.length)
    if (page.donnees.length < taille) return { ok: true, donnees: lignes }
  }
}

/**
 * Nom de chaque table, pour suivre l'avancement à l'écran. À compléter à chaque nouvelle
 * table (TypeScript signale un oubli) : elle entre alors d'elle-même dans l'export.
 */
export const LIBELLES_TABLES: Record<NomTable, string> = {
  activites: 'journal',
  appels_sans_accord: 'appels sans accord',
  biens: 'biens',
  biens_photos: 'photos (références)',
  biens_prix: 'historique des prix',
  biens_proposes: 'biens proposés',
  biens_proprietaires: 'propriétaires',
  contacts: 'contacts',
  priorites_du_jour: 'trois actions du jour',
  projets_acquereurs: "projets d'achat",
  projets_vendeurs: 'projets de vente',
  reglages: 'réglages',
  taches: 'tâches',
}

/** Les tables exportées, dans l'ordre alphabétique : toutes celles que connaît l'application. */
export function tablesExportees(): NomTable[] {
  return (Object.keys(TABLES) as NomTable[]).sort()
}

/** Avancement de l'export : la table en cours et le nombre de lignes déjà lues. */
export type Avancement = { table: NomTable; rang: number; total: number; lignes: number }

/** Lit une table entière, archives comprises. */
function lireTable(
  client: SupabaseClient,
  table: NomTable,
  surPage: (lues: number) => void,
): Promise<Resultat<unknown[]>> {
  return lireToutesLesPages(
    async (debut, taille) => {
      const page = await listerPage(client, table, {
        archives: 'avec',
        // Toutes les tables ont une colonne `id` (voir docs/donnees.md).
        tri: [{ colonne: 'id' as keyof Ligne<NomTable> & string }],
        debut,
        taille,
      })
      return page.ok ? { ok: true, donnees: page.donnees.lignes } : page
    },
    TAILLE_LOT_EXPORT,
    surPage,
  )
}

/**
 * Lit toutes les tables du compte, l'une après l'autre. Au premier échec, l'export
 * s'arrête : un fichier incomplet donnerait une fausse impression de sécurité.
 */
export async function lireToutesLesDonnees(
  client: SupabaseClient,
  surAvancement?: (avancement: Avancement) => void,
): Promise<Resultat<Record<string, unknown[]>>> {
  const tables = tablesExportees()
  const donnees: Record<string, unknown[]> = {}
  for (const [rang, table] of tables.entries()) {
    surAvancement?.({ table, rang: rang + 1, total: tables.length, lignes: 0 })
    const lues = await lireTable(client, table, (lignes) =>
      surAvancement?.({ table, rang: rang + 1, total: tables.length, lignes }),
    )
    if (!lues.ok) return lues
    donnees[table] = lues.donnees
  }
  return { ok: true, donnees }
}

/** Met les données lues dans la forme du fichier. */
export function assemblerExport(
  donnees: Record<string, unknown[]>,
  contexte: { maintenant: Date; version: string; projet: Environnement | null },
): ExportComplet {
  const tables: Record<string, TableExportee> = {}
  for (const nom of Object.keys(donnees).sort()) {
    const lignes = donnees[nom] ?? []
    tables[nom] = { nombre: lignes.length, lignes }
  }
  return {
    format: FORMAT_EXPORT,
    version_format: VERSION_FORMAT_EXPORT,
    application: { nom: 'ImmoCRM', version: contexte.version },
    projet: contexte.projet,
    exporte_le: contexte.maintenant.toISOString(),
    remarques: REMARQUES_EXPORT,
    tables,
  }
}

/** Nombre total de lignes du fichier. */
export function nombreDeLignes(exportComplet: ExportComplet): number {
  return Object.values(exportComplet.tables).reduce((somme, table) => somme + table.nombre, 0)
}

/**
 * Nom du fichier : `immocrm-export-2026-11-18.json` ; sur le projet de test,
 * `immocrm-test-export-2026-11-18.json`, pour ne jamais confondre les deux.
 */
export function nomFichierExport(jour: string, projet: Environnement | null): string {
  return `immocrm-${projet === 'test' ? 'test-' : ''}export-${jour}.json`
}
