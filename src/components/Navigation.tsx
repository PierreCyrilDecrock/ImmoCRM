import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ENTREES_NAVIGATION, entreeActive } from '../lib/navigation'
import Icone from './Icone'

/** Pastille d'une entrée : le texte affiché (« 3 », « 9+ ») et ce qu'entendent les lecteurs d'écran. */
export type PastilleEntree = { texte: string; annonce: string }

type Props = {
  /** Champ de recherche, sous le nom de l'application (ordinateur seulement). */
  recherche?: ReactNode
  /** Bloc placé sous les entrées (ordinateur seulement) : les fiches consultées récemment. */
  suite?: ReactNode
  /** Bas de la colonne (ordinateur seulement) : le bouton « Créer », l'état, la version. */
  pied?: ReactNode
  /** Pastilles des entrées, rangées par adresse (`/taches` : les tâches en retard). */
  pastilles?: Readonly<Partial<Record<string, PastilleEntree>>>
  /** Sur téléphone, une fiche montre sa barre d'actions à la place de la barre du bas. */
  cacheeSurTelephone?: boolean
}

/**
 * Navigation principale. Sur téléphone : barre en bas, à portée de pouce, l'entrée active
 * repérée par une capsule autour de son dessin. Sur tablette : colonne étroite à gauche.
 * Sur ordinateur : colonne large, point de départ de tous les gestes — le nom de
 * l'application, la recherche, les entrées, les fiches récentes, puis en bas « Créer » et
 * l'état des enregistrements. Une pastille (les tâches en retard) est un nombre rouge,
 * plafonné à « 9+ », sur les trois tailles d'écran (étape F.1) ; le nombre exact est lu avec
 * l'entrée.
 */
export default function Navigation({
  recherche,
  suite,
  pied,
  pastilles = {},
  cacheeSurTelephone = false,
}: Props) {
  const { pathname } = useLocation()
  const active = entreeActive(pathname)

  return (
    <nav
      aria-label="Navigation principale"
      className={`order-last ${cacheeSurTelephone ? 'max-md:hidden' : ''} border-t border-bord bg-surface/90 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md md:order-none md:flex md:w-24 md:shrink-0 md:flex-col md:border-t-0 md:border-r md:bg-fond md:pr-0 md:backdrop-blur-none lg:w-64`}
    >
      <p className="hidden items-center justify-center gap-3 px-3 pt-5 pb-4 md:flex lg:justify-start lg:px-5">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
        <span className="hidden text-lg font-bold tracking-tight text-encre lg:inline">
          ImmoCRM
        </span>
      </p>
      {recherche !== undefined && <div className="hidden px-3 pb-4 lg:block">{recherche}</div>}
      {/* Sur un écran peu haut, seul le milieu de la colonne défile : la recherche et « Créer » restent. */}
      <div className="md:min-h-0 md:flex-1 md:overflow-y-auto">
        <ul className="flex pt-1 md:flex-col md:gap-1 md:px-2 md:pt-0 lg:px-3">
          {ENTREES_NAVIGATION.map((entree) => {
            const estActive = entree === active
            const pastille = pastilles[entree.chemin]
            return (
              <li key={entree.chemin} className="min-w-0 flex-1 md:flex-none">
                <Link
                  to={entree.chemin}
                  aria-current={estActive ? 'page' : undefined}
                  // Lu d'un seul tenant : « Tâches, 3 en retard ».
                  aria-label={
                    pastille === undefined ? undefined : `${entree.libelle}, ${pastille.annonce}`
                  }
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.625rem] tracking-tighter min-[360px]:text-[0.6875rem] min-[360px]:tracking-tight focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:min-h-16 md:rounded-xl md:text-xs lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-[0.9375rem] lg:tracking-normal ${
                    estActive
                      ? 'font-semibold text-encre md:bg-surface md:shadow-xs md:ring-1 md:ring-bord'
                      : 'font-medium text-encre-douce hover:text-encre md:hover:bg-creux'
                  }`}
                >
                  <span
                    className={`relative flex h-7 w-12 items-center justify-center rounded-full md:h-auto md:w-auto ${
                      estActive
                        ? 'bg-accent-doux text-accent-fort md:bg-transparent md:text-accent'
                        : ''
                    }`}
                  >
                    <Icone nom={entree.icone} className="size-[1.375rem]" />
                    {pastille !== undefined && (
                      // Téléphone et tablette : le nombre (« 3 », « 9+ ») sur le coin du
                      // dessin, posé en absolu : la barre du bas garde sa hauteur.
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-danger px-1 text-[0.6875rem] leading-none font-semibold text-sur-plein tabular-nums ring-2 ring-surface md:-top-2 md:-right-3 md:h-5 md:min-w-5 md:ring-fond lg:hidden"
                      >
                        {pastille.texte}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate lg:min-w-0 lg:flex-1">
                    {entree.libelle}
                    {pastille !== undefined && (
                      <span className="sr-only">, {pastille.annonce}</span>
                    )}
                  </span>
                  {pastille !== undefined && (
                    // Ordinateur : le nombre au bout de la ligne.
                    <span
                      aria-hidden="true"
                      className="hidden h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-sur-plein tabular-nums lg:flex"
                    >
                      {pastille.texte}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        {suite !== undefined && <div className="hidden px-3 pt-6 pb-4 lg:block">{suite}</div>}
      </div>
      {pied !== undefined && (
        <div className="hidden flex-col gap-3 border-t border-bord px-3 pt-3 pb-4 lg:flex">
          {pied}
        </div>
      )}
    </nav>
  )
}
