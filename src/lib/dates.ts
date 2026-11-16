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
