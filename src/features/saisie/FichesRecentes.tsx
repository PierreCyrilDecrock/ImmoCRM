import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import { adresseFiche, iconeFiche, libelleGenreFiche, type FicheRecente } from './recents'

type Props = {
  fiches: readonly FicheRecente[]
  /** Appelé au toucher d'une fiche, juste avant d'ouvrir sa page (pour fermer un menu). */
  onOuvrir?: () => void
}

/** Les fiches consultées récemment : un toucher rouvre la fiche. */
export default function FichesRecentes({ fiches, onOuvrir }: Props) {
  return (
    // Le toucher d'un lien remonte jusqu'ici : le menu qui contient la liste se ferme.
    <div onClickCapture={onOuvrir}>
      <Liste>
        {fiches.map((fiche) => (
          <LigneListe
            key={`${fiche.genre}-${fiche.id}`}
            icone={iconeFiche(fiche.genre)}
            titre={fiche.titre}
            detail={[libelleGenreFiche(fiche.genre), fiche.detail]
              .filter((morceau) => morceau !== '')
              .join(' · ')}
            vers={adresseFiche(fiche)}
          />
        ))}
      </Liste>
    </div>
  )
}
