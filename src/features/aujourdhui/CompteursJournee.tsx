import type { BlocCompte, CompteurJournee } from './maintenant'

type Props = {
  /** Les compteurs à montrer (`compteursJournee` : ceux à zéro sont déjà écartés). */
  compteurs: readonly CompteurJournee[]
  /** Toucher un compteur : descendre à son bloc. */
  onAller: (bloc: BlocCompte) => void
}

/**
 * La journée en compteurs, sous « Bonjour » (étape F.2, proposition 3) : des pastilles
 * « 3 rendez-vous », « 4 à rappeler », « 1 tâche », qu'on touche pour descendre au bloc
 * (règle 9 : un compteur mène à ce qu'il compte). Le nombre est rouge quand le bloc a du
 * retard. Chaque pastille dit aussi, aux lecteurs d'écran, où elle mène.
 */
export default function CompteursJournee({ compteurs, onAller }: Props) {
  return (
    <div role="group" aria-label="Aller à un bloc" className="flex flex-wrap gap-2">
      {compteurs.map((compte) => (
        <button
          key={compte.bloc}
          type="button"
          onClick={() => onAller(compte.bloc)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-medium text-encre ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span
            className={`text-base font-bold tabular-nums ${compte.alerte ? 'text-danger' : ''}`}
          >
            {compte.nombre}
          </span>
          {compte.libelle}
          <span className="sr-only">
            {compte.alerte ? ', dont en retard' : ''} : aller à {compte.destination}
          </span>
        </button>
      ))}
    </div>
  )
}
