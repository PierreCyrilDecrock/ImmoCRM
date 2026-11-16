import type { ReactNode } from 'react'

type Props = {
  /** Identifiant du champ (donné par `useId`), pour relier libellé, aide et erreur. */
  id: string
  libelle: string
  aide?: string
  erreur?: string
  children: ReactNode
}

/** Habillage commun des champs de formulaire : libellé au-dessus, aide et erreur en dessous. */
export default function EnveloppeChamp({ id, libelle, aide, erreur, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-encre">
        {libelle}
      </label>
      <div className="mt-1">{children}</div>
      {aide !== undefined && (
        <p id={`${id}-aide`} className="mt-1 text-sm text-encre-douce">
          {aide}
        </p>
      )}
      {erreur !== undefined && (
        <p id={`${id}-erreur`} role="alert" className="mt-1 text-sm font-medium text-danger">
          {erreur}
        </p>
      )}
    </div>
  )
}
