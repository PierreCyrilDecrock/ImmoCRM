import { useId } from 'react'

type Props<V extends string> = {
  libelle: string
  options: readonly { valeur: V; libelle: string }[]
  /** Valeurs cochées. */
  valeurs: readonly V[]
  onChange: (valeurs: V[]) => void
  aide?: string
}

/**
 * Plusieurs choix possibles parmi quelques valeurs (les rôles d'un contact) : des pastilles
 * à toucher, qui s'allument. Les valeurs sont rendues dans l'ordre des options.
 */
export default function ChoixMultiple<V extends string>({
  libelle,
  options,
  valeurs,
  onChange,
  aide,
}: Props<V>) {
  const id = useId()

  function basculer(valeur: V) {
    const cochees = valeurs.includes(valeur)
      ? valeurs.filter((v) => v !== valeur)
      : [...valeurs, valeur]
    onChange(options.map((option) => option.valeur).filter((v) => cochees.includes(v)))
  }

  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="text-sm font-medium text-encre">
        {libelle}
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option) => {
          const cochee = valeurs.includes(option.valeur)
          return (
            <button
              key={option.valeur}
              type="button"
              aria-pressed={cochee}
              onClick={() => basculer(option.valeur)}
              className={`min-h-11 rounded-full px-4 text-base font-medium ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                cochee
                  ? 'bg-accent text-sur-plein ring-accent'
                  : 'bg-surface text-encre ring-bord-fort hover:bg-creux'
              }`}
            >
              {option.libelle}
            </button>
          )
        })}
      </div>
      {aide !== undefined && <p className="mt-1 text-sm text-encre-douce">{aide}</p>}
    </div>
  )
}
