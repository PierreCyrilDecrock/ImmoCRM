/**
 * Recherche : mise en forme de ce que l'utilisateur tape, avant de l'envoyer à la base.
 *
 * La base range, pour chaque fiche, un texte cherchable sans accent ni majuscule, où chaque
 * téléphone figure en chiffres seuls sous deux écritures (`0612345678` et `33612345678`).
 * Ce fichier applique la même mise en forme à la saisie : voir la fonction SQL
 * `normaliser_recherche` (supabase/migrations/0003_contacts_recherche.sql).
 */

/** Lettres que la décomposition des accents ne traite pas. */
const LETTRES_LIEES: Record<string, string> = {
  œ: 'oe',
  æ: 'ae',
  ß: 'ss',
  ø: 'o',
  ł: 'l',
  đ: 'd',
}

/** Nombre maximal de mots pris en compte, et longueur maximale de chacun. */
export const MAX_TERMES = 8
const LONGUEUR_MAX_TERME = 50

/**
 * Met un texte en forme pour la recherche : minuscules, sans accent, tirets et apostrophes
 * remplacés par des espaces, caractères jokers (% _ \ *) retirés.
 */
export function normaliserRecherche(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[œæßøłđ]/g, (lettre) => LETTRES_LIEES[lettre] ?? lettre)
    .replace(/[-'’%_\\*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Un morceau de numéro : des chiffres, avec la ponctuation habituelle d'un téléphone. */
function estNumerique(mot: string): boolean {
  return /^[+\d.()/-]+$/.test(mot) && /\d/.test(mot)
}

/** Réunit les morceaux d'un téléphone en chiffres seuls, tels que la base les range. */
function chiffresTelephone(morceaux: readonly string[]): string {
  const international = morceaux[0]?.startsWith('+') ?? false
  const chiffres = morceaux.join('').replace(/\D/g, '')
  // « 0033 6… » et « +33 6… » désignent le même numéro : la base range « 336… ».
  return !international && chiffres.startsWith('00') ? chiffres.slice(2) : chiffres
}

/**
 * Découpe une saisie en mots à chercher (chacun doit figurer dans la fiche).
 * Un téléphone tapé en plusieurs morceaux est réuni : « 06 12 », « 06.12 » et « 0612 »
 * donnent `0612` ; « +33 6 12 » et « +33 (0)6 12 » donnent `33612`.
 */
export function termesRecherche(saisie: string): string[] {
  // « (0) » après l'indicatif est une habitude d'écriture : il ne se compose pas.
  const mots = saisie.replace(/\(0\)/g, '').split(/\s+/).filter(Boolean)
  const termes: string[] = []
  const ajouter = (terme: string) => {
    const court = terme.slice(0, LONGUEUR_MAX_TERME)
    if (court !== '' && !termes.includes(court)) termes.push(court)
  }

  let rang = 0
  while (rang < mots.length) {
    const mot = mots[rang] ?? ''
    // Une suite de chiffres qui commence par 0 ou + est lue comme un téléphone.
    if (estNumerique(mot) && /^[+(]*0|^\+/.test(mot)) {
      let fin = rang + 1
      while (fin < mots.length && estNumerique(mots[fin] ?? '')) fin += 1
      ajouter(chiffresTelephone(mots.slice(rang, fin)))
      rang = fin
    } else {
      normaliserRecherche(mot).split(' ').forEach(ajouter)
      rang += 1
    }
  }
  return termes.slice(0, MAX_TERMES)
}
