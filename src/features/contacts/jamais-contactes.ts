import type { SupabaseClient } from '@supabase/supabase-js'
import { appeler, type Resultat } from '../../lib/donnees'

/** Au plus autant de fiches par lecture (limite de la fonction `dernieres_activites`). */
export const MAX_PAR_LECTURE = 200

/**
 * Pour chaque fiche demandée, `true` si elle n'a aucune activité au journal. Une seule
 * lecture, bornée (la dernière activité de chaque fiche, une ligne au plus par fiche).
 */
export async function lireJamaisContactes(
  client: SupabaseClient,
  ids: readonly string[],
): Promise<Resultat<Map<string, boolean>>> {
  const demandes = ids.slice(0, MAX_PAR_LECTURE)
  const resultat = await appeler(client, 'dernieres_activites', { p_contacts: demandes })
  if (!resultat.ok) return resultat
  const avecActivite = new Set(resultat.donnees.map((activite) => activite.contact_id))
  return { ok: true, donnees: new Map(demandes.map((id) => [id, !avecActivite.has(id)])) }
}
