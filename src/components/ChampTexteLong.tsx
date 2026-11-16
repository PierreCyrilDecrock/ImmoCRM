import { useId, type TextareaHTMLAttributes } from 'react'
import { CLASSES_CHAMP, descriptionChamp } from './champ-commun'
import EnveloppeChamp from './EnveloppeChamp'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & {
  libelle: string
  aide?: string
  erreur?: string
}

/** Champ de saisie sur plusieurs lignes (note, compte rendu) avec son libellé. */
export default function ChampTexteLong({ libelle, aide, erreur, rows = 4, ...champ }: Props) {
  const id = useId()
  return (
    <EnveloppeChamp id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <textarea
        id={id}
        rows={rows}
        className={`${CLASSES_CHAMP} py-2`}
        aria-invalid={erreur !== undefined || undefined}
        aria-describedby={descriptionChamp(id, aide, erreur)}
        {...champ}
      />
    </EnveloppeChamp>
  )
}
