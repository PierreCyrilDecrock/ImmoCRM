import { dateDuJour, formaterDate, formaterHeure, heureDuMoment } from '../../lib/dates'
import { joursDepuis } from '../aujourdhui/journee'

/** Au-delà de ce nombre de jours sans export, l'écran Aujourd'hui le rappelle. */
export const JOURS_ENTRE_EXPORTS = 7

/**
 * Nombre de jours depuis le dernier export (compté en jours de Paris), ou `null` si aucun
 * export n'a jamais été fait ou si la date est illisible.
 */
export function joursDepuisExport(dernierExport: string | null, aujourdhui: string): number | null {
  if (dernierExport === null) return null
  const instant = new Date(dernierExport)
  if (Number.isNaN(instant.getTime())) return null
  return joursDepuis(dateDuJour(instant), aujourdhui)
}

/** Faut-il rappeler d'exporter ? Oui s'il n'y a jamais eu d'export, ou s'il date de 7 jours. */
export function exportARappeler(dernierExport: string | null, aujourdhui: string): boolean {
  const jours = joursDepuisExport(dernierExport, aujourdhui)
  return jours === null || jours >= JOURS_ENTRE_EXPORTS
}

/** « aujourd'hui », « hier », « il y a 9 jours ». */
export function ancienneteExport(jours: number): string {
  if (jours <= 0) return "aujourd'hui"
  if (jours === 1) return 'hier'
  return `il y a ${jours} jours`
}

/** Un moment de la base à la française : « le 18 novembre 2026 à 10 h 32 » (heure de Paris). */
export function formaterMoment(iso: string): string {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return ''
  return `le ${formaterDate(iso)} à ${formaterHeure(heureDuMoment(instant))}`
}
