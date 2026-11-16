/** Dates : mise en forme à la française. */

const JOUR_LONG = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

/**
 * Met en forme une date de la base (`2026-11-16T09:00:00Z`) : « 16 novembre 2026 ».
 * Renvoie une chaîne vide si la date est absente ou illisible.
 */
export function formaterDate(date: string | null | undefined): string {
  if (date === null || date === undefined || date === '') return ''
  const instant = new Date(date)
  if (Number.isNaN(instant.getTime())) return ''
  return JOUR_LONG.format(instant)
}

const JOUR_ISO = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Europe/Paris',
})

/** La date du jour à Paris, au format des champs de date et de la base : `2026-11-16`. */
export function dateDuJour(maintenant: Date = new Date()): string {
  return JOUR_ISO.format(maintenant)
}

/** Vérifie qu'un texte est une date `AAAA-MM-JJ` qui existe (pas de 30 février). */
export function estDateValide(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const instant = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(instant.getTime()) && instant.toISOString().slice(0, 10) === date
}
