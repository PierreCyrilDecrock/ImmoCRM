import Information from '../../components/Information'
import { formaterDate } from '../../lib/dates'
import { libelleMotifAppel, resumeAccord, type AppelSansAccord } from './consentement'
import type { Contact } from './contacts'

type Props = {
  contact: Contact
  /** Les appels passés sans accord, les plus récents d'abord. */
  appels: readonly AppelSansAccord[]
  empilee?: boolean
}

/**
 * Le détail du consentement et des données personnelles : l'accord pour être appelé et sa
 * preuve, client existant, opposition au démarchage, collecte des données, dernier contact,
 * appels passés sans accord (avec leur motif). À placer dans une liste `<dl>`.
 */
export default function ConsentementContact({ contact, appels, empilee = false }: Props) {
  return (
    <>
      <Information nom="Accord pour être appelé" empilee={empilee}>
        {resumeAccord(contact)}
        {contact.accord_appel_preuve !== '' && (
          <span className="block text-sm text-encre-douce">{contact.accord_appel_preuve}</span>
        )}
      </Information>
      {contact.client_existant && (
        <Information nom="Client existant" empilee={empilee}>
          Oui
        </Information>
      )}
      {contact.opposition_demarchage && (
        <Information nom="Démarchage" empilee={empilee}>
          S'y oppose
          {contact.opposition_demarchage_date !== null &&
            ` depuis le ${formaterDate(contact.opposition_demarchage_date)}`}
        </Information>
      )}
      <Information nom="Données collectées" empilee={empilee}>
        Le {formaterDate(contact.collecte_date)}
        {contact.collecte_origine !== '' && (
          <span className="block text-sm text-encre-douce">{contact.collecte_origine}</span>
        )}
      </Information>
      <Information nom="Dernier contact" empilee={empilee}>
        Le {formaterDate(contact.dernier_contact_le)}
      </Information>
      {appels.length > 0 && (
        <Information nom="Appels sans accord" empilee={empilee}>
          <ul className="flex flex-col gap-1">
            {appels.map((appel) => (
              <li key={appel.id}>
                {formaterDate(appel.created_at)} — {libelleMotifAppel(appel.motif)}
                {appel.detail !== '' && (
                  <span className="block text-sm text-encre-douce">{appel.detail}</span>
                )}
              </li>
            ))}
          </ul>
        </Information>
      )}
    </>
  )
}
