import { Link, useLocation } from 'react-router-dom'
import { ENTREES_NAVIGATION, entreeActive } from '../lib/navigation'
import Icone from './Icone'

/**
 * Navigation principale. Sur téléphone : barre en bas, à portée de pouce, l'entrée active
 * repérée par une capsule autour de son dessin. Sur tablette : colonne étroite à gauche.
 * Sur ordinateur : colonne large avec le nom de l'application, l'entrée active en blanc.
 */
export default function Navigation() {
  const { pathname } = useLocation()
  const active = entreeActive(pathname)

  return (
    <nav
      aria-label="Navigation principale"
      className="order-last border-t border-bord bg-surface/90 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md md:order-none md:w-24 md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-r md:bg-fond md:pr-0 md:backdrop-blur-none lg:w-60"
    >
      <p className="hidden items-center justify-center gap-3 px-3 pt-5 pb-4 md:flex lg:justify-start lg:px-5">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
        <span className="hidden text-lg font-bold tracking-tight text-encre lg:inline">
          ImmoCRM
        </span>
      </p>
      <ul className="flex pt-1 md:flex-col md:gap-1 md:px-2 md:pt-0 lg:px-3">
        {ENTREES_NAVIGATION.map((entree) => {
          const estActive = entree === active
          return (
            <li key={entree.chemin} className="min-w-0 flex-1 md:flex-none">
              <Link
                to={entree.chemin}
                aria-current={estActive ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.625rem] tracking-tighter min-[360px]:text-[0.6875rem] min-[360px]:tracking-tight focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:min-h-16 md:rounded-xl md:text-xs lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-[0.9375rem] lg:tracking-normal ${
                  estActive
                    ? 'font-semibold text-encre md:bg-surface md:shadow-xs md:ring-1 md:ring-bord'
                    : 'font-medium text-encre-douce hover:text-encre md:hover:bg-creux'
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full md:h-auto md:w-auto ${
                    estActive
                      ? 'bg-accent-doux text-accent-fort md:bg-transparent md:text-accent'
                      : ''
                  }`}
                >
                  <Icone nom={entree.icone} className="size-[1.375rem]" />
                </span>
                <span className="max-w-full truncate">{entree.libelle}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
