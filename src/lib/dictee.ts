/**
 * Dictée : ce qui transforme les phrases reconnues par le navigateur en texte de champ.
 * Fonctions pures, sans rien du navigateur : la reconnaissance elle-même est dans
 * `reconnaissance-vocale.ts`.
 */

/** Un mot entier : ni lettre juste avant, ni lettre juste après (accents compris). */
function mot(expression: string): RegExp {
  return new RegExp(`\\s*(?<!\\p{L})(?:${expression})(?!\\p{L})\\s*`, 'giu')
}

/**
 * Ponctuation dite à voix haute. La reconnaissance du navigateur, en français, n'en met
 * presque jamais : on la dit (« virgule », « point final », « à la ligne »). Les mots
 * ambigus sont écartés : « point » seul (« un point positif ») et « deux points » (« deux
 * points négatifs ») restent des mots.
 */
const COMMANDES: readonly [RegExp, string][] = [
  [mot('point à la ligne'), '.\n'],
  [mot('à la ligne|nouvelle ligne|retour à la ligne'), '\n'],
  [mot("point d['’]interrogation"), ' ? '],
  [mot("point d['’]exclamation"), ' ! '],
  [mot('point final'), '. '],
  [mot('point[- ]virgule'), ' ; '],
  [mot('virgule'), ', '],
]

/** Une majuscule en tête du texte et après chaque fin de phrase (. ? ! ou retour à la ligne). */
function majusculesDePhrase(texte: string): string {
  return texte.replace(/(^|[.?!]\s+|\n\s*)(\p{Ll})/gu, (_tout, avant: string, lettre: string) => {
    return avant + lettre.toLocaleUpperCase('fr')
  })
}

/**
 * Remplace la ponctuation dite par les signes, puis nettoie les espaces : aucun espace avant
 * une virgule ou un point, un seul espace entre deux mots, aucun en bout de ligne. Les
 * nombres dictés (« 3,5 ») ne sont pas touchés.
 */
export function ponctuerDictee(phrase: string): string {
  let texte = phrase.replace(/\s+/g, ' ')
  for (const [motif, signe] of COMMANDES) texte = texte.replace(motif, signe)
  return texte
    .replace(/ +([,.])/g, '$1')
    .replace(/ {2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim()
}

/**
 * Ajoute une phrase dictée à la fin du texte d'un champ : un espace si besoin, une
 * majuscule en début de phrase, la ponctuation dite convertie. `longueurMax` : le texte
 * ajouté est coupé pour ne pas dépasser la limite du champ.
 */
export function ajouterDictee(texte: string, phrase: string, longueurMax?: number): string {
  const ajout = ponctuerDictee(phrase)
  if (ajout === '') return texte
  // Une virgule ou un point se colle au mot précédent.
  const base = /^[,.]/.test(ajout) ? texte.replace(/[ \t]+$/, '') : texte
  const debutDePhrase = base.trim() === '' || /[.?!]\s*$/.test(base) || /\n\s*$/.test(base)
  const espace = base === '' || /\s$/.test(base) || /^[,.\n]/.test(ajout) ? '' : ' '
  // Le repère « x » empêche la majuscule en tête quand la phrase continue.
  const corps = debutDePhrase
    ? majusculesDePhrase(ajout)
    : majusculesDePhrase(`x ${ajout}`).slice(2)
  const resultat = `${base}${espace}${corps}`
  if (longueurMax === undefined || resultat.length <= longueurMax) return resultat
  return resultat.slice(0, Math.max(longueurMax, texte.length))
}

/**
 * Sur certains téléphones Android, chaque résultat de la reconnaissance reprend tout ce qui
 * a déjà été dit (« bonjour », puis « bonjour je viens »…). Renvoie la part réellement
 * nouvelle de `actuel` par rapport au résultat précédent de la même écoute.
 */
export function partNouvelle(precedent: string, actuel: string): string {
  const avant = precedent.trim()
  const maintenant = actuel.trim()
  if (
    avant === '' ||
    !maintenant.toLocaleLowerCase('fr').startsWith(avant.toLocaleLowerCase('fr'))
  ) {
    return maintenant
  }
  return maintenant.slice(avant.length).trim()
}

/** Les erreurs de la reconnaissance vocale, en français, avec ce qu'il faut faire. */
export function messageErreurDictee(code: string): string | null {
  switch (code) {
    // Silence, ou écoute arrêtée par l'application : rien à signaler.
    case 'no-speech':
    case 'aborted':
      return null
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Le micro est refusé. Autorisez-le dans les réglages du navigateur, ou dictez avec le micro du clavier.'
    case 'audio-capture':
      return 'Aucun micro n’a été trouvé. Dictez avec le micro du clavier, ou écrivez.'
    case 'network':
      return 'La dictée a besoin d’Internet. Vérifiez la connexion, ou dictez avec le micro du clavier.'
    case 'language-not-supported':
      return 'Ce navigateur ne sait pas dicter en français. Utilisez le micro du clavier.'
    default:
      return 'La dictée s’est arrêtée. Touchez à nouveau « Dicter », ou utilisez le micro du clavier.'
  }
}
