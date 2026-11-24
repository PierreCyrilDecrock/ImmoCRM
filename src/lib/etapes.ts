/**
 * Étapes d'un projet, pour les afficher en barre : celles déjà passées, celle en cours,
 * celles à venir. Règles communes aux pipelines vendeur et acquéreur.
 */

export type EtatEtape = 'passee' | 'en_cours' | 'a_venir'

export type EtapeAffichee<V extends string> = { valeur: V; libelle: string; etat: EtatEtape }

/**
 * Chaque étape avec son état par rapport à l'étape `courante`. `terminee` : le projet est
 * allé au bout (mandat signé, offre acceptée) ; toutes les étapes sont alors passées.
 */
export function etatsEtapes<V extends string>(
  etapes: readonly { valeur: V; libelle: string }[],
  courante: string,
  terminee = false,
): EtapeAffichee<V>[] {
  const rang = etapes.findIndex((etape) => etape.valeur === courante)
  return etapes.map(({ valeur, libelle }, indice) => ({
    valeur,
    libelle,
    etat:
      terminee || indice < rang ? 'passee' : indice === rang ? 'en_cours' : ('a_venir' as const),
  }))
}

/** « a », « a et b », « a, b et c ». Les doublons ne sont écrits qu'une fois. */
export function listeEnFrancais(elements: readonly string[]): string {
  const uniques = [...new Set(elements)]
  if (uniques.length <= 1) return uniques.join('')
  return `${uniques.slice(0, -1).join(', ')} et ${uniques.at(-1) ?? ''}`
}

/** La première lettre en minuscule : « Avis de valeur remis » → « avis de valeur remis ». */
export function minusculeInitiale(texte: string): string {
  return texte.charAt(0).toLocaleLowerCase('fr') + texte.slice(1)
}

/**
 * La phrase sous la barre : « Pour passer à l'étape suivante (Estimation) : projet, délai,
 * motif. » `critere` est le critère de sortie de l'étape en cours.
 */
export function phrasePassage(suivante: string, critere: string): string {
  return `Pour passer à l’étape suivante (${suivante}) : ${minusculeInitiale(critere)}.`
}

/** « Il manque le motif de la vente et le délai souhaité. » Vide si rien ne manque. */
export function phraseManque(manquantes: readonly string[]): string {
  return manquantes.length === 0 ? '' : `Il manque ${listeEnFrancais(manquantes)}.`
}

/** Un critère de sortie dans la liste « Pour passer à … » : acquis (coche verte) ou manquant. */
export type CritereSortie = { libelle: string; acquis: boolean }

/**
 * La liste « Pour passer à … » d'après les informations que demande l'étape suivante, dans
 * l'ordre des étapes. `propre` : l'information est demandée pour la première fois par cette
 * étape (elle s'affiche toujours) ; les autres, d'étapes déjà franchies, ne s'affichent que si
 * elles manquent encore. Deux informations de même libellé (estimation basse et haute) n'en
 * font qu'une, acquise seulement si les deux le sont.
 */
export function listeCriteres(
  informations: readonly { libelle: string; acquis: boolean; propre: boolean }[],
): CritereSortie[] {
  const parLibelle = new Map<string, boolean>()
  for (const { libelle, acquis, propre } of informations) {
    if (!propre && acquis && !parLibelle.has(libelle)) continue
    parLibelle.set(libelle, (parLibelle.get(libelle) ?? true) && acquis)
  }
  return [...parLibelle].map(([libelle, acquis]) => ({ libelle, acquis }))
}

/** Le titre de la liste des critères : « Pour passer à Estimation ». */
export function titrePassage(suivante: string): string {
  return `Pour passer à ${suivante}`
}
