import { useEffect, useRef } from 'react'

type Props<V extends string> = {
  /** Nom de l'ensemble, lu par les lecteurs d'écran. */
  libelle: string
  options: readonly { valeur: V; libelle: string; compteur?: number | null }[]
  valeur: V
  onChange: (valeur: V) => void
  /**
   * Identifiant du panneau que les onglets commandent (`OngletsFiche`) : chaque onglet reçoit
   * l'identifiant `<panneau>-<valeur>` et désigne le panneau.
   */
  panneau?: string
}

/**
 * Onglets d'une page (les vues de la page Tâches) : une commande segmentée, c'est-à-dire des
 * choix posés dans une capsule grise, le choix actif en blanc. Sur un écran étroit, la capsule
 * défile de côté plutôt que d'élargir la page. Un compteur facultatif suit chaque libellé.
 */
export default function Onglets<V extends string>({
  libelle,
  options,
  valeur,
  onChange,
  panneau,
}: Props<V>) {
  const ongletActif = useRef<HTMLButtonElement>(null)

  // Sur un écran étroit, l'onglet choisi est ramené dans la partie visible de la capsule.
  useEffect(() => {
    ongletActif.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [valeur])

  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div
        role="tablist"
        aria-label={libelle}
        className="inline-flex gap-1 rounded-xl bg-creux p-1"
      >
        {options.map((option) => {
          const actif = option.valeur === valeur
          return (
            <button
              key={option.valeur}
              ref={actif ? ongletActif : undefined}
              type="button"
              role="tab"
              id={panneau === undefined ? undefined : `${panneau}-${option.valeur}`}
              aria-controls={panneau}
              aria-selected={actif}
              onClick={() => onChange(option.valeur)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[0.9375rem] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                actif
                  ? 'bg-surface font-semibold text-encre shadow-sm ring-1 ring-bord'
                  : 'font-medium text-encre-douce hover:text-encre'
              }`}
            >
              {option.libelle}
              {option.compteur !== undefined && option.compteur !== null && (
                <span
                  className={`rounded-full px-2 text-xs font-semibold tabular-nums ${
                    actif ? 'bg-encre text-fond' : 'bg-bord text-encre-douce'
                  }`}
                >
                  {option.compteur}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
