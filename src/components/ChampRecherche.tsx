import type { InputHTMLAttributes } from 'react'
import { CLASSES_CHAMP } from './champ-commun'
import Icone from './Icone'

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'type' | 'value' | 'onChange' | 'aria-label'
> & {
  /** Nom du champ, lu par les lecteurs d'écran (le champ n'a pas de libellé visible). */
  libelle: string
  valeur: string
  onChange: (valeur: string) => void
  /** Rappel du raccourci clavier (« ⌘K »), affiché à droite tant que le champ est vide. */
  rappel?: string
}

/**
 * Champ de recherche sur une ligne : une loupe, la saisie, et une croix pour tout effacer.
 * Champ vide, il peut rappeler son raccourci clavier.
 */
export default function ChampRecherche({ libelle, valeur, onChange, rappel, ...champ }: Props) {
  return (
    <div className="relative">
      <Icone
        nom="recherche"
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-encre-douce"
      />
      <input
        type="search"
        aria-label={libelle}
        className={`${CLASSES_CHAMP} pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden`}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        {...champ}
        // Repère lu par `FenetreModale` pour placer le curseur à l'ouverture.
        data-autofocus={champ.autoFocus === true ? '' : undefined}
      />
      {valeur === '' && rappel !== undefined && (
        // Déjà dit aux lecteurs d'écran par `aria-keyshortcuts` sur le champ.
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md px-1.5 py-0.5 font-sans text-xs font-medium text-encre-douce ring-1 ring-bord-fort"
        >
          {rappel}
        </kbd>
      )}
      {valeur !== '' && (
        <button
          type="button"
          aria-label="Effacer la recherche"
          onClick={() => onChange('')}
          className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg text-encre-douce hover:text-encre focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          <Icone nom="fermer" className="size-5" />
        </button>
      )}
    </div>
  )
}
