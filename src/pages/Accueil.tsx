import { seDeconnecter } from '../features/connexion/deconnexion'
import { useSession } from '../features/connexion/session-contexte'
import { libelleVersion, VERSION } from '../lib/version'

/** Page d'accueil provisoire, remplacée par l'écran « Aujourd'hui » à l'étape 1.11. */
export default function Accueil() {
  const { session } = useSession()

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center text-slate-900">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">ImmoCRM</h1>
      <p className="text-slate-600">CRM personnel pour mandataire immobilier</p>
      <p className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">
        {libelleVersion(VERSION)}
      </p>
      {session?.user.email !== undefined && (
        <p className="mt-4 text-sm text-slate-600">Connecté : {session.user.email}</p>
      )}
      <button
        type="button"
        onClick={() => void seDeconnecter()}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 hover:bg-slate-100"
      >
        Se déconnecter
      </button>
    </main>
  )
}
