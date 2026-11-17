type Props<V extends string> = {
  /** Nom de l'ensemble, lu par les lecteurs d'écran. */
  libelle: string
  options: readonly { valeur: V; libelle: string; compteur?: number | null }[]
  valeur: V
  onChange: (valeur: V) => void
}

/**
 * Onglets d'une page (les vues de la page Tâches) : des pastilles à toucher, une seule
 * allumée. Elles passent à la ligne sur téléphone plutôt que d'élargir la page. Un compteur
 * facultatif suit chaque libellé.
 */
export default function Onglets<V extends string>({
  libelle,
  options,
  valeur,
  onChange,
}: Props<V>) {
  return (
    <div role="tablist" aria-label={libelle} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const actif = option.valeur === valeur
        return (
          <button
            key={option.valeur}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(option.valeur)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-base font-medium ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              actif
                ? 'bg-accent text-sur-plein ring-accent'
                : 'bg-surface text-encre ring-bord-fort hover:bg-creux'
            }`}
          >
            {option.libelle}
            {option.compteur !== undefined && option.compteur !== null && (
              <span
                className={`rounded-full px-2 text-sm font-semibold ${
                  actif ? 'bg-sur-plein/20 text-sur-plein' : 'bg-creux text-encre-douce'
                }`}
              >
                {option.compteur}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
