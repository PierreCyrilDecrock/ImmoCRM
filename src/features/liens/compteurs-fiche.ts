import type { SupabaseClient } from '@supabase/supabase-js'
import { compter, type Resultat } from '../../lib/donnees'
import { filtreLien, type LienFiche } from './fiches-liees'

/**
 * Les compteurs des onglets des fiches Bien et Projet (étape D.7), comme ceux de la fiche
 * Contact : des comptages sans lecture de ligne, lancés ensemble ; la fiche ne charge pas
 * pour autant le contenu des onglets qu'on n'ouvre pas. `null` : le comptage a échoué.
 */
export type CompteursFiche = {
  /** Activités au journal liées à la fiche (notes comprises). */
  activites: number | null
  /** Tâches à faire liées à la fiche. */
  taches: number | null
}

export type CompteursBien = CompteursFiche & {
  /** Projets de vente du bien, propositions à des acquéreurs et demandes reçues sur lui. */
  projets: number | null
}

function nombre(resultat: Resultat<number>): number | null {
  return resultat.ok ? resultat.donnees : null
}

/** La somme, ou `null` si l'un des comptages a échoué (un total faux tromperait). */
export function sommeOuNull(nombres: readonly (number | null)[]): number | null {
  return nombres.some((n) => n === null)
    ? null
    : nombres.reduce<number>((somme, n) => somme + (n ?? 0), 0)
}

export async function lireCompteursFiche(
  client: SupabaseClient,
  lien: LienFiche,
): Promise<CompteursFiche> {
  const filtre = filtreLien(lien)
  const [activites, taches] = await Promise.all([
    compter(client, 'activites', { filtres: [filtre] }),
    compter(client, 'taches', {
      filtres: [filtre, { colonne: 'etat', genre: 'egal', valeur: 'a_faire' }],
    }),
  ])
  return { activites: nombre(activites), taches: nombre(taches) }
}

export async function lireCompteursBien(
  client: SupabaseClient,
  bienId: string,
): Promise<CompteursBien> {
  const [communs, vendeurs, proposes, demandes] = await Promise.all([
    lireCompteursFiche(client, { bienId }),
    compter(client, 'projets_vendeurs', {
      filtres: [{ colonne: 'bien_id', genre: 'egal', valeur: bienId }],
    }),
    compter(client, 'biens_proposes', {
      filtres: [{ colonne: 'bien_id', genre: 'egal', valeur: bienId }],
    }),
    compter(client, 'projets_acquereurs', {
      filtres: [{ colonne: 'bien_origine_id', genre: 'egal', valeur: bienId }],
    }),
  ])
  return {
    ...communs,
    projets: sommeOuNull([nombre(vendeurs), nombre(proposes), nombre(demandes)]),
  }
}
