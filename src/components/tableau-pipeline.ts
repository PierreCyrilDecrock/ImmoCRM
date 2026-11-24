/**
 * Tableau d'un pipeline sur téléphone : les étapes vides se replient en une ligne de
 * pastilles (« Estimation 0 », « Suivi 0 »…) ; les étapes qui ont des projets gardent leur
 * titre, leur critère et leurs cartes. L'ordre des étapes est gardé dans chaque groupe.
 */
export function separerEtapes<C extends { projets: readonly unknown[] }>(
  colonnes: readonly C[],
): { pleines: C[]; vides: C[] } {
  return {
    pleines: colonnes.filter((colonne) => colonne.projets.length > 0),
    vides: colonnes.filter((colonne) => colonne.projets.length === 0),
  }
}

/**
 * L'étape vide dont le critère est montré après un toucher sur `touchee` : une seule à la
 * fois ; toucher de nouveau la même pastille cache son critère.
 */
export function basculerCritere<E extends string>(montree: E | null, touchee: E): E | null {
  return montree === touchee ? null : touchee
}
