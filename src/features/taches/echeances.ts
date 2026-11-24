import {
  ajouterJours,
  ecartJours,
  finDeSemaine,
  formaterJourCourt,
  jourDeSemaine,
} from '../../lib/dates'

/**
 * Où tombe une tâche (les vues de la page Tâches) et comment la reporter. Toutes les dates
 * sont des jours du calendrier, à l'heure de Paris (`dateDuJour`).
 */

/**
 * Les tranches de dates où tombe une tâche à faire : en retard, aujourd'hui, d'ici dimanche,
 * plus tard. La pastille de la navigation compte la première.
 */
export type Tranche = 'en_retard' | 'aujourdhui' | 'semaine' | 'plus_tard'

/**
 * Les vues (onglets) de la page Tâches. « À faire » réunit les deux premières tranches, en
 * deux rubriques : en retard, puis aujourd'hui (étape F.1, proposition 1 de la revue n° 2).
 */
export type Vue = 'a_faire' | 'semaine' | 'plus_tard' | 'terminees'

/** Les deux rubriques de l'onglet « À faire », dans leur ordre d'affichage. */
export type RubriqueAFaire = 'en_retard' | 'aujourdhui'

export const VUES: readonly { valeur: Vue; libelle: string; precision?: string }[] = [
  { valeur: 'a_faire', libelle: 'À faire' },
  // Dit aux lecteurs d'écran et en info-bulle, plutôt qu'en note de bas de page.
  { valeur: 'semaine', libelle: 'Semaine', precision: "jusqu'à dimanche" },
  { valeur: 'plus_tard', libelle: 'Plus tard' },
  { valeur: 'terminees', libelle: 'Terminées' },
]

export function libelleVue(vue: Vue): string {
  return VUES.find((option) => option.valeur === vue)?.libelle ?? vue
}

/**
 * La vue (et la rubrique) qu'ouvre une adresse `#/taches?vue=…`. Les anciennes vues « En
 * retard » et « Aujourd'hui » (liens de l'accueil, anciens favoris) mènent à « À faire », à
 * leur rubrique ; une valeur inconnue ou absente aussi, sans rubrique.
 */
export function vueDepuisAdresse(valeur: string | null): {
  vue: Vue
  rubrique: RubriqueAFaire | null
} {
  if (valeur === 'en_retard' || valeur === 'aujourdhui') {
    return { vue: 'a_faire', rubrique: valeur }
  }
  const vue = VUES.find((option) => option.valeur === valeur)?.valeur
  return { vue: vue ?? 'a_faire', rubrique: null }
}

/**
 * Bornes des dates d'échéance d'une tranche, ou de la vue « À faire », incluses
 * (`AAAA-MM-JJ`). « Semaine » va de demain à dimanche ; le dimanche, elle est donc vide.
 */
export function bornesVue(
  vue: Tranche | 'a_faire',
  aujourdhui: string,
): { min?: string; max?: string } {
  const dimanche = finDeSemaine(aujourdhui)
  switch (vue) {
    case 'a_faire':
      return { max: aujourdhui }
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

/** La tranche où tombe une tâche à faire. */
export function trancheDe(echeance: string, aujourdhui: string): Tranche {
  if (echeance < aujourdhui) return 'en_retard'
  if (echeance === aujourdhui) return 'aujourdhui'
  if (echeance <= finDeSemaine(aujourdhui)) return 'semaine'
  return 'plus_tard'
}

/** La vue (l'onglet) dans laquelle une tâche à faire apparaît. */
export function vueDe(echeance: string, aujourdhui: string): Exclude<Vue, 'terminees'> {
  const tranche = trancheDe(echeance, aujourdhui)
  return tranche === 'en_retard' || tranche === 'aujourdhui' ? 'a_faire' : tranche
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

/** Les reports proposés d'un toucher, sans fenêtre (rangée `ReportsRapides`). */
export type ReportRapide = 'demain' | 'trois_jours' | 'lundi'

/** Le prochain lundi strictement après ce jour : un lundi renvoie le lundi suivant. */
export function prochainLundi(aujourdhui: string): string {
  return ajouterJours(aujourdhui, 8 - jourDeSemaine(aujourdhui))
}

/**
 * Les trois reports en un geste et leur date, comptée depuis aujourd'hui : demain, dans
 * 3 jours, lundi prochain. Deux choix peuvent tomber le même jour (le vendredi, « Dans 3
 * jours » est lundi ; le dimanche, « Demain » aussi) : la rangée garde ses trois boutons à
 * leur place, pour que le geste reste le même chaque jour.
 */
export function reportsRapides(
  aujourdhui: string,
): readonly { valeur: ReportRapide; libelle: string; date: string }[] {
  return [
    { valeur: 'demain', libelle: 'Demain', date: ajouterJours(aujourdhui, 1) },
    { valeur: 'trois_jours', libelle: 'Dans 3 jours', date: ajouterJours(aujourdhui, 3) },
    { valeur: 'lundi', libelle: 'Lundi', date: prochainLundi(aujourdhui) },
  ]
}
