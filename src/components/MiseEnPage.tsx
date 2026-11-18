import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navigation from './Navigation'

/**
 * Coquille de l'application une fois connecté : la navigation (en bas sur téléphone,
 * à gauche au-delà), le champ de recherche en haut et la page en cours, seule zone qui défile.
 */
type Props = {
  /** Bandeau fixe au-dessus de la page (le champ de recherche). */
  enTete?: ReactNode
  /**
   * Élément posé par-dessus la page, en bas à droite (le bouton « + » de la saisie rapide).
   * Il reçoit de quoi faire relire la page affichée après une création.
   */
  flottant?: (rafraichir: () => void) => ReactNode
}

export default function MiseEnPage({ enTete, flottant }: Props) {
  const { pathname } = useLocation()
  const contenu = useRef<HTMLElement>(null)
  // Changer ce numéro recrée la page affichée : elle relit ses données.
  const [version, setVersion] = useState(0)

  // Chaque nouvelle page s'ouvre en haut, pas là où la précédente avait défilé.
  useEffect(() => {
    contenu.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <Navigation />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {enTete}
        {/* Marge du bas : la fin de la page défile au-dessus du bouton flottant. */}
        <main
          ref={contenu}
          className={`min-h-0 flex-1 overflow-y-auto ${flottant !== undefined ? 'pb-20 md:pb-24' : ''}`}
        >
          <Outlet key={version} />
        </main>
        {flottant?.(() => setVersion((actuelle) => actuelle + 1))}
      </div>
    </div>
  )
}
