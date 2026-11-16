import { useId, type InputHTMLAttributes } from 'react'
import { CLASSES_CHAMP, descriptionChamp } from './champ-commun'
import EnveloppeChamp from './EnveloppeChamp'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
  libelle: string
  /** Précision affichée sous le champ. */
  aide?: string
  /** Message d'erreur : le champ passe alors en rouge. */
  erreur?: string
}

/** Champ de saisie sur une ligne (texte, courriel, téléphone, date, nombre…) avec son libellé. */
export default function ChampSaisie({ libelle, aide, erreur, ...champ }: Props) {
  const id = useId()
  return (
    <EnveloppeChamp id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <input
        id={id}
        className={CLASSES_CHAMP}
        aria-invalid={erreur !== undefined || undefined}
        aria-describedby={descriptionChamp(id, aide, erreur)}
        {...champ}
      />
    </EnveloppeChamp>
  )
}
