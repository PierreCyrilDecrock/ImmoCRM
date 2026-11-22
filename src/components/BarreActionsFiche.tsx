import { useContext, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BarreBasContexte } from './barre-bas'

type Props = {
  /** Nom de la barre, lu par les lecteurs d'écran (« Actions sur Camille Fictif »). */
  libelle: string
  /** Les touches : `LienAction`, la principale (Appeler) d'abord, plus large. */
  children: ReactNode
}

/**
 * Sur téléphone, la barre d'actions fixée en bas d'une fiche, à portée de pouce : elle prend
 * la place de la navigation (on revient par le lien du haut) et du bouton « + ». Elle est
 * posée sous la page, pas par-dessus : la fin de la page reste visible. Rien ne s'affiche
 * sur tablette et ordinateur.
 */
export default function BarreActionsFiche({ libelle, children }: Props) {
  const { cible, occuper } = useContext(BarreBasContexte)

  useEffect(() => {
    occuper(true)
    return () => occuper(false)
  }, [occuper])

  if (cible === null) return null
  return createPortal(
    <div
      role="group"
      aria-label={libelle}
      className="flex gap-2 border-t border-bord bg-surface/90 pt-2 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] backdrop-blur-md"
    >
      {children}
    </div>,
    cible,
  )
}
