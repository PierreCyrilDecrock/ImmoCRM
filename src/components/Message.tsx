import type { ReactNode } from 'react'
import Icone from './Icone'

export type GenreMessage = 'erreur' | 'succes' | 'info'

type Props = { genre: GenreMessage; children: ReactNode }

const COULEURS: Record<GenreMessage, string> = {
  erreur: 'bg-danger-doux text-danger ring-danger/30',
  succes: 'bg-succes-doux text-succes ring-succes/30',
  info: 'bg-accent-doux text-accent-fort ring-accent/30',
}

/**
 * Message affiché dans la page ou dans un formulaire. Une erreur est annoncée aussitôt
 * aux lecteurs d'écran. Pour une confirmation passagère, préférer `useNotifications`.
 */
export default function Message({ genre, children }: Props) {
  return (
    <div
      role={genre === 'erreur' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ring-1 ${COULEURS[genre]}`}
    >
      <Icone nom={genre} className="mt-px size-5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
