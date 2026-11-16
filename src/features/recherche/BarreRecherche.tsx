import { useLocation } from 'react-router-dom'
import RechercheGlobale from './RechercheGlobale'

/**
 * Bandeau de recherche affiché en haut de toutes les pages. La liste des contacts fait
 * exception : elle a son propre champ de recherche, relié à ses filtres.
 */
export default function BarreRecherche() {
  const { pathname, key } = useLocation()
  if (pathname === '/contacts') return null
  // Une nouvelle page : le champ repart vide et ses résultats se referment.
  return <RechercheGlobale key={key} />
}
