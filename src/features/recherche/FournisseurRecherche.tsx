import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { RecherchePageContexte } from '../../components/recherche-page'
import { formeRecherche } from './forme-recherche'

/** Repère du bandeau de recherche ouvert par la loupe : `ouvrir` y trouve le champ. */
export const ATTRIBUT_BANDEAU = 'data-recherche-bandeau'

/**
 * Tient l'état de la recherche des contacts pour la coquille : la forme qu'elle prend sur la
 * page affichée (`formeRecherche`) et, pour une page à loupe, si elle est ouverte. Changer de
 * page la referme. `BarreRecherche` l'affiche, `Page` montre la loupe, la saisie rapide
 * l'ouvre au clavier (⌘K, Ctrl K, « / ») quand aucun champ n'est visible.
 */
export default function FournisseurRecherche({ children }: { children: ReactNode }) {
  const { pathname, key } = useLocation()
  const loupe = formeRecherche(pathname) === 'loupe'
  const [ouverte, setOuverte] = useState(false)
  const retour = useRef<HTMLElement | null>(null)

  // Une nouvelle page : la recherche ouverte par la loupe se referme.
  const [page, setPage] = useState(key)
  if (page !== key) {
    setPage(key)
    setOuverte(false)
  }

  const ouvrir = useCallback((element?: HTMLElement | null) => {
    retour.current = element ?? null
    // Le bandeau est affiché tout de suite, puis le curseur posé, dans le même geste : l'iPhone
    // ne sort son clavier que pour un champ qui reçoit le curseur pendant le toucher.
    flushSync(() => setOuverte(true))
    const champ = document.querySelector<HTMLInputElement>(
      `[${ATTRIBUT_BANDEAU}] [data-raccourci-recherche]`,
    )
    champ?.focus()
    champ?.select()
  }, [])

  const fermer = useCallback(() => {
    setOuverte(false)
    const element = retour.current
    retour.current = null
    window.requestAnimationFrame(() => {
      if (element?.isConnected === true) element.focus({ preventScroll: true })
    })
  }, [])

  const valeur = useMemo(
    () => ({ loupe, ouverte: loupe && ouverte, ouvrir, fermer }),
    [loupe, ouverte, ouvrir, fermer],
  )
  return <RecherchePageContexte.Provider value={valeur}>{children}</RecherchePageContexte.Provider>
}
