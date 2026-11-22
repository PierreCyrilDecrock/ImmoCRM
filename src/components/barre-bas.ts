import { createContext, useContext } from 'react'

/**
 * La place, sous la page, où une fiche pose sa barre d'actions sur téléphone
 * (`BarreActionsFiche`). Fournie par `MiseEnPage` : tant qu'une barre l'occupe, la navigation
 * du bas et le bouton « + » s'effacent sur téléphone.
 */
export type ContexteBarreBas = {
  /** L'élément où la barre est placée (`null` avant le premier affichage). */
  cible: HTMLElement | null
  /** Une barre arrive (`true`) ou s'en va (`false`). Fonction stable. */
  occuper: (presente: boolean) => void
  /** Une barre occupe la place. */
  occupee: boolean
}

export const BarreBasContexte = createContext<ContexteBarreBas>({
  cible: null,
  occuper: () => undefined,
  occupee: false,
})

/** Vrai quand une fiche montre sa barre d'actions en bas (téléphone). */
export function useBarreBasOccupee(): boolean {
  return useContext(BarreBasContexte).occupee
}
