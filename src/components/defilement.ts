import { useEffect, useState, type RefObject } from 'react'

/**
 * Une rangée qui défile de côté cache-t-elle encore une suite à droite ? Un pixel de marge,
 * pour les arrondis des écrans à haute densité.
 */
export function suiteADroite(position: number, visible: number, totale: number): boolean {
  return position + visible < totale - 1
}

/**
 * Suit une rangée qui défile de côté : vrai tant qu'une partie reste cachée à droite, pour
 * la signaler par un fondu (un contenu coupé ne se coupe jamais net).
 */
export function useSuiteADroite(rangee: RefObject<HTMLElement | null>): boolean {
  const [suite, setSuite] = useState(false)
  useEffect(() => {
    const element = rangee.current
    if (element === null) return
    const mesurer = () =>
      setSuite(suiteADroite(element.scrollLeft, element.clientWidth, element.scrollWidth))
    element.addEventListener('scroll', mesurer, { passive: true })
    // L'observateur mesure aussitôt, puis à chaque changement de taille.
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(element)
    return () => {
      element.removeEventListener('scroll', mesurer)
      observateur.disconnect()
    }
  }, [rangee])
  return suite
}
