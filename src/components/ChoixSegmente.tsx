import { useRef, type KeyboardEvent } from 'react'

type Props<V extends string> = {
  /** Nom du choix, lu par les lecteurs d'écran (« Température »). */
  libelle: string
  options: readonly { valeur: V; libelle: string }[]
  /** Le choix actuel ; `null` : aucun n'est allumé. */
  valeur: V | null
  onChange: (valeur: V) => void
  desactive?: boolean
}

/**
 * Un choix parmi quelques valeurs, enregistré d'un toucher (la température d'un contact) :
 * une commande segmentée, comme `Onglets`, mais qui choisit une valeur au lieu d'une vue.
 * Lue comme un groupe de boutons radio ; au clavier, les flèches passent d'un choix à
 * l'autre et le choisissent.
 */
export default function ChoixSegmente<V extends string>({
  libelle,
  options,
  valeur,
  onChange,
  desactive = false,
}: Props<V>) {
  const boutons = useRef<(HTMLButtonElement | null)[]>([])
  const rangActuel = options.findIndex((option) => option.valeur === valeur)

  function surTouche(evenement: KeyboardEvent<HTMLButtonElement>, rang: number) {
    const sens =
      evenement.key === 'ArrowRight' || evenement.key === 'ArrowDown'
        ? 1
        : evenement.key === 'ArrowLeft' || evenement.key === 'ArrowUp'
          ? -1
          : 0
    if (sens === 0) return
    evenement.preventDefault()
    const suivant = (rang + sens + options.length) % options.length
    const option = options[suivant]
    if (option === undefined) return
    boutons.current[suivant]?.focus()
    onChange(option.valeur)
  }

  return (
    <div
      role="radiogroup"
      aria-label={libelle}
      aria-disabled={desactive || undefined}
      className="flex w-full gap-1 rounded-xl bg-creux p-1"
    >
      {options.map((option, rang) => {
        const choisie = option.valeur === valeur
        // Un seul arrêt au clavier : le choix allumé, ou le premier s'il n'y en a pas.
        const atteignable = choisie || (rangActuel === -1 && rang === 0)
        return (
          <button
            key={option.valeur}
            ref={(element) => {
              boutons.current[rang] = element
            }}
            type="button"
            role="radio"
            aria-checked={choisie}
            tabIndex={atteignable ? 0 : -1}
            disabled={desactive}
            onClick={() => {
              if (!choisie) onChange(option.valeur)
            }}
            onKeyDown={(evenement) => surTouche(evenement, rang)}
            className={`min-h-10 flex-1 rounded-lg px-3 text-[0.9375rem] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${
              choisie
                ? 'bg-surface font-semibold text-encre shadow-sm ring-1 ring-bord'
                : 'font-medium text-encre-douce hover:text-encre disabled:hover:text-encre-douce'
            }`}
          >
            {option.libelle}
          </button>
        )
      })}
    </div>
  )
}
