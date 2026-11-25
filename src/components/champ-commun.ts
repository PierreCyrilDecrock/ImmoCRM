/** Classes communes à tous les champs : 44 px de haut, texte de 16 px (pas de zoom sur iPhone). */
export const CLASSES_CHAMP =
  'block min-h-11 w-full rounded-lg border border-bord-fort bg-surface px-3 text-base text-encre placeholder:text-encre-douce focus:border-accent focus:outline-2 focus:outline-accent focus-within:border-accent focus-within:outline-2 focus-within:outline-accent aria-invalid:border-danger disabled:opacity-60'

/** Identifiants des textes d'aide et d'erreur d'un champ, pour `aria-describedby`. */
export function descriptionChamp(id: string, aide?: string, erreur?: string): string | undefined {
  const ids = [aide !== undefined && `${id}-aide`, erreur !== undefined && `${id}-erreur`]
  return ids.filter((valeur) => valeur !== false).join(' ') || undefined
}
