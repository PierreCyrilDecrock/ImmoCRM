/** Chemin sous lequel le site est servi sur GitHub Pages : l'adresse finit par /ImmoCRM/. */
export const CHEMIN_GITHUB_PAGES = '/ImmoCRM/'

/**
 * Met un chemin de base en forme pour Vite : une barre au début et une à la fin.
 * Une valeur absente ou vide renvoie le chemin par défaut.
 * Exemples : « crm » donne « /crm/ », « / » reste « / » (site à la racine d'un nom de domaine).
 */
export function cheminDeBase(valeur: string | undefined, parDefaut: string): string {
  const brut = valeur?.trim() ?? ''
  if (brut === '') return parDefaut
  const milieu = brut.replace(/^\/+|\/+$/g, '')
  return milieu === '' ? '/' : `/${milieu}/`
}
