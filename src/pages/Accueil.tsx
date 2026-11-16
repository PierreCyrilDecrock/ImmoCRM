import { libelleVersion, VERSION } from '../lib/version'

/** Page d'accueil provisoire, remplacée par l'écran « Aujourd'hui » à l'étape 1.11. */
export default function Accueil() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center text-slate-900">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">ImmoCRM</h1>
      <p className="text-slate-600">CRM personnel pour mandataire immobilier</p>
      <p className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">
        {libelleVersion(VERSION)}
      </p>
    </main>
  )
}
