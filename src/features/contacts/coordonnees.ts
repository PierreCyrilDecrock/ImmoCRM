import { adresseComplete, interlocuteur, type Contact } from './contacts'

/**
 * Un lien dans la valeur d'une information (numéro, courriel, fiche liée). Le texte fait 20 px
 * de haut : une zone invisible le prolonge de 12 px au-dessus et au-dessous, pour les 44 px du
 * doigt, sans changer la mise en page (recette D.8).
 */
export const CLASSES_LIEN =
  "relative font-medium text-accent underline-offset-2 before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:underline focus-visible:outline-2 focus-visible:outline-accent"

/** Vrai si la fiche n'a aucune coordonnée (ni numéro, ni courriel, ni adresse, ni personne à joindre). */
export function sansCoordonnees(contact: Contact): boolean {
  return (
    contact.telephones.length + contact.courriels.length === 0 &&
    adresseComplete(contact) === '' &&
    interlocuteur(contact) === ''
  )
}
