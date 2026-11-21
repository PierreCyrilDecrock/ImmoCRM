import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icone from './Icone'

type Props = {
  titre: string
  /** Pour une sous-page : lien de retour vers la page parente. */
  retour?: { vers: string; libelle: string }
  /** Boutons affichés à droite du titre. */
  actions?: ReactNode
  /** Page qui a besoin de toute la largeur de l'écran (le tableau des pipelines). */
  large?: boolean
  children: ReactNode
}

/** Gabarit de toutes les pages : titre, actions, puis le contenu dans une colonne lisible. */
export default function Page({ titre, retour, actions, large = false, children }: Props) {
  // Le titre de l'onglet (et de l'historique) suit la page affichée.
  useEffect(() => {
    document.title = `${titre} · ImmoCRM`
    return () => {
      document.title = 'ImmoCRM'
    }
  }, [titre])

  return (
    <div
      className={`mx-auto flex w-full ${large ? 'max-w-[100rem]' : 'max-w-5xl'} flex-col gap-5 px-4 pt-4 pb-8 md:px-8 md:pt-8`}
    >
      <header>
        {retour !== undefined && (
          <Link
            to={retour.vers}
            className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-encre-douce hover:bg-creux hover:text-encre focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Icone nom="retour" className="size-5" />
            {retour.libelle}
          </Link>
        )}
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-encre md:text-4xl">
            {titre}
          </h1>
          {actions}
        </div>
      </header>
      {children}
    </div>
  )
}
