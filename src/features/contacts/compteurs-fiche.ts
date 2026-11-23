import type { SupabaseClient } from '@supabase/supabase-js'
import { compter, type Resultat } from '../../lib/donnees'
import { lireDernierEchange, type Activite } from '../activites/activites'
import { sommeOuNull } from '../liens/compteurs-fiche'

/**
 * Les compteurs des onglets de la fiche Contact et son dernier échange. Des comptages sans
 * lecture de ligne (sauf le dernier échange, une ligne), lancés ensemble : la fiche ne
 * charge pas pour autant le contenu des onglets qu'on n'ouvre pas.
 */
export type CompteursContact = {
  /** Activités au journal (notes comprises). `null` : le comptage a échoué. */
  activites: number | null
  /** Tâches à faire. */
  taches: number | null
  /** Projets de vente et d'achat (comme acquéreur principal ou co-acquéreur). */
  projets: number | null
  /** Le dernier échange (notes écartées), `undefined` s'il n'a pas pu être lu. */
  dernier: Activite | null | undefined
}

function nombre(resultat: Resultat<number>): number | null {
  return resultat.ok ? resultat.donnees : null
}

export async function lireCompteursContact(
  client: SupabaseClient,
  contactId: string,
): Promise<CompteursContact> {
  const duContact = { colonne: 'contact_id', genre: 'egal', valeur: contactId } as const
  const [activites, taches, vendeurs, acquereurs, coAcquereurs, dernier] = await Promise.all([
    compter(client, 'activites', { filtres: [duContact] }),
    compter(client, 'taches', {
      filtres: [duContact, { colonne: 'etat', genre: 'egal', valeur: 'a_faire' }],
    }),
    compter(client, 'projets_vendeurs', { filtres: [duContact] }),
    compter(client, 'projets_acquereurs', { filtres: [duContact] }),
    compter(client, 'projets_acquereurs', {
      filtres: [{ colonne: 'co_acquereur_id', genre: 'egal', valeur: contactId }],
    }),
    lireDernierEchange(client, contactId),
  ])
  return {
    activites: nombre(activites),
    taches: nombre(taches),
    projets: sommeOuNull([nombre(vendeurs), nombre(acquereurs), nombre(coAcquereurs)]),
    dernier: dernier.ok ? dernier.donnees : undefined,
  }
}
