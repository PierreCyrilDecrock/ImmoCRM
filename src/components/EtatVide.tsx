import type { ReactNode } from 'react'
import Icone, { type NomIcone } from './Icone'

type Props = {
  titre: string
  /** Explique ce qui apparaîtra ici, ou quoi faire pour commencer. */
  children?: ReactNode
  icone?: NomIcone
  /** Bouton proposé pour sortir de l'état vide (par exemple « Ajouter un contact »). */
  action?: ReactNode
}

/** À afficher quand une page ou une liste n'a encore rien à montrer. */
export default function EtatVide({ titre, children, icone = 'vide', action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-bord-fort px-4 py-10 text-center">
      <Icone nom={icone} className="size-10 text-encre-douce" />
      <p className="text-lg font-semibold text-encre">{titre}</p>
      {children !== undefined && (
        <div className="max-w-sm text-sm text-encre-douce">{children}</div>
      )}
      {action}
    </div>
  )
}
