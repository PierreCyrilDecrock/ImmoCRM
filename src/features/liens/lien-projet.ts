/**
 * Lien d'une tâche ou d'une activité vers un projet : un projet de vente (projet vendeur)
 * ou un projet d'achat (projet acquéreur). Une ligne est liée à un projet au plus ; la base
 * le vérifie aussi.
 */

export type GenreProjet = 'vendeur' | 'acquereur'

export type LienProjet = { genre: GenreProjet; id: string }

/** Les deux colonnes de lien d'une tâche ou d'une activité. */
export type ColonnesProjet = {
  projet_vendeur_id: string | null
  projet_acquereur_id: string | null
}

/** Le projet auquel une ligne est liée, ou `null`. */
export function lienProjetDe(ligne: ColonnesProjet): LienProjet | null {
  if (ligne.projet_vendeur_id !== null) return { genre: 'vendeur', id: ligne.projet_vendeur_id }
  if (ligne.projet_acquereur_id !== null) {
    return { genre: 'acquereur', id: ligne.projet_acquereur_id }
  }
  return null
}

/** Les colonnes à enregistrer pour ce lien : l'une remplie, l'autre vide. */
export function colonnesProjet(lien: LienProjet | null): ColonnesProjet {
  return {
    projet_vendeur_id: lien?.genre === 'vendeur' ? lien.id : null,
    projet_acquereur_id: lien?.genre === 'acquereur' ? lien.id : null,
  }
}

/** L'adresse de la fiche du projet dans l'application. */
export function adresseProjet(lien: LienProjet): string {
  return `/pipelines/${lien.genre === 'vendeur' ? 'vendeurs' : 'acquereurs'}/${lien.id}`
}

/** « Projet de vente », « Projet d'achat ». */
export function libelleGenreProjet(genre: GenreProjet): string {
  return genre === 'vendeur' ? 'Projet de vente' : 'Projet d’achat'
}
