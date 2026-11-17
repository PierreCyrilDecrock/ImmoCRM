import { ajouterJours, ajouterMois } from '../../lib/dates'

/**
 * Tâches récurrentes : créées une fois, elles se régénèrent. Clôturer une occurrence (faite,
 * ou annulée « cette fois seulement ») crée la suivante.
 *
 * Une série part de sa première date (`ancre`) ; la n-ième occurrence (`rang`) en est
 * déduite. On repart toujours de l'ancre, pas de l'occurrence précédente : une tâche du
 * 31 janvier tombe le 28 février, puis le 31 mars, et pas le 28 de chaque mois.
 */

export type Recurrence = 'jour' | 'semaine' | 'deux_semaines' | 'mois' | 'an'

export const RECURRENCES: readonly { valeur: Recurrence; libelle: string }[] = [
  { valeur: 'jour', libelle: 'Tous les jours' },
  { valeur: 'semaine', libelle: 'Toutes les semaines' },
  { valeur: 'deux_semaines', libelle: 'Toutes les deux semaines' },
  { valeur: 'mois', libelle: 'Tous les mois' },
  { valeur: 'an', libelle: 'Tous les ans' },
]

export function estRecurrence(valeur: string | null): valeur is Recurrence {
  return RECURRENCES.some((option) => option.valeur === valeur)
}

/** « Tous les mois » ; `null` pour une tâche unique ou une valeur inconnue. */
export function libelleRecurrence(valeur: string | null): string | null {
  return RECURRENCES.find((option) => option.valeur === valeur)?.libelle ?? null
}

/** Date de l'occurrence de rang `rang` d'une série qui commence le `ancre`. */
export function dateDeSerie(recurrence: Recurrence, ancre: string, rang: number): string {
  switch (recurrence) {
    case 'jour':
      return ajouterJours(ancre, rang)
    case 'semaine':
      return ajouterJours(ancre, 7 * rang)
    case 'deux_semaines':
      return ajouterJours(ancre, 14 * rang)
    case 'mois':
      return ajouterMois(ancre, rang)
    case 'an':
      return ajouterMois(ancre, 12 * rang)
  }
}

/** Ce qu'il faut savoir d'une occurrence pour calculer la suivante. */
export type Occurrence = {
  recurrence: Recurrence
  /** Date de la première occurrence de la série. */
  ancre: string
  /** Place de cette occurrence dans la série (0 pour la première). */
  rang: number
  /** Date à laquelle cette occurrence était prévue (éventuellement reportée). */
  echeance: string
}

/** Garde-fou : au-delà, la série est considérée comme cassée (plus de 270 ans en quotidien). */
const RANG_MAX = 100_000

/**
 * L'occurrence qui suit celle qu'on clôture : la première date de la série qui tombe
 * après l'occurrence clôturée (même reportée) et pas avant aujourd'hui.
 *
 * - Clôturée en avance ou à l'heure : la suivante est la date prévue d'après.
 * - Reportée puis clôturée : la série ne se décale pas (report au 3 février d'une tâche
 *   mensuelle du 31 janvier : la suivante reste le 28 février).
 * - Clôturée en retard : les dates déjà passées sont sautées, pour ne pas créer une tâche
 *   aussitôt en retard.
 *
 * Renvoie `null` si aucune date n'est trouvée (série incohérente).
 */
export function occurrenceSuivante(
  occurrence: Occurrence,
  aujourdhui: string,
): { echeance: string; rang: number } | null {
  const { recurrence, ancre, echeance } = occurrence
  const plancher = echeance > aujourdhui ? echeance : aujourdhui
  for (let rang = occurrence.rang + 1; rang <= RANG_MAX; rang += 1) {
    const date = dateDeSerie(recurrence, ancre, rang)
    if (date > echeance && date >= plancher) return { echeance: date, rang }
  }
  return null
}
