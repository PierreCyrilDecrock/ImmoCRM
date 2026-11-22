import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { placerMenu } from '../lib/placement'
import Icone, { type NomIcone } from './Icone'

export type ElementMenu = {
  libelle: string
  icone: NomIcone
  onChoisir: () => void
  /** Action destructrice (suppression définitive) : en rouge, à la fin du menu. */
  danger?: boolean
  desactive?: boolean
}

type Props = {
  /** Ce que dit le bouton « … » aux lecteurs d'écran (« Autres actions sur la fiche »). */
  libelle: string
  elements: readonly ElementMenu[]
}

/**
 * Le bouton « … » et son menu, pour les actions rares d'une fiche (fusionner, exporter,
 * archiver, supprimer). Le menu s'ouvre par-dessus la page (une colonne qui défile ne le
 * coupe pas), sous le bouton et aligné à droite, ou au-dessus s'il manque de place. Au
 * clavier : les flèches parcourent le menu, Entrée choisit, Échap le referme et rend le
 * clavier au bouton. Un toucher à côté le referme ; si la page défile, il suit le bouton.
 */
export default function MenuActions({ libelle, elements }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const id = useId()
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

  // À l'ouverture, le menu se place d'après le bouton, avant d'être montré.
  useLayoutEffect(() => {
    if (ouvert) placer()
  }, [ouvert])

  // Une fois placé, le clavier va au premier élément (sans faire défiler la page).
  const place = position !== null
  useEffect(() => {
    if (!place) return
    menu.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
      ?.focus({ preventScroll: true })
  }, [place])

  // Un toucher à côté referme le menu ; s'il défile ou change de taille, le menu suit le bouton.
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
    document.addEventListener('scroll', placer, true)
    window.addEventListener('resize', placer)
    return () => {
      document.removeEventListener('pointerdown', aCote)
      document.removeEventListener('scroll', placer, true)
      window.removeEventListener('resize', placer)
    }
  }, [ouvert])

  function fermer(rendreLeClavier: boolean) {
    setOuvert(false)
    setPosition(null)
    if (rendreLeClavier) bouton.current?.focus()
  }

  function surTouche(evenement: KeyboardEvent<HTMLDivElement>) {
    const items = [
      ...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
        []),
    ]
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

  return (
    <div>
      <button
        ref={bouton}
        type="button"
        aria-label={libelle}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? id : undefined}
        onClick={() => (ouvert ? fermer(false) : setOuvert(true))}
        className="inline-flex size-11 items-center justify-center rounded-lg bg-surface text-encre shadow-xs ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icone nom="plus" className="size-5" />
      </button>
      {ouvert && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={libelle}
          onKeyDown={surTouche}
          style={
            position === null
              ? { visibility: 'hidden', top: 0, left: 0 }
              : { top: position.haut, left: position.gauche }
          }
          className="fixed z-30 flex w-64 max-w-[calc(100vw-1rem)] flex-col rounded-2xl bg-surface p-1.5 shadow-lg ring-1 ring-bord"
        >
          {elements.map((element) => (
            <button
              key={element.libelle}
              type="button"
              role="menuitem"
              disabled={element.desactive}
              onClick={() => {
                fermer(true)
                element.onChoisir()
              }}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-base font-medium hover:bg-creux focus-visible:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                element.danger === true ? 'text-danger' : 'text-encre'
              }`}
            >
              <Icone
                nom={element.icone}
                className={`size-5 shrink-0 ${element.danger === true ? '' : 'text-encre-douce'}`}
              />
              {element.libelle}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
