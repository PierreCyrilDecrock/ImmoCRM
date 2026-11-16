import { useId, useState, type KeyboardEvent } from 'react'
import { CLASSES_CHAMP } from './champ-commun'
import Icone from './Icone'

type Props = {
  libelle: string
  etiquettes: readonly string[]
  /**
   * Appelé quand la liste doit changer. `ajouter` reçoit le texte saisi et renvoie la
   * nouvelle liste : c'est l'appelant qui décide du nettoyage et des doublons.
   */
  onChange: (etiquettes: string[]) => void
  ajouter: (etiquettes: readonly string[], saisie: string) => string[]
  aide?: string
  placeholder?: string
  maxLength?: number
}

/**
 * Saisie d'étiquettes libres : on écrit, on valide par « Entrée », une virgule ou le
 * bouton Ajouter ; chaque étiquette se retire en la touchant.
 */
export default function ChampEtiquettes({
  libelle,
  etiquettes,
  onChange,
  ajouter,
  aide,
  placeholder,
  maxLength,
}: Props) {
  const id = useId()
  const [saisie, setSaisie] = useState('')

  function valider() {
    if (saisie.trim() === '') return
    onChange(ajouter(etiquettes, saisie))
    setSaisie('')
  }

  function surTouche(evenement: KeyboardEvent<HTMLInputElement>) {
    if (evenement.key === 'Enter' || evenement.key === ',') {
      // « Entrée » ne doit pas envoyer le formulaire tant qu'une étiquette est en cours.
      evenement.preventDefault()
      valider()
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-encre">
        {libelle}
      </label>
      {etiquettes.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-2">
          {etiquettes.map((etiquette) => (
            <li key={etiquette}>
              <button
                type="button"
                aria-label={`Retirer l'étiquette ${etiquette}`}
                onClick={() => onChange(etiquettes.filter((e) => e !== etiquette))}
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-creux py-1 pr-2 pl-4 text-base font-medium text-encre ring-1 ring-bord-fort ring-inset hover:bg-danger-doux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {etiquette}
                <Icone nom="fermer" className="size-5 text-encre-douce" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          className={CLASSES_CHAMP}
          value={saisie}
          onChange={(evenement) => setSaisie(evenement.target.value)}
          onKeyDown={surTouche}
          // Une étiquette écrite mais pas validée n'est pas perdue quand on quitte le champ.
          onBlur={valider}
          placeholder={placeholder}
          maxLength={maxLength}
          enterKeyHint="done"
          autoCapitalize="none"
          aria-describedby={aide !== undefined ? `${id}-aide` : undefined}
        />
        <button
          type="button"
          onClick={valider}
          className="min-h-11 shrink-0 rounded-lg px-3 text-base font-semibold text-accent hover:bg-accent-doux focus-visible:outline-2 focus-visible:outline-accent"
        >
          Ajouter
        </button>
      </div>
      {aide !== undefined && (
        <p id={`${id}-aide`} className="mt-1 text-sm text-encre-douce">
          {aide}
        </p>
      )}
    </div>
  )
}
