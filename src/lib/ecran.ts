import { useEffect, useState } from 'react'

/** Les trois tailles d'écran de l'application (voir docs/design.md). */
export type TailleEcran = 'telephone' | 'tablette' | 'ordinateur'

/**
 * Les seuils de Tailwind (`md:` à 48 rem, `lg:` à 64 rem, soit 768 et 1024 px) : la même
 * mesure que les classes, pour que le code et l'affichage changent de taille ensemble.
 */
const REQUETE_TABLETTE = '(min-width: 48rem)'
const REQUETE_ORDINATEUR = '(min-width: 64rem)'

/** La taille d'écran, d'après les deux seuils. */
export function tailleDe(auMoinsTablette: boolean, auMoinsOrdinateur: boolean): TailleEcran {
  if (auMoinsOrdinateur) return 'ordinateur'
  return auMoinsTablette ? 'tablette' : 'telephone'
}

function tailleActuelle(): TailleEcran {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'telephone'
  }
  return tailleDe(
    window.matchMedia(REQUETE_TABLETTE).matches,
    window.matchMedia(REQUETE_ORDINATEUR).matches,
  )
}

/**
 * La taille de l'écran, suivie quand la fenêtre change de largeur (tablette tournée, fenêtre
 * redimensionnée). Pour une page dont l'organisation change d'une taille à l'autre, au-delà
 * de ce que les classes `md:` et `lg:` savent faire (la fiche Contact).
 */
export function useTailleEcran(): TailleEcran {
  const [taille, setTaille] = useState(tailleActuelle)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const requetes = [REQUETE_TABLETTE, REQUETE_ORDINATEUR].map((requete) =>
      window.matchMedia(requete),
    )
    const suivre = () => setTaille(tailleActuelle())
    requetes.forEach((requete) => requete.addEventListener('change', suivre))
    return () => requetes.forEach((requete) => requete.removeEventListener('change', suivre))
  }, [])

  return taille
}
