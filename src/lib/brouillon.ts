/**
 * Un brouillon de formulaire a-t-il changé depuis son ouverture ? (recette D.8, règle 2 de la
 * revue de design : un bouton d'enregistrement ne passe au bleu que quand il y a quelque chose
 * à enregistrer.) Comparaison de valeur, indépendante de l'ordre des clés ; un champ vidé puis
 * réécrit à l'identique ne compte pas comme une modification.
 */
export function brouillonModifie(initial: unknown, courant: unknown): boolean {
  return empreinte(initial) !== empreinte(courant)
}

/** Une écriture stable d'une valeur : les clés des objets triées, `undefined` écarté. */
function empreinte(valeur: unknown): string {
  return JSON.stringify(valeur, (_cle, v: unknown) => {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return v
    const objet = v as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(objet)
        .sort()
        .map((cle) => [cle, objet[cle]]),
    )
  })
}
