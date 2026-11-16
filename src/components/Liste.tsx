import type { ReactNode } from 'react'

type Props = { children: ReactNode }

/** Liste de lignes séparées par un filet. À remplir avec des `LigneListe`. */
export default function Liste({ children }: Props) {
  return (
    <ul className="divide-y divide-bord overflow-hidden rounded-2xl bg-surface ring-1 ring-bord">
      {children}
    </ul>
  )
}
