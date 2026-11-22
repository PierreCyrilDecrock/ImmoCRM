/** Placement d'un menu qui s'ouvre par-dessus la page, près du bouton qui l'ouvre. */

export type Rectangle = { haut: number; bas: number; gauche: number; droite: number }

/** Écart entre le bouton et le menu, et marge gardée au bord de l'écran, en pixels. */
const ECART = 8

/**
 * Où poser le menu : sous le bouton, aligné sur son bord droit ; au-dessus s'il n'y a pas la
 * place dessous (et qu'il y en a plus dessus) ; toujours entièrement dans l'écran.
 */
export function placerMenu(
  bouton: Rectangle,
  menu: { largeur: number; hauteur: number },
  ecran: { largeur: number; hauteur: number },
): { haut: number; gauche: number } {
  const gauche = Math.min(
    Math.max(ECART, bouton.droite - menu.largeur),
    Math.max(ECART, ecran.largeur - menu.largeur - ECART),
  )
  const placeDessous = ecran.hauteur - bouton.bas - ECART
  const placeDessus = bouton.haut - ECART
  const dessus = menu.hauteur + ECART > placeDessous && placeDessus > placeDessous
  const haut = dessus
    ? Math.max(ECART, bouton.haut - ECART - menu.hauteur)
    : Math.min(bouton.bas + ECART, Math.max(ECART, ecran.hauteur - menu.hauteur - ECART))
  return { haut, gauche }
}
