import { Link, useLocation } from 'react-router-dom'
import Icone from '../../components/Icone'
import {
  adresseFiche,
  iconeFiche,
  initialesDe,
  libelleGenreFiche,
  useFichesRecentes,
  type FicheRecente,
} from './recents'

/** Nombre de fiches montrées dans la colonne. */
export const RECENTES_DANS_LA_COLONNE = 3

/** La pastille ronde d'une fiche : les initiales d'un contact, le dessin d'un bien ou d'un projet. */
function Vignette({ fiche }: { fiche: FicheRecente }) {
  const initiales = fiche.genre === 'contact' ? initialesDe(fiche.titre) : ''
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold ${
        initiales === ''
          ? 'bg-surface text-encre-douce ring-1 ring-bord'
          : 'bg-accent-doux text-accent-fort'
      }`}
    >
      {initiales === '' ? <Icone nom={iconeFiche(fiche.genre)} className="size-4" /> : initiales}
    </span>
  )
}

/**
 * « Consultés récemment », dans la colonne de navigation sur ordinateur : les trois
 * dernières fiches ouvertes, la plus récente en haut. Rien tant qu'aucune fiche n'a été vue.
 */
export default function RecentesColonne() {
  const { pathname } = useLocation()
  const fiches = useFichesRecentes().slice(0, RECENTES_DANS_LA_COLONNE)
  if (fiches.length === 0) return null

  return (
    <section aria-labelledby="titre-recentes-colonne" className="flex flex-col gap-1">
      <h2
        id="titre-recentes-colonne"
        className="px-3 text-xs font-semibold tracking-wide text-encre-douce uppercase"
      >
        Consultés récemment
      </h2>
      <ul className="flex flex-col gap-0.5">
        {fiches.map((fiche) => {
          const adresse = adresseFiche(fiche)
          const ouverte = pathname === adresse
          return (
            <li key={`${fiche.genre}-${fiche.id}`}>
              <Link
                to={adresse}
                title={fiche.titre}
                aria-current={ouverte ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                  ouverte
                    ? 'bg-surface font-semibold text-encre shadow-xs ring-1 ring-bord'
                    : 'font-medium text-encre-douce hover:bg-creux hover:text-encre'
                }`}
              >
                <Vignette fiche={fiche} />
                <span className="min-w-0 flex-1 truncate">
                  {fiche.titre}
                  <span className="sr-only"> ({libelleGenreFiche(fiche.genre).toLowerCase()})</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
