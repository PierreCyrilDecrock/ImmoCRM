import type { ReactNode } from 'react'
import { libelleVersion, VERSION } from '../lib/version'

type Props = { titre: string; children: ReactNode }

/** Cadre commun aux écrans affichés hors session : nom de l'application, titre, contenu centré. */
export default function CadreConnexion({ titre, children }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className="w-full max-w-sm">
        <p className="text-center text-3xl font-bold tracking-tight">ImmoCRM</p>
        <h1 className="mt-2 text-center text-lg text-slate-600">{titre}</h1>
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {children}
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">{libelleVersion(VERSION)}</p>
      </div>
    </main>
  )
}
