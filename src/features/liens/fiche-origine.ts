import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import type { LienFiche } from './fiches-liees'
import type { LienProjet } from './lien-projet'

/**
 * Un projet (de vente ou d'achat) qui accueille une rubrique : son lien, son contact
 * principal et, s'il en a un, son bien.
 */
export type ProjetOrigine = { lien: LienProjet; contact: Contact | null; bien: Bien | null }

/**
 * La fiche qui accueille une rubrique Tâches ou Journal : un contact, un bien ou un projet.
 * Les rubriques en déduisent ce qu'elles lisent et ce qu'elles préremplissent.
 */
export type FicheOrigine =
  | { contact: Contact; bien?: undefined; projet?: undefined }
  | { bien: Bien; contact?: undefined; projet?: undefined }
  | { projet: ProjetOrigine; contact?: undefined; bien?: undefined }

/** Les lignes à lire : celles liées à cette fiche. */
export function lienDeFiche(fiche: FicheOrigine): LienFiche {
  if (fiche.contact !== undefined) return { contactId: fiche.contact.id }
  if (fiche.bien !== undefined) return { bienId: fiche.bien.id }
  const { lien } = fiche.projet
  return lien.genre === 'vendeur' ? { projetVendeurId: lien.id } : { projetAcquereurId: lien.id }
}

/** Les liens d'une nouvelle tâche ou activité créée depuis cette fiche. */
export function liensDeFiche(fiche: FicheOrigine): {
  contact?: Contact | null
  bien?: Bien | null
  projet?: LienProjet | null
} {
  if (fiche.contact !== undefined) return { contact: fiche.contact }
  if (fiche.bien !== undefined) return { bien: fiche.bien }
  // Depuis un projet : son contact et son bien, en plus du projet lui-même.
  return { contact: fiche.projet.contact, bien: fiche.projet.bien, projet: fiche.projet.lien }
}

/** Le lien qui ne se change pas dans le formulaire ouvert depuis cette fiche. */
export function verrouDeFiche(fiche: FicheOrigine): 'contact' | 'bien' | 'projet' {
  if (fiche.contact !== undefined) return 'contact'
  if (fiche.bien !== undefined) return 'bien'
  return 'projet'
}

/** Ce qu'il est inutile de répéter sur chaque ligne de la rubrique. */
export function masqueDeFiche(fiche: FicheOrigine): 'contact' | 'bien' | undefined {
  if (fiche.contact !== undefined) return 'contact'
  if (fiche.bien !== undefined) return 'bien'
  return undefined
}
