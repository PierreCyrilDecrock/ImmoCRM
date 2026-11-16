import { useState } from 'react'
import Bouton from '../../components/Bouton'
import ChampSaisie from '../../components/ChampSaisie'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { exigerSupabase } from '../../lib/supabase'
import { nomComplet, supprimerContactDefinitivement, type Contact } from './contacts'

type Props = {
  contact: Contact
  onFermer: () => void
  /** Appelé une fois la fiche supprimée de la base. */
  onSupprime: () => void
}

/** Le mot à recopier pour la seconde confirmation. */
const MOT_DE_CONFIRMATION = 'SUPPRIMER'

/**
 * Suppression définitive d'un contact (droit à l'effacement), en deux confirmations :
 * d'abord l'explication de ce qui disparaît, puis un mot à recopier.
 * La fenêtre n'existe que le temps de la demande : elle repart de zéro à chaque ouverture.
 */
export default function SuppressionContact({ contact, onFermer, onSupprime }: Props) {
  const [etape, setEtape] = useState<1 | 2>(1)
  const [saisie, setSaisie] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [echec, setEchec] = useState<string | null>(null)
  const nom = nomComplet(contact)
  const confirme = saisie.trim().toUpperCase() === MOT_DE_CONFIRMATION

  async function supprimer() {
    setEnvoi(true)
    setEchec(null)
    const resultat = await supprimerContactDefinitivement(exigerSupabase(), contact.id)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`La suppression a échoué : rien n'a été supprimé. ${resultat.erreur.message}`)
      return
    }
    onSupprime()
  }

  return (
    <FenetreModale
      ouverte
      titre={etape === 1 ? 'Supprimer définitivement ?' : 'Dernière confirmation'}
      onFermer={onFermer}
      pied={
        etape === 1 ? (
          <>
            <Bouton variante="danger" pleineLargeur onClick={() => setEtape(2)}>
              Continuer
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
              Annuler
            </Bouton>
          </>
        ) : (
          <>
            <Bouton
              variante="danger"
              pleineLargeur
              disabled={!confirme || envoi}
              onClick={() => void supprimer()}
            >
              {envoi ? 'Suppression…' : 'Supprimer définitivement'}
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
              Annuler
            </Bouton>
          </>
        )
      }
    >
      {etape === 1 ? (
        <div className="flex flex-col gap-3 text-base text-encre">
          <p>
            Vous allez effacer de la base tout ce qui concerne <strong>{nom}</strong> :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>sa fiche : coordonnées, notes, origine et consentement ;</li>
            <li>l'historique de ses appels passés sans accord ;</li>
            <li>les anciennes fiches en double fusionnées dans celle-ci.</li>
          </ul>
          <p>
            Cette suppression répond à une demande d'effacement. Elle ne peut pas être annulée :
            aucune restauration n'est possible. Pour simplement retirer la fiche de la liste,
            préférez « Archiver ».
          </p>
          <p className="text-sm text-encre-douce">
            Conseil : exportez d'abord ses données si vous devez garder la trace de la demande.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-base text-encre">
            Pour supprimer définitivement la fiche de <strong>{nom}</strong>, tapez le mot{' '}
            <strong>{MOT_DE_CONFIRMATION}</strong> ci-dessous.
          </p>
          <ChampSaisie
            libelle={`Tapez ${MOT_DE_CONFIRMATION} pour confirmer`}
            value={saisie}
            onChange={(evenement) => setSaisie(evenement.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          {echec !== null && <Message genre="erreur">{echec}</Message>}
        </div>
      )}
    </FenetreModale>
  )
}
