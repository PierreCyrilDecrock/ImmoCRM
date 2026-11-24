import { useId, type TextareaHTMLAttributes } from 'react'
import { CLASSES_CHAMP, descriptionChamp } from './champ-commun'
import EnveloppeChamp from './EnveloppeChamp'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & {
  libelle: string
  aide?: string
  erreur?: string
  /** Libellé lu par les lecteurs d'écran seulement ; le texte d'invite tient lieu de titre. */
  libelleMasque?: boolean
  /** Classes ajoutées au champ (`resize-none` pour un champ d'une ligne). */
  classesEnPlus?: string
}

/** Champ de saisie sur plusieurs lignes (note, compte rendu) avec son libellé. */
export default function ChampTexteLong({
  libelle,
  aide,
  erreur,
  libelleMasque = false,
  classesEnPlus = '',
  rows = 4,
  ...champ
}: Props) {
  const id = useId()
  return (
    <EnveloppeChamp
      id={id}
      libelle={libelle}
      aide={aide}
      erreur={erreur}
      libelleMasque={libelleMasque}
    >
      <textarea
        id={id}
        rows={rows}
        className={`${CLASSES_CHAMP} py-2 ${classesEnPlus}`}
        aria-invalid={erreur !== undefined || undefined}
        aria-describedby={descriptionChamp(id, aide, erreur)}
        {...champ}
        // Repère lu par `FenetreModale` pour placer le curseur à l'ouverture.
        data-autofocus={champ.autoFocus === true ? '' : undefined}
      />
    </EnveloppeChamp>
  )
}
