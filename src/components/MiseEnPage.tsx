import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BarreBasContexte } from './barre-bas'
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
  // La place d'une barre d'actions de fiche, sous la page sur téléphone, et le nombre de
  // barres qui l'occupent (une seule à la fois ; le compte évite un clignotement entre deux).
  const [cibleBarre, setCibleBarre] = useState<HTMLElement | null>(null)
  const [barres, setBarres] = useState(0)
  const occuper = useCallback((presente: boolean) => {
    setBarres((actuel) => Math.max(0, actuel + (presente ? 1 : -1)))
  }, [])
  const barreBas = useMemo(
    () => ({ cible: cibleBarre, occuper, occupee: barres > 0 }),
    [cibleBarre, occuper, barres],
  )

  // Chaque nouvelle page s'ouvre en haut, pas là où la précédente avait défilé.
  useEffect(() => {
    contenu.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <BarreBasContexte.Provider value={barreBas}>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Navigation
          recherche={colonne?.recherche}
          suite={colonne?.suite}
          pied={colonne?.pied}
          pastilles={pastilles}
          cacheeSurTelephone={barreBas.occupee}
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
            le bouton laisse sa place à « Créer », dans la colonne : plus de marge. Sur
            téléphone, une barre d'actions de fiche remplace le bouton : plus de marge non plus.
          */}
          <main
            ref={contenu}
            className={`relative min-h-0 flex-1 overflow-y-auto ${flottant !== undefined ? `${barreBas.occupee ? 'md:pb-24' : 'pb-20 md:pb-24'} ${colonne?.pied === undefined ? '' : 'lg:pb-0'}` : ''}`}
          >
            <Outlet key={version} />
          </main>
          {flottant?.(() => setVersion((actuelle) => actuelle + 1))}
        </div>
        {/* Sur téléphone, la barre d'actions d'une fiche, à la place de la navigation. */}
        <div ref={setCibleBarre} className="order-last md:hidden" />
      </div>
    </BarreBasContexte.Provider>
  )
}
