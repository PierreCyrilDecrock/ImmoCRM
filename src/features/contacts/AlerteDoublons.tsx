import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import { nomDeListe, resumeContact, type Contact, type ValeursContact } from './contacts'
import { libelleMotifs, motifsDoublon } from './doublons'

type Props = {
  doublons: readonly Contact[]
  /** Ce qu'on allait créer : sert à dire ce qui ressemble (même téléphone, nom proche…). */
  valeurs: ValeursContact | null
}

/**
 * Avant de créer un contact : les fiches qui lui ressemblent. Toucher une fiche l'ouvre ;
 * le bouton d'enregistrement devient « Créer quand même ». À placer en tête de fenêtre,
 * pour qu'elle soit visible sans faire défiler.
 */
export default function AlerteDoublons({ doublons, valeurs }: Props) {
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-alerte-doux p-3">
      <p className="text-base font-semibold text-encre">
        {doublons.length > 1
          ? 'Ces fiches existent peut-être déjà'
          : 'Cette fiche existe peut-être déjà'}
      </p>
      <Liste>
        {doublons.map((doublon) => (
          <LigneListe
            key={doublon.id}
            titre={nomDeListe(doublon)}
            detail={[
              valeurs !== null ? libelleMotifs(motifsDoublon(valeurs, doublon)) : null,
              resumeContact(doublon),
              doublon.archived_at !== null ? 'archivée' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            vers={`/contacts/${doublon.id}`}
          />
        ))}
      </Liste>
      <p className="text-sm text-encre">
        Touchez une fiche pour l'ouvrir. Si c'est bien une autre personne, touchez « Créer quand
        même ».
      </p>
    </div>
  )
}
