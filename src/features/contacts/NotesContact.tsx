import Carte from '../../components/Carte'
import Etiquette from '../../components/Etiquette'
import type { Contact } from './contacts'

/**
 * « À savoir » : les étiquettes et les notes du contact, ce qu'on relit avant de l'appeler.
 * Rien n'est affiché si la fiche n'en a pas.
 */
export default function NotesContact({ contact }: { contact: Contact }) {
  if (contact.notes === '' && contact.etiquettes.length === 0) return null
  return (
    <Carte titre="À savoir">
      <div className="flex flex-col gap-3">
        {contact.etiquettes.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Étiquettes">
            {contact.etiquettes.map((etiquette) => (
              <li key={etiquette}>
                <Etiquette>{etiquette}</Etiquette>
              </li>
            ))}
          </ul>
        )}
        {contact.notes !== '' && (
          <p className="text-base break-words whitespace-pre-wrap text-encre">{contact.notes}</p>
        )}
      </div>
    </Carte>
  )
}
