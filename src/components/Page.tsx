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
  /**
   * Les quatre fiches (Contact, Bien, projet de vente, projet d'achat) : plus larges que les
   * listes sur ordinateur, environ 1150 px (étape E.6), pour que le profil tienne sur une ligne.
   */
  fiche?: boolean
  /** Ligne au-dessus du titre (la date sur l'écran Aujourd'hui). */
  surtitre?: ReactNode
  /** Titre de l'onglet du navigateur, s'il diffère du titre affiché. */
  titreOnglet?: string
  /** Placé à droite du lien de retour (« 12 sur 48 » et les flèches de la fiche Contact). */
  finRetour?: ReactNode
  /**
   * Remplace la ligne du titre : la page y place son propre en-tête, qui porte alors le titre
   * de niveau 1 (`h1`). `null` : pas de ligne de titre, le `h1` est ailleurs dans la page.
   */
  enTete?: ReactNode
  children: ReactNode
}

/** Gabarit de toutes les pages : titre, actions, puis le contenu dans une colonne lisible. */
export default function Page({
  titre,
  retour,
  actions,
  large = false,
  fiche = false,
  surtitre,
  titreOnglet,
  finRetour,
  enTete,
  children,
}: Props) {
  const onglet = titreOnglet ?? titre
  // Le titre de l'onglet (et de l'historique) suit la page affichée.
  useEffect(() => {
    document.title = `${onglet} · ImmoCRM`
    return () => {
      document.title = 'ImmoCRM'
    }
  }, [onglet])
  const largeur = large ? 'max-w-[100rem]' : fiche ? 'max-w-6xl' : 'max-w-5xl'

  return (
    <div className={`mx-auto flex w-full ${largeur} flex-col gap-5 px-4 pt-4 pb-8 md:px-8 md:pt-8`}>
      <header>
        {(retour !== undefined || finRetour !== undefined) && (
          <div className="flex min-h-11 items-center justify-between gap-2">
            {retour !== undefined ? (
              <Link
                to={retour.vers}
                className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-encre-douce hover:bg-creux hover:text-encre focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icone nom="retour" className="size-5" />
                {retour.libelle}
              </Link>
            ) : (
              <span />
            )}
            {finRetour}
          </div>
        )}
        {surtitre}
        {enTete !== undefined ? (
          enTete
        ) : (
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-encre md:text-4xl">
              {titre}
            </h1>
            {actions}
          </div>
        )}
      </header>
      {children}
    </div>
  )
}
