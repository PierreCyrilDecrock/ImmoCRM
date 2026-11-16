import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navigation from './Navigation'

/**
 * Coquille de l'application une fois connecté : la navigation (en bas sur téléphone,
 * à gauche au-delà) et la page en cours, seule zone qui défile.
 */
export default function MiseEnPage() {
  const { pathname } = useLocation()
  const contenu = useRef<HTMLElement>(null)

  // Chaque nouvelle page s'ouvre en haut, pas là où la précédente avait défilé.
  useEffect(() => {
    contenu.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <Navigation />
      <main ref={contenu} className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
