import { useLocation } from 'react-router-dom'
import { useRecherchePage } from '../../components/recherche-page'
import { formeRecherche } from './forme-recherche'
import { ATTRIBUT_BANDEAU } from './FournisseurRecherche'
import RechercheGlobale, { type DispositionRecherche } from './RechercheGlobale'

type Props = {
  disposition?: DispositionRecherche
}

/**
 * Recherche des contacts de la coquille. Dans la colonne de gauche (ordinateur), elle reste
 * sur toutes les pages, comme le reste de la colonne. En bandeau (téléphone, tablette), une
 * seule recherche par écran (étape F.3) : la barre reste en haut de l'accueil ; la liste des
 * contacts a son propre champ ; ailleurs, elle n'apparaît que si la loupe de la page l'ouvre,
 * avec « Fermer » pour la refermer.
 */
export default function BarreRecherche({ disposition = 'bandeau' }: Props) {
  const { pathname, key } = useLocation()
  const { ouverte, fermer } = useRecherchePage()
  // Une nouvelle page : le champ repart vide et ses résultats se referment.
  if (disposition === 'colonne') return <RechercheGlobale key={key} disposition="colonne" />
  const forme = formeRecherche(pathname)
  if (forme === 'aucune' || (forme === 'loupe' && !ouverte)) return null
  return (
    <div {...{ [ATTRIBUT_BANDEAU]: '' }}>
      <RechercheGlobale
        key={key}
        disposition="bandeau"
        onFermer={forme === 'loupe' ? fermer : undefined}
      />
    </div>
  )
}
