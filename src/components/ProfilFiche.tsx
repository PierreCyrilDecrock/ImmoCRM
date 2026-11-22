import type { ReactNode } from 'react'

type Props = {
  /** Nom de la colonne, lu par les lecteurs d'écran (« Profil de Camille Fictif »). */
  libelle: string
  children: ReactNode
}

/**
 * Sur ordinateur, la colonne gauche d'une fiche : ce qu'on cherche à chaque appel (identité,
 * température, touches d'action, prochaine action, coordonnées). Elle reste à l'écran quand
 * on change d'onglet ou qu'on fait défiler le contenu des onglets ; si elle est plus haute que
 * l'écran, elle défile seule.
 */
export default function ProfilFiche({ libelle, children }: Props) {
  return (
    <aside
      aria-label={libelle}
      // Marge et retrait d'un quart de rem : le contour du clavier et celui des cartes restent
      // visibles malgré le défilement propre à la colonne.
      className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4 lg:-m-1 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:p-1"
    >
      {children}
    </aside>
  )
}
