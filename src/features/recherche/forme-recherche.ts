/**
 * Où se trouve la recherche des contacts sur téléphone et tablette, selon la page (étape F.3,
 * proposition 10 de la revue n° 2 : une seule recherche par écran).
 *
 * - `bandeau` : la barre « Rechercher un contact » en haut de l'écran, sur l'accueil seulement ;
 * - `aucune` : la liste des contacts, qui a son propre champ, relié à ses filtres ;
 * - `loupe` : partout ailleurs, une loupe ronde à droite du titre de la page (ou de la ligne
 *   de retour d'une fiche) ouvre la même recherche. Biens garde ainsi son seul champ, celui
 *   des adresses.
 *
 * Sur ordinateur, la recherche reste dans la colonne de gauche, sur toutes les pages.
 */
export type FormeRecherche = 'bandeau' | 'loupe' | 'aucune'

export function formeRecherche(chemin: string): FormeRecherche {
  if (chemin === '/' || chemin === '') return 'bandeau'
  if (chemin === '/contacts' || chemin === '/contacts/') return 'aucune'
  return 'loupe'
}
