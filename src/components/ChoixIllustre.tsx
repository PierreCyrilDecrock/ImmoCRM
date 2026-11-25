import { useId, type ReactNode } from 'react'

type Option<V extends string> = {
  valeur: V
  /** Libellé sous le dessin ; un « \n » le coupe à l'endroit voulu (« Très\npetite »). */
  libelle: string
  /** Petit dessin au-dessus du libellé (« Aa » à sa taille, la forme d'un arrondi). */
  illustration: ReactNode
}

type Props<V extends string> = {
  /** Nom du choix, lu par les lecteurs d'écran (« Taille du texte »). */
  libelle: string
  options: readonly Option<V>[]
  valeur: V
  onChange: (valeur: V) => void
}

/** Une colonne par choix, toutes de même largeur. */
const COLONNES: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

/**
 * Un choix parmi quelques valeurs illustrées, en colonnes de même largeur (taille du texte,
 * arrondis) : chaque dessin tient dans une bande de même hauteur et chaque libellé commence à
 * la même hauteur, sur deux lignes au plus. Ce sont de vrais boutons radio : les flèches du
 * clavier passent d'un choix à l'autre.
 */
export default function ChoixIllustre<V extends string>({
  libelle,
  options,
  valeur,
  onChange,
}: Props<V>) {
  const nom = useId()
  return (
    <fieldset
      className={`grid gap-1 rounded-xl bg-creux p-1 ${COLONNES[options.length] ?? 'grid-cols-5'}`}
    >
      <legend className="sr-only">{libelle}</legend>
      {options.map((option) => (
        <label
          key={option.valeur}
          className="flex min-h-20 min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-lg px-0.5 pt-2.5 pb-1.5 text-encre-douce hover:text-encre has-checked:bg-surface has-checked:font-semibold has-checked:text-encre has-checked:shadow-sm has-checked:ring-1 has-checked:ring-bord has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <input
            type="radio"
            name={nom}
            value={option.valeur}
            checked={option.valeur === valeur}
            onChange={() => onChange(option.valeur)}
            className="sr-only"
          />
          <span aria-hidden="true" className="flex h-7 w-full items-end justify-center">
            {option.illustration}
          </span>
          <span className="block h-[1.875rem] w-full text-center text-xs leading-[0.9375rem] whitespace-pre-line">
            {option.libelle}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
