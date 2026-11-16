import { Link, useLocation } from 'react-router-dom'
import { ENTREES_NAVIGATION, entreeActive } from '../lib/navigation'
import Icone from './Icone'

/**
 * Navigation principale. Sur téléphone : barre en bas, à portée de pouce.
 * Sur tablette : colonne étroite à gauche. Sur ordinateur : colonne large avec le nom de l'application.
 */
export default function Navigation() {
  const { pathname } = useLocation()
  const active = entreeActive(pathname)

  return (
    <nav
      aria-label="Navigation principale"
      className="order-last border-t border-bord bg-surface pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] md:order-none md:w-24 md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-r md:pr-0 lg:w-60"
    >
      <p className="hidden items-center justify-center gap-3 px-3 pt-5 pb-4 md:flex lg:justify-start lg:px-5">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-9" />
        <span className="hidden text-xl font-bold tracking-tight text-encre lg:inline">
          ImmoCRM
        </span>
      </p>
      <ul className="flex md:flex-col md:gap-1 md:px-2 lg:px-3">
        {ENTREES_NAVIGATION.map((entree) => {
          const estActive = entree === active
          return (
            <li key={entree.chemin} className="min-w-0 flex-1 md:flex-none">
              <Link
                to={entree.chemin}
                aria-current={estActive ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.625rem] font-medium tracking-tighter min-[360px]:text-[0.6875rem] min-[360px]:tracking-tight focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:min-h-16 md:rounded-xl md:text-xs lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-base lg:tracking-normal ${
                  estActive
                    ? 'text-accent md:bg-accent-doux md:text-accent-fort'
                    : 'text-encre-douce hover:text-encre md:hover:bg-creux'
                }`}
              >
                <Icone nom={entree.icone} />
                <span className="max-w-full truncate">{entree.libelle}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
