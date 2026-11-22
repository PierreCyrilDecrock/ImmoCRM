import type { ReactNode } from 'react'
import Onglets from './Onglets'

type Props<V extends string> = {
  /** Nom de l'ensemble, lu par les lecteurs d'écran (« Rubriques de la fiche »). */
  libelle: string
  options: readonly { valeur: V; libelle: string; compteur?: number | null }[]
  valeur: V
  onChange: (valeur: V) => void
  /** Identifiant du panneau (unique dans la page). */
  id: string
  /** Le contenu de l'onglet choisi. */
  children: ReactNode
}

/**
 * Les onglets d'une fiche et leur panneau : une commande segmentée (`Onglets`) avec un
 * compteur par onglet, puis le contenu de l'onglet choisi. L'onglet choisi est gardé dans
 * l'adresse par la page (`?onglet=…`), qui gère aussi les touches 1 à 4.
 */
export default function OngletsFiche<V extends string>({
  libelle,
  options,
  valeur,
  onChange,
  id,
  children,
}: Props<V>) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Onglets
        libelle={libelle}
        options={options}
        valeur={valeur}
        onChange={onChange}
        panneau={id}
      />
      <div
        id={id}
        role="tabpanel"
        aria-labelledby={`${id}-${valeur}`}
        className="flex min-w-0 flex-col gap-4"
      >
        {children}
      </div>
    </div>
  )
}
