import { createContext, useContext } from 'react'

/**
 * La recherche des contacts vue depuis une page (étape F.3, proposition 10 de la revue n° 2).
 * Sur téléphone et tablette, la barre « Rechercher un contact » ne reste qu'en haut de
 * l'accueil ; ailleurs, `Page` montre une loupe ronde à droite du titre (ou de la ligne de
 * retour d'une fiche), qui ouvre la même recherche en haut de l'écran, le clavier sorti.
 * Fourni par `FournisseurRecherche` (`src/features/recherche/`), autour de `MiseEnPage`.
 */
export type ContexteRecherchePage = {
  /** La page montre la loupe (téléphone et tablette ; jamais sur l'accueil ni sur Contacts). */
  loupe: boolean
  /** La recherche ouverte par la loupe est affichée. */
  ouverte: boolean
  /**
   * Ouvre la recherche et y met le curseur, dans le geste même (sans quoi l'iPhone ne sort
   * pas son clavier). `retour` : l'élément qui reprend le clavier à la fermeture (la loupe).
   */
  ouvrir: (retour?: HTMLElement | null) => void
  /** Referme la recherche ouverte par la loupe ; le clavier revient à la loupe. */
  fermer: () => void
}

export const RecherchePageContexte = createContext<ContexteRecherchePage>({
  loupe: false,
  ouverte: false,
  ouvrir: () => undefined,
  fermer: () => undefined,
})

export function useRecherchePage(): ContexteRecherchePage {
  return useContext(RecherchePageContexte)
}
