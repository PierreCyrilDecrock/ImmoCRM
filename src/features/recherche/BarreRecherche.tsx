import { useLocation } from 'react-router-dom'
import RechercheGlobale, { type DispositionRecherche } from './RechercheGlobale'

type Props = {
  disposition?: DispositionRecherche
}

/**
 * Recherche de toutes les pages. En bandeau (téléphone, tablette), la liste des contacts
 * fait exception : elle a son propre champ, relié à ses filtres. Dans la colonne de gauche
 * (ordinateur), elle reste sur toutes les pages, comme le reste de la colonne.
 */
export default function BarreRecherche({ disposition = 'bandeau' }: Props) {
  const { pathname, key } = useLocation()
  if (disposition === 'bandeau' && pathname === '/contacts') return null
  // Une nouvelle page : le champ repart vide et ses résultats se referment.
  return <RechercheGlobale key={key} disposition={disposition} />
}
