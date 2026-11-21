import type { SupabaseClient } from '@supabase/supabase-js'
import { pendantEcriture, type Resultat } from './donnees'
import { erreurDonnees, traduireErreurDonnees } from './erreurs-donnees'

/**
 * Accès aux fichiers (stockage de Supabase), dans le même esprit que `donnees.ts` : chaque
 * fonction renvoie un `Resultat` et ne lève jamais d'erreur. Les espaces sont privés : un
 * fichier ne s'affiche que par une adresse signée, valable un temps limité.
 */

type ErreurStockage = { message?: string; status?: number; statusCode?: string } | null

function echec(erreur: NonNullable<ErreurStockage>): { ok: false } & Resultat<never> {
  // Selon les versions, le code HTTP arrive dans `status` (nombre) ou `statusCode` (texte).
  const status = erreur.status ?? (Number(erreur.statusCode) || undefined)
  return { ok: false, erreur: traduireErreurDonnees({ message: erreur.message, status }) }
}

async function executer<D>(
  requete: () => PromiseLike<{ data: unknown; error: ErreurStockage }>,
  lire: (data: unknown) => D,
): Promise<Resultat<D>> {
  try {
    const { data, error } = await requete()
    if (error !== null) return echec(error)
    return { ok: true, donnees: lire(data) }
  } catch {
    return { ok: false, erreur: erreurDonnees('reseau') }
  }
}

/** Envoie un fichier. Refusé si un fichier existe déjà à cet emplacement. */
export function envoyerFichier(
  client: SupabaseClient,
  espace: string,
  chemin: string,
  fichier: Blob,
): Promise<Resultat<null>> {
  return pendantEcriture(() =>
    executer(
      () =>
        client.storage.from(espace).upload(chemin, fichier, {
          contentType: fichier.type,
          // Un fichier envoyé ne change jamais : le navigateur peut le garder longtemps.
          cacheControl: '31536000',
          upsert: false,
        }),
      () => null,
    ),
  )
}

/** Supprime des fichiers. Un fichier déjà absent n'est pas une erreur. */
export function supprimerFichiers(
  client: SupabaseClient,
  espace: string,
  chemins: readonly string[],
): Promise<Resultat<null>> {
  return pendantEcriture(() =>
    executer(
      () => client.storage.from(espace).remove([...chemins]),
      () => null,
    ),
  )
}

/**
 * Demande une adresse signée par fichier, valable `dureeSecondes`. Renvoie les adresses
 * rangées par chemin ; un fichier introuvable est simplement absent du résultat.
 */
export async function signerAdresses(
  client: SupabaseClient,
  espace: string,
  chemins: readonly string[],
  dureeSecondes: number,
): Promise<Resultat<Map<string, string>>> {
  if (chemins.length === 0) return { ok: true, donnees: new Map() }
  return executer(
    () => client.storage.from(espace).createSignedUrls([...chemins], dureeSecondes),
    (data) => {
      const adresses = new Map<string, string>()
      const lignes = Array.isArray(data)
        ? (data as { path?: string | null; signedUrl?: string | null; error?: string | null }[])
        : []
      for (const ligne of lignes) {
        if (typeof ligne.path === 'string' && typeof ligne.signedUrl === 'string' && !ligne.error) {
          adresses.set(ligne.path, ligne.signedUrl)
        }
      }
      return adresses
    },
  )
}
