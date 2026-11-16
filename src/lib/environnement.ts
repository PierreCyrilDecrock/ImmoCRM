/**
 * Sur quel projet Supabase l'application est branchée.
 * `test` : données fictives, on peut tout essayer. `reel` : les vraies fiches.
 */
export type Environnement = 'test' | 'reel'

/**
 * Identifiant du projet Supabase de test (« Immo CRM - test »). Ce n'est pas un secret :
 * il figure dans l'adresse du projet, visible dans le site.
 */
export const IDENTIFIANT_PROJET_TEST = 'kgodrynbcaacteolgorr'

/**
 * Déduit l'environnement de l'adresse du projet Supabase. Par prudence, tout projet qui
 * n'est pas exactement le projet de test est traité comme le projet réel.
 */
export function environnementDepuisUrl(url: string): Environnement {
  try {
    const hote = new URL(url).hostname.toLowerCase()
    return hote === `${IDENTIFIANT_PROJET_TEST}.supabase.co` ? 'test' : 'reel'
  } catch {
    return 'reel'
  }
}
