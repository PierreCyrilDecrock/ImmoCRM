import { useState } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import { adresseBien, type Bien } from '../biens/biens'
import SelecteurBien from '../biens/SelecteurBien'
import { nomComplet, type Contact } from '../contacts/contacts'
import SelecteurContact from '../contacts/SelecteurContact'

type Props = {
  /** Titre de la rubrique : « Liée à », « Lié à »… */
  legende: string
  contact: Contact | null
  bien: Bien | null
  /** Lien fixé par la fiche d'où l'on vient : il ne se retire pas ici. */
  verrouiller?: 'contact' | 'bien'
  onContact: (contact: Contact | null) => void
  onBien: (bien: Bien | null) => void
}

const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/**
 * Rubrique d'un formulaire qui lie l'élément saisi (tâche, activité) à un contact et à un
 * bien : chaque lien se choisit par une recherche, s'ouvre d'un toucher et se retire.
 */
export default function ChoixLiens({
  legende,
  contact,
  bien,
  verrouiller,
  onContact,
  onBien,
}: Props) {
  const [choix, setChoix] = useState<'contact' | 'bien' | null>(null)

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-encre">{legende}</legend>
      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <span className="w-16 text-sm text-encre-douce">Contact</span>
        {contact === null ? (
          <Bouton variante="discret" icone="ajouter" onClick={() => setChoix('contact')}>
            Choisir un contact
          </Bouton>
        ) : (
          <>
            <Link to={`/contacts/${contact.id}`} className={`${CLASSES_LIEN} min-w-0 break-words`}>
              {nomComplet(contact)}
            </Link>
            {verrouiller !== 'contact' && (
              <Bouton variante="discret" onClick={() => onContact(null)}>
                Retirer
              </Bouton>
            )}
          </>
        )}
      </div>
      {choix === 'contact' && (
        <SelecteurContact
          libelle="Chercher le contact"
          autoFocus
          onChoisir={(choisi) => {
            onContact(choisi)
            setChoix(null)
          }}
        />
      )}
      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <span className="w-16 text-sm text-encre-douce">Bien</span>
        {bien === null ? (
          <Bouton variante="discret" icone="ajouter" onClick={() => setChoix('bien')}>
            Choisir un bien
          </Bouton>
        ) : (
          <>
            <Link to={`/biens/${bien.id}`} className={`${CLASSES_LIEN} min-w-0 break-words`}>
              {adresseBien(bien)}
            </Link>
            {verrouiller !== 'bien' && (
              <Bouton variante="discret" onClick={() => onBien(null)}>
                Retirer
              </Bouton>
            )}
          </>
        )}
      </div>
      {choix === 'bien' && (
        <SelecteurBien
          libelle="Chercher le bien"
          autoFocus
          onChoisir={(choisi) => {
            onBien(choisi)
            setChoix(null)
          }}
        />
      )}
    </fieldset>
  )
}
