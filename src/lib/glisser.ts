/**
 * Calculs du glisser d'une ligne de liste (composant `LigneGlissable`) : de quel côté part
 * le doigt, jusqu'où suit la ligne, et si elle reste ouverte au relâcher. Les longueurs sont
 * en pixels ; un décalage est négatif (la ligne part vers la gauche) ou nul.
 */

/** Mouvement en dessous duquel on ne sait pas encore si le doigt glisse ou fait défiler. */
export const ZONE_MORTE_PX = 10

/** Part de la largeur des actions à découvrir pour que la ligne reste ouverte. */
export const PART_SEUIL_OUVERTURE = 0.6

/** Largeur d'une action découverte. */
export const LARGEUR_ACTION_PX = 80

/**
 * Le sens du geste une fois sorti de la zone morte : horizontal (la ligne suit) ou vertical
 * (on laisse la liste défiler) ; `null` tant que le doigt n'a presque pas bougé (un toucher).
 */
export function sensDuGeste(dx: number, dy: number): 'horizontal' | 'vertical' | null {
  if (Math.abs(dx) < ZONE_MORTE_PX && Math.abs(dy) < ZONE_MORTE_PX) return null
  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
}

/**
 * Le décalage de la ligne pendant le geste : elle suit le doigt vers la gauche, jamais vers la
 * droite au-delà de sa place, et freine (un quart du mouvement) au-delà de ses actions.
 */
export function decalageGlisse(depart: number, dx: number, largeurActions: number): number {
  const brut = depart + dx
  if (brut >= 0) return 0
  if (brut < -largeurActions) return -largeurActions + (brut + largeurActions) / 4
  return brut
}

/** Au relâcher : la ligne reste ouverte si assez d'actions sont découvertes, sinon se remet. */
export function resteOuverte(decalage: number, largeurActions: number): boolean {
  return -decalage >= largeurActions * PART_SEUIL_OUVERTURE
}
