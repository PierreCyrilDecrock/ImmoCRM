import { useId, type SelectHTMLAttributes } from 'react'
import { CLASSES_CHAMP, descriptionChamp } from './champ-commun'
import EnveloppeChamp from './EnveloppeChamp'

export type OptionChoix = { valeur: string; libelle: string }

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'children'> & {
  libelle: string
  options: readonly OptionChoix[]
  /** Texte de la première ligne, sans valeur (par exemple « Choisir… »). */
  optionVide?: string
  aide?: string
  erreur?: string
}

/** Liste déroulante : le téléphone affiche son propre sélecteur, facile à utiliser au pouce. */
export default function ChampChoix({
  libelle,
  options,
  optionVide,
  aide,
  erreur,
  ...champ
}: Props) {
  const id = useId()
  return (
    <EnveloppeChamp id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <select
        id={id}
        className={CLASSES_CHAMP}
        aria-invalid={erreur !== undefined || undefined}
        aria-describedby={descriptionChamp(id, aide, erreur)}
        {...champ}
      >
        {optionVide !== undefined && <option value="">{optionVide}</option>}
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
    </EnveloppeChamp>
  )
}
