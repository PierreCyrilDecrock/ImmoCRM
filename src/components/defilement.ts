import { useEffect, useState, type RefObject } from 'react'

/**
 * Une rangée qui défile de côté cache-t-elle encore une suite à droite ? Un pixel de marge,
 * pour les arrondis des écrans à haute densité.
 */
export function suiteADroite(position: number, visible: number, totale: number): boolean {
  return position + visible < totale - 1
}

/** Une rangée qui a défilé cache-t-elle un début à gauche ? Même marge d'un pixel. */
export function suiteAGauche(position: number): boolean {
  return position > 1
}

/** Largeur (px) du fondu qui signale une suite cachée au bord d'une rangée. */
export const LARGEUR_FONDU = 40

/**
 * Le masque d'une rangée qui défile : son contenu s'efface en fondu sur le bord où une suite
 * est cachée. Un masque, et non un dégradé posé par-dessus, laisse voir le fond, quel qu'il
 * soit : le fondu suit le thème clair ou sombre. `undefined` : rien de caché, pas de masque.
 */
export function masqueFondu(
  suites: { gauche: boolean; droite: boolean },
  largeur = LARGEUR_FONDU,
): string | undefined {
  if (!suites.gauche && !suites.droite) return undefined
  const debut = suites.gauche ? `transparent, #000 ${largeur}px` : '#000, #000'
  const fin = suites.droite ? `#000 calc(100% - ${largeur}px), transparent` : '#000, #000'
  return `linear-gradient(to right, ${debut}, ${fin})`
}

/**
 * La position de défilement qui montre en entier l'élément qui va de `debut` à `fin` (en px,
 * dans le contenu de la rangée), à l'écart des fondus de largeur `marge` ; la position
 * actuelle s'il est déjà bien visible. Sert à ce que l'onglet choisi ne soit jamais caché.
 */
export function positionPourMontrer(
  element: { debut: number; fin: number },
  rangee: { position: number; visible: number; totale: number },
  marge = LARGEUR_FONDU,
): number {
  const { position, visible, totale } = rangee
  let cible = position
  if (element.fin > position + visible - marge) cible = element.fin - visible + marge
  if (element.debut < cible + marge) cible = element.debut - marge
  return Math.min(Math.max(0, totale - visible), Math.max(0, cible))
}

/**
 * Suit une rangée qui défile de côté : ce qui reste caché à gauche et à droite, pour le
 * signaler par un fondu (un contenu coupé ne se coupe jamais net).
 */
export function useSuitesCachees(rangee: RefObject<HTMLElement | null>): {
  gauche: boolean
  droite: boolean
} {
  const [suites, setSuites] = useState({ gauche: false, droite: false })
  useEffect(() => {
    const element = rangee.current
    if (element === null) return
    const mesurer = () => {
      const gauche = suiteAGauche(element.scrollLeft)
      const droite = suiteADroite(element.scrollLeft, element.clientWidth, element.scrollWidth)
      setSuites((avant) =>
        avant.gauche === gauche && avant.droite === droite ? avant : { gauche, droite },
      )
    }
    element.addEventListener('scroll', mesurer, { passive: true })
    // L'observateur mesure aussitôt, puis à chaque changement de taille de la rangée ou de son
    // contenu (un compteur qui arrive élargit un onglet).
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(element)
    if (element.firstElementChild !== null) observateur.observe(element.firstElementChild)
    return () => {
      element.removeEventListener('scroll', mesurer)
      observateur.disconnect()
    }
  }, [rangee])
  return suites
}
