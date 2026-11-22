import Carte from '../../components/Carte'
import Etiquette from '../../components/Etiquette'
import LigneListe from '../../components/LigneListe'
import { genreStatut, libelleStatut, resumeBien } from '../biens/biens'
import { formaterQuotePart, type BienDuContact } from '../biens/proprietaires'

/** Rubrique « Biens » de la fiche Contact : les biens dont il est propriétaire. */
export default function BiensContact({ biens }: { biens: readonly BienDuContact[] }) {
  return (
    <Carte titre="Biens">
      {biens.length === 0 ? (
        <p className="text-sm text-encre-douce">
          Les biens dont ce contact est propriétaire s'afficheront ici. Le lien se fait depuis la
          fiche du bien, rubrique « Propriétaires ».
        </p>
      ) : (
        // `min-w-0` du parent : une adresse longue est coupée au lieu d'élargir la page.
        <ul className="-mx-4 -mb-2 divide-y divide-bord">
          {biens.map(({ lien, bien }) => (
            <LigneListe
              key={lien.id}
              titre={bien.adresse}
              detail={[
                resumeBien(bien),
                lien.quote_part === null ? null : formaterQuotePart(lien.quote_part),
                bien.archived_at !== null ? 'archivé' : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              fin={
                <Etiquette genre={genreStatut(bien.statut)}>{libelleStatut(bien.statut)}</Etiquette>
              }
              vers={`/biens/${bien.id}`}
            />
          ))}
        </ul>
      )}
    </Carte>
  )
}
