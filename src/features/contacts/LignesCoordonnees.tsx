import BoutonCopier from '../../components/BoutonCopier'
import Information from '../../components/Information'
import { adresseComplete, interlocuteur, type Contact } from './contacts'
import { CLASSES_LIEN } from './coordonnees'
import { formaterTelephone, lienAppel } from './telephone'

type PropsCoordonnees = {
  contact: Contact
  /** L'appel est permis : les numéros se composent d'un toucher. */
  appelPermis: boolean
  /** Le nom au-dessus de la valeur (colonne étroite du profil). */
  empilee?: boolean
}

/**
 * Les coordonnées, chacune avec « Copier » : la personne à joindre (société), les numéros
 * (à composer d'un toucher si l'appel est permis), les courriels, l'adresse. À placer dans
 * une liste `<dl>`.
 */
export default function LignesCoordonnees({
  contact,
  appelPermis,
  empilee = false,
}: PropsCoordonnees) {
  const adresse = adresseComplete(contact)
  const joindre = interlocuteur(contact)
  return (
    <>
      {joindre !== '' && (
        <Information nom="Personne à joindre" empilee={empilee}>
          {joindre}
        </Information>
      )}
      {contact.telephones.map((numero, rang) => (
        <Information
          key={numero}
          nom={rang === 0 ? 'Téléphone' : `Téléphone ${rang + 1}`}
          empilee={empilee}
          fin={<BoutonCopier valeur={formaterTelephone(numero)} quoi="le numéro" />}
        >
          {appelPermis ? (
            <a href={lienAppel(numero)} className={CLASSES_LIEN}>
              {formaterTelephone(numero)}
            </a>
          ) : (
            formaterTelephone(numero)
          )}
        </Information>
      ))}
      {contact.courriels.map((adresseCourriel, rang) => (
        <Information
          key={adresseCourriel}
          nom={rang === 0 ? 'Courriel' : `Courriel ${rang + 1}`}
          empilee={empilee}
          fin={<BoutonCopier valeur={adresseCourriel} quoi="le courriel" />}
        >
          <a href={`mailto:${adresseCourriel}`} className={`${CLASSES_LIEN} break-all`}>
            {adresseCourriel}
          </a>
        </Information>
      ))}
      {adresse !== '' && (
        <Information
          nom="Adresse"
          empilee={empilee}
          fin={<BoutonCopier valeur={adresse} quoi="l'adresse" />}
        >
          {adresse}
        </Information>
      )}
    </>
  )
}
