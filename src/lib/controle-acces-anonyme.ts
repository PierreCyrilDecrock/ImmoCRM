import type { SupabaseClient } from '@supabase/supabase-js'
import { traduireErreurDonnees } from './erreurs-donnees'

/**
 * Contrôle de sécurité : interroge chaque table SANS session, comme le ferait un inconnu
 * qui ne possède que la clé publique du site. Aucune ligne ne doit lui être renvoyée.
 * Le contrôle complet, côté base, est décrit dans docs/donnees.md.
 */

export type VerdictAcces = 'protegee' | 'exposee' | 'indetermine'

export type ControleTable = { table: string; verdict: VerdictAcces }

export type BilanAccesAnonyme = {
  /** `true` seulement si toutes les tables ont pu être contrôlées et sont protégées. */
  protege: boolean
  /** Phrase à afficher telle quelle. */
  message: string
  tables: ControleTable[]
}

async function controlerTable(client: SupabaseClient, table: string): Promise<VerdictAcces> {
  try {
    const { data, error, status } = await client.from(table).select('id').limit(1)
    if (error !== null) {
      const { genre } = traduireErreurDonnees({ ...error, status })
      // Un refus pur et simple est la meilleure réponse possible.
      return genre === 'droits' || genre === 'session' ? 'protegee' : 'indetermine'
    }
    return Array.isArray(data) && data.length === 0 ? 'protegee' : 'exposee'
  } catch {
    return 'indetermine'
  }
}

/** Résume les contrôles en une phrase claire. */
export function bilanAccesAnonyme(tables: ControleTable[]): BilanAccesAnonyme {
  const exposees = tables.filter((controle) => controle.verdict === 'exposee')
  const indeterminees = tables.filter((controle) => controle.verdict === 'indetermine')
  if (exposees.length > 0) {
    const noms = exposees.map((controle) => controle.table).join(', ')
    return {
      protege: false,
      tables,
      message: `Alerte : sans connexion, des lignes sont visibles dans : ${noms}. N'enregistrez plus rien et corrigez les règles d'accès.`,
    }
  }
  if (indeterminees.length > 0 || tables.length === 0) {
    return {
      protege: false,
      tables,
      message: "Le contrôle n'a pas pu aboutir. Vérifiez votre connexion, puis réessayez.",
    }
  }
  const pluriel = tables.length > 1
  return {
    protege: true,
    tables,
    message: `Sans connexion, aucune ligne n'est visible (${tables.length} table${pluriel ? 's' : ''} contrôlée${pluriel ? 's' : ''}).`,
  }
}

/**
 * Lance le contrôle sur les tables indiquées. `clientAnonyme` doit être un client sans
 * session (voir `creerClientAnonyme` dans supabase.ts).
 */
export async function controlerAccesAnonyme(
  clientAnonyme: SupabaseClient,
  tables: readonly string[],
): Promise<BilanAccesAnonyme> {
  const controles: ControleTable[] = []
  for (const table of tables) {
    controles.push({ table, verdict: await controlerTable(clientAnonyme, table) })
  }
  return bilanAccesAnonyme(controles)
}
