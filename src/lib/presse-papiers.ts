/** Ce dont la copie a besoin du presse-papiers du navigateur. */
export type PressePapiers = { writeText: (texte: string) => Promise<void> }

/** Le presse-papiers du navigateur, s'il en offre un (absent hors connexion sécurisée). */
function pressePapiersDuNavigateur(): PressePapiers | null {
  // `clipboard` manque dans une page servie sans connexion sécurisée (http://).
  return typeof navigator === 'undefined' ? null : (navigator.clipboard ?? null)
}

/**
 * Copie un texte dans le presse-papiers. Renvoie `false` si le navigateur n'en offre pas ou
 * refuse la copie (autorisation, page en arrière-plan) : l'appelant le dit à l'utilisateur.
 */
export async function copierTexte(
  texte: string,
  pressePapiers: PressePapiers | null = pressePapiersDuNavigateur(),
): Promise<boolean> {
  if (pressePapiers === null) return false
  try {
    await pressePapiers.writeText(texte)
    return true
  } catch {
    return false
  }
}
