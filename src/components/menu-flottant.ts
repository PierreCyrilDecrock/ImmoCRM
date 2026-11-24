import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { placerMenu } from '../lib/placement'

/** Les éléments du menu que le clavier parcourt. */
const ELEMENTS = '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)'

/**
 * Ce qui est commun aux menus qui s'ouvrent d'un bouton par-dessus la page (le menu « … »
 * d'une fiche, les reports d'une tâche) : ouverture, placement près du bouton
 * (`placerMenu`), clavier et fermeture.
 *
 * - À l'ouverture, le menu se place d'après le bouton avant d'être montré, puis le clavier
 *   va au premier élément (sans faire défiler la page).
 * - Au clavier : les flèches parcourent les éléments (`role="menuitem"` ou `menuitemradio`),
 *   Début et Fin vont aux bouts, Échap referme et rend le clavier au bouton, Tab referme.
 * - Un toucher à côté referme ; si la page défile ou change de taille, le menu suit le bouton.
 *
 * Avec `flottant` à faux (une feuille posée en bas de l'écran), le menu n'est pas placé : il
 * est montré aussitôt.
 */
export function useMenuFlottant(flottant = true) {
  const [ouvert, setOuvert] = useState(false)
  const bouton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ haut: number; gauche: number } | null>(null)

  /** Place le menu d'après la position actuelle du bouton. */
  function placer() {
    if (bouton.current === null || menu.current === null) return
    const rect = bouton.current.getBoundingClientRect()
    setPosition(
      placerMenu(
        { haut: rect.top, bas: rect.bottom, gauche: rect.left, droite: rect.right },
        { largeur: menu.current.offsetWidth, hauteur: menu.current.offsetHeight },
        { largeur: window.innerWidth, hauteur: window.innerHeight },
      ),
    )
  }

  useLayoutEffect(() => {
    if (ouvert && flottant) placer()
  }, [ouvert, flottant])

  // Une fois montré, le clavier va au premier élément.
  const pret = ouvert && (!flottant || position !== null)
  useEffect(() => {
    if (!pret) return
    menu.current?.querySelector<HTMLButtonElement>(ELEMENTS)?.focus({ preventScroll: true })
  }, [pret])

  useEffect(() => {
    if (!ouvert) return
    function aCote(evenement: PointerEvent) {
      const cible = evenement.target
      if (
        cible instanceof Node &&
        (menu.current?.contains(cible) || bouton.current?.contains(cible))
      )
        return
      setOuvert(false)
      setPosition(null)
    }
    document.addEventListener('pointerdown', aCote)
    if (flottant) {
      document.addEventListener('scroll', placer, true)
      window.addEventListener('resize', placer)
    }
    return () => {
      document.removeEventListener('pointerdown', aCote)
      document.removeEventListener('scroll', placer, true)
      window.removeEventListener('resize', placer)
    }
  }, [ouvert, flottant])

  function fermer(rendreLeClavier: boolean) {
    setOuvert(false)
    setPosition(null)
    if (rendreLeClavier) bouton.current?.focus()
  }

  function basculer() {
    if (ouvert) fermer(false)
    else setOuvert(true)
  }

  function surTouche(evenement: KeyboardEvent<HTMLElement>) {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>(ELEMENTS) ?? [])]
    const rang = items.findIndex((item) => item === document.activeElement)
    if (evenement.key === 'Escape') {
      evenement.preventDefault()
      // Le menu se ferme sans fermer la fenêtre ou la page derrière lui.
      evenement.stopPropagation()
      fermer(true)
    } else if (evenement.key === 'ArrowDown' || evenement.key === 'ArrowUp') {
      evenement.preventDefault()
      const sens = evenement.key === 'ArrowDown' ? 1 : -1
      items[(rang + sens + items.length) % items.length]?.focus()
    } else if (evenement.key === 'Home' || evenement.key === 'End') {
      evenement.preventDefault()
      items[evenement.key === 'Home' ? 0 : items.length - 1]?.focus()
    } else if (evenement.key === 'Tab') {
      fermer(false)
    }
  }

  /** Le style du menu flottant : caché tant qu'il n'est pas placé. */
  const style =
    position === null
      ? { visibility: 'hidden' as const, top: 0, left: 0 }
      : { top: position.haut, left: position.gauche }

  return { ouvert, basculer, fermer, bouton, menu, style, surTouche }
}
