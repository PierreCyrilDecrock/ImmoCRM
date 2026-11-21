import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navigation, { type PastilleEntree } from './Navigation'

/**
 * Coquille de l'application une fois connecté : la navigation (en bas sur téléphone,
 * à gauche au-delà), le champ de recherche en haut (ou dans la colonne, sur ordinateur) et
 * la page en cours, seule zone qui défile.
 */
type Props = {
  /** Bandeau fixe au-dessus de la page (le champ de recherche), sur téléphone et tablette. */
  enTete?: ReactNode
  /**
   * Ce que la colonne de gauche ajoute sur ordinateur : la recherche (qui y remplace le
   * bandeau du haut), un bloc sous les entrées (fiches récentes) et le bas de la colonne
   * (« Créer », état des enregistrements, version).
   */
  colonne?: { recherche?: ReactNode; suite?: ReactNode; pied?: ReactNode }
  /** Pastilles des entrées de la navigation, rangées par adresse. */
  pastilles?: Readonly<Partial<Record<string, PastilleEntree>>>
  /**
   * Élément posé par-dessus la page, en bas à droite (le bouton « + » de la saisie rapide,
   * sur téléphone et tablette). Il reçoit de quoi faire relire la page affichée après une
   * création.
   */
  flottant?: (rafraichir: () => void) => ReactNode
}

export default function MiseEnPage({ enTete, colonne, pastilles, flottant }: Props) {
  const { pathname } = useLocation()
  const contenu = useRef<HTMLElement>(null)
  // Changer ce numéro recrée la page affichée : elle relit ses données.
  const [version, setVersion] = useState(0)
  // Sur ordinateur, la recherche est dans la colonne : le bandeau du haut disparaît.
  const bandeauSurOrdinateur = colonne?.recherche === undefined

  // Chaque nouvelle page s'ouvre en haut, pas là où la précédente avait défilé.
  useEffect(() => {
    contenu.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <Navigation
        recherche={colonne?.recherche}
        suite={colonne?.suite}
        pied={colonne?.pied}
        pastilles={pastilles}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {enTete !== undefined && (
          <div className={bandeauSurOrdinateur ? undefined : 'lg:hidden'}>{enTete}</div>
        )}
        {/*
          « relative » : les textes réservés aux lecteurs d'écran (« sr-only », placés en
          absolu) restent dans la zone qui défile, au lieu d'allonger tout le document (ce qui
          créait un second défilement et un grand vide sous l'application).
          Marge du bas : la fin de la page défile au-dessus du bouton flottant (sa hauteur et
          son écart au bord : 4,75 rem sur téléphone, 5,75 rem sur tablette). Sur ordinateur,
          le bouton laisse sa place à « Créer », dans la colonne : plus de marge.
        */}
        <main
          ref={contenu}
          className={`relative min-h-0 flex-1 overflow-y-auto ${flottant !== undefined ? `pb-20 md:pb-24 ${colonne?.pied === undefined ? '' : 'lg:pb-0'}` : ''}`}
        >
          <Outlet key={version} />
        </main>
        {flottant?.(() => setVersion((actuelle) => actuelle + 1))}
      </div>
    </div>
  )
}
