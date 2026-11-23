import { droitAppel } from '../contacts/consentement'
import { nomComplet, type Contact } from '../contacts/contacts'
import { lienAppel } from '../contacts/telephone'

/**
 * La touche « Appeler » d'une fiche Bien ou Projet (barre du bas sur téléphone, étape D.7) :
 * elle appelle une personne liée à la fiche (le propriétaire, le vendeur, l'acquéreur).
 */
export type AppelFiche = {
  /** Absent : la touche est grisée (aucun numéro, ou pas d'accord pour être appelé). */
  lien?: string
  /** Ce qu'entend un lecteur d'écran : qui est appelé, ou pourquoi la touche est grisée. */
  annonce: string
}

/**
 * Appelle la première des personnes qui accepte d'être appelée et qui a un numéro. Sinon la
 * touche reste grisée, avec la raison ; l'avertissement et le motif d'un appel passé outre
 * sont sur la fiche du contact. `personne` : ce qu'on dit quand il n'y a personne (« aucun
 * propriétaire lié »).
 */
export function appelFiche(contacts: readonly Contact[], personne: string): AppelFiche {
  const joignable = contacts.find(
    (contact) => contact.telephones[0] !== undefined && droitAppel(contact).autorise,
  )
  const numero = joignable?.telephones[0]
  if (joignable !== undefined && numero !== undefined) {
    return { lien: lienAppel(numero), annonce: `Appeler ${nomComplet(joignable)}` }
  }
  if (contacts.length === 0) return { annonce: `Appeler : ${personne}` }
  if (contacts.every((contact) => contact.telephones.length === 0)) {
    return { annonce: 'Appeler : aucun numéro' }
  }
  return { annonce: 'Appel bloqué : aucun accord pour être appelé' }
}
