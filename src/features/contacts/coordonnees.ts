import { adresseComplete, interlocuteur, type Contact } from './contacts'

/** Un lien dans la valeur d'une information (numéro, courriel, fiche liée). */
export const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/** Vrai si la fiche n'a aucune coordonnée (ni numéro, ni courriel, ni adresse, ni personne à joindre). */
export function sansCoordonnees(contact: Contact): boolean {
  return (
    contact.telephones.length + contact.courriels.length === 0 &&
    adresseComplete(contact) === '' &&
    interlocuteur(contact) === ''
  )
}
