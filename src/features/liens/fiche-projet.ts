import type { GenreProjet } from './lien-projet'

/**
 * Fiches Projet de vente et Projet d'achat (étape D.7) : leurs onglets, sur le modèle de la
 * fiche Contact. La deuxième place revient, comme sur les fiches Contact et Bien, à ce qui
 * est lié au projet : les biens proposés d'un projet d'achat.
 */

export type OngletProjet = 'activite' | 'biens' | 'taches' | 'details'

export const LIBELLES_ONGLETS_PROJET: Record<OngletProjet, string> = {
  activite: 'Activité',
  biens: 'Biens proposés',
  taches: 'Tâches',
  details: 'Détails',
}

/** Les mêmes onglets sur tous les écrans ; « Biens proposés » pour un projet d'achat. */
export function ongletsProjet(genre: GenreProjet): readonly OngletProjet[] {
  return genre === 'acquereur'
    ? ['activite', 'biens', 'taches', 'details']
    : ['activite', 'taches', 'details']
}
