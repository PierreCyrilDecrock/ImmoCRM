import type { ReactNode } from 'react'

type Props = {
  /** Identifiant du champ (donné par `useId`), pour relier libellé, aide et erreur. */
  id: string
  libelle: string
  aide?: string
  erreur?: string
  /** Libellé lu par les lecteurs d'écran seulement (le champ replié de « Consigner un échange »). */
  libelleMasque?: boolean
  children: ReactNode
}

/**
 * Habillage commun des champs de formulaire : libellé au-dessus, aide et erreur en dessous.
 * `min-w-0` : placé dans une grille (Heure et Durée côte à côte), le champ rétrécit avec sa
 * colonne au lieu de déborder sur la voisine.
 */
export default function EnveloppeChamp({
  id,
  libelle,
  aide,
  erreur,
  libelleMasque = false,
  children,
}: Props) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={libelleMasque ? 'sr-only' : 'block text-sm font-medium text-encre'}
      >
        {libelle}
      </label>
      <div className={libelleMasque ? undefined : 'mt-1'}>{children}</div>
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
