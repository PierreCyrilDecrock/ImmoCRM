import LienAction from '../../components/LienAction'
import { lienItineraire, type Cartes } from '../aujourdhui/journee'
import { adresseComplete, type Contact } from './contacts'
import { estPortable, lienSms } from './telephone'

type Props = {
  contact: Contact
  /**
   * Le lien d'appel quand l'appel est permis (accord enregistré, ou motif noté pour cette
   * visite) ; absent, Appeler est grisé, comme sans numéro.
   */
  lienAppel?: string
  /** Pour l'appel bloqué : pourquoi, lu par les lecteurs d'écran. */
  annonceAppel?: string
  cartes: Cartes
}

/**
 * Les quatre touches du profil : Appeler (bleue, seulement si l'appel est permis), SMS (au
 * portable s'il y en a un), Courriel et Itinéraire (jusqu'à l'adresse du contact). Une
 * touche sans numéro ou sans adresse reste visible, grisée.
 */
export default function ActionsContact({ contact, lienAppel, annonceAppel, cartes }: Props) {
  const portable = contact.telephones.find(estPortable) ?? contact.telephones[0]
  const courriel = contact.courriels[0]
  const adresse = adresseComplete(contact)
  return (
    <div className="flex gap-2">
      <LienAction libelle="Appeler" icone="telephone" href={lienAppel} annonce={annonceAppel} />
      <LienAction
        libelle="SMS"
        icone="sms"
        variante="secondaire"
        href={portable === undefined ? undefined : lienSms(portable)}
      />
      <LienAction
        libelle="Courriel"
        icone="courriel"
        variante="secondaire"
        href={courriel === undefined ? undefined : `mailto:${courriel}`}
      />
      <LienAction
        libelle="Itinéraire"
        icone="itineraire"
        variante="secondaire"
        nouvelOnglet
        href={adresse === '' ? undefined : lienItineraire(adresse, cartes)}
      />
    </div>
  )
}
