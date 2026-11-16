import type { ReactNode } from 'react'
import { libelleVersion, VERSION } from '../lib/version'

type Props = { titre: string; children: ReactNode }

/** Cadre commun aux écrans affichés hors session : nom de l'application, titre, contenu centré. */
export default function CadreConnexion({ titre, children }: Props) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <p className="text-center text-3xl font-bold tracking-tight text-encre">ImmoCRM</p>
          <h1 className="mt-2 text-center text-lg text-encre-douce">{titre}</h1>
          <div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-bord">{children}</div>
          <p className="mt-4 text-center text-xs text-encre-douce">{libelleVersion(VERSION)}</p>
        </div>
      </div>
    </main>
  )
}
