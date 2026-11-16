import type { SupabaseClient } from '@supabase/supabase-js'

/** Réponse simulée de Supabase, ou `'panne'` pour simuler une requête qui échoue net. */
export type ReponseSimulee =
  { data: unknown; error: { code?: string; message?: string } | null; status?: number } | 'panne'

/**
 * Faux client Supabase pour les tests : il note chaque appel (`['from', 'reglages']`,
 * `['eq', 'id', '…']`…) et répond toujours la même chose, sans rien envoyer sur le réseau.
 */
export function fauxClient(reponse: ReponseSimulee) {
  const appels: unknown[][] = []
  const chaine: object = new Proxy(
    {},
    {
      get(_cible, nom) {
        if (nom === 'then') {
          return (suite: (valeur: unknown) => unknown, echec?: (raison: unknown) => unknown) =>
            reponse === 'panne'
              ? Promise.reject(new TypeError('Failed to fetch')).then(suite, echec)
              : Promise.resolve(reponse).then(suite, echec)
        }
        return (...arguments_: unknown[]) => {
          appels.push([String(nom), ...arguments_])
          return chaine
        }
      },
    },
  )
  return { client: chaine as SupabaseClient, appels }
}
