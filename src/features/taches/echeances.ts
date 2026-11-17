import { ajouterJours, ecartJours, finDeSemaine, formaterJourCourt } from '../../lib/dates'

/**
 * Où tombe une tâche (les vues de la page Tâches) et comment la reporter. Toutes les dates
 * sont des jours du calendrier, à l'heure de Paris (`dateDuJour`).
 */

/** Les vues de la page Tâches. */
export type Vue = 'en_retard' | 'aujourdhui' | 'semaine' | 'plus_tard' | 'terminees'

export const VUES: readonly { valeur: Vue; libelle: string }[] = [
  { valeur: 'en_retard', libelle: 'En retard' },
  { valeur: 'aujourdhui', libelle: "Aujourd'hui" },
  { valeur: 'semaine', libelle: 'Cette semaine' },
  { valeur: 'plus_tard', libelle: 'Plus tard' },
  { valeur: 'terminees', libelle: 'Terminées' },
]

export function libelleVue(vue: Vue): string {
  return VUES.find((option) => option.valeur === vue)?.libelle ?? vue
}

/**
 * Bornes des dates d'échéance d'une vue de tâches à faire, incluses (`AAAA-MM-JJ`).
 * « Cette semaine » va de demain à dimanche ; le dimanche, elle est donc vide.
 */
export function bornesVue(
  vue: Exclude<Vue, 'terminees'>,
  aujourdhui: string,
): { min?: string; max?: string } {
  const dimanche = finDeSemaine(aujourdhui)
  switch (vue) {
    case 'en_retard':
      return { max: ajouterJours(aujourdhui, -1) }
    case 'aujourdhui':
      return { min: aujourdhui, max: aujourdhui }
    case 'semaine':
      return { min: ajouterJours(aujourdhui, 1), max: dimanche }
    case 'plus_tard':
      return { min: ajouterJours(dimanche, 1) }
  }
}

/** La vue dans laquelle une tâche à faire apparaît. */
export function vueDe(echeance: string, aujourdhui: string): Exclude<Vue, 'terminees'> {
  if (echeance < aujourdhui) return 'en_retard'
  if (echeance === aujourdhui) return 'aujourdhui'
  if (echeance <= finDeSemaine(aujourdhui)) return 'semaine'
  return 'plus_tard'
}

export type ChoixReport = 'demain' | 'trois_jours' | 'semaine'

/** Les reports proposés en un geste, comptés à partir d'aujourd'hui. */
export const REPORTS: readonly { valeur: ChoixReport; libelle: string; jours: number }[] = [
  { valeur: 'demain', libelle: 'Demain', jours: 1 },
  { valeur: 'trois_jours', libelle: 'Dans 3 jours', jours: 3 },
  { valeur: 'semaine', libelle: 'Dans une semaine', jours: 7 },
]

/** La nouvelle date d'une tâche reportée : toujours comptée depuis aujourd'hui. */
export function dateReport(choix: ChoixReport, aujourdhui: string): string {
  const jours = REPORTS.find((option) => option.valeur === choix)?.jours ?? 1
  return ajouterJours(aujourdhui, jours)
}

/** Un jour dit simplement : « Aujourd'hui », « Demain », « Hier », sinon « mer. 18 nov. ». */
export function libelleJour(date: string, aujourdhui: string): string {
  const ecart = ecartJours(aujourdhui, date)
  if (ecart === 0) return "Aujourd'hui"
  if (ecart === 1) return 'Demain'
  if (ecart === -1) return 'Hier'
  return formaterJourCourt(date, aujourdhui)
}
