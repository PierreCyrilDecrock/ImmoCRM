import { Link } from 'react-router-dom'
import Information from '../../components/Information'
import { libelleSource, nomComplet, type Contact } from './contacts'
import { CLASSES_LIEN } from './coordonnees'

type PropsOrigine = {
  contact: Contact
  /** La fiche de la personne qui l'a recommandé, si elle a pu être lue. */
  recommandePar: Contact | null
  empilee?: boolean
}

/** L'origine du contact : sa source, son détail, et qui l'a recommandé. À placer dans un `<dl>`. */
export default function LignesOrigine({ contact, recommandePar, empilee = false }: PropsOrigine) {
  const source = libelleSource(contact.source)
  return (
    <>
      <Information nom="Origine" empilee={empilee}>
        {source ?? <span className="text-encre-douce">Source non précisée</span>}
        {contact.source_detail !== '' && (
          <span className="block text-sm text-encre-douce">{contact.source_detail}</span>
        )}
      </Information>
      {recommandePar !== null && (
        <Information nom="Recommandé par" empilee={empilee}>
          <Link to={`/contacts/${recommandePar.id}`} className={CLASSES_LIEN}>
            {nomComplet(recommandePar)}
          </Link>
        </Information>
      )}
    </>
  )
}
