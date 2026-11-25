import { ajouterJours, ajouterMois, formaterJourCourt } from '../../lib/dates'

/**
 * Périodes de la page Journal. Toutes les dates sont des jours du calendrier, à l'heure de
 * Paris (`dateDuJour`) ; les bornes sont incluses.
 */

/**
 * La période du journal, en commande segmentée (revue de design n° 2, proposition 13) :
 * « 7 j · 30 j · 3 mois · Tout ». Le libellé court s'affiche ; `annonce` est lu par les
 * lecteurs d'écran et montré en info-bulle.
 */
export type Periode = 'sept_jours' | 'trente_jours' | 'trois_mois' | 'tout'

export const PERIODES: readonly { valeur: Periode; libelle: string; annonce: string }[] = [
  { valeur: 'sept_jours', libelle: '7 j', annonce: '7 derniers jours' },
  { valeur: 'trente_jours', libelle: '30 j', annonce: '30 derniers jours' },
  { valeur: 'trois_mois', libelle: '3 mois', annonce: '3 derniers mois' },
  { valeur: 'tout', libelle: 'Tout', annonce: 'Tout le journal' },
]

/** La période ouverte par défaut. */
export const PERIODE_PAR_DEFAUT: Periode = 'trente_jours'

export function estPeriode(valeur: string): valeur is Periode {
  return PERIODES.some((option) => option.valeur === valeur)
}

export type Bornes = { min?: string; max?: string }

/**
 * Bornes d'une période (`AAAA-MM-JJ`, incluses), aujourd'hui compris : « 7 j » va du mercredi
 * au mardi, « 3 mois » du 18 août au 17 novembre.
 */
export function bornesPeriode(periode: Periode, aujourdhui: string): Bornes {
  switch (periode) {
    case 'tout':
      return {}
    case 'sept_jours':
      return { min: ajouterJours(aujourdhui, -6), max: aujourdhui }
    case 'trente_jours':
      return { min: ajouterJours(aujourdhui, -29), max: aujourdhui }
    case 'trois_mois':
      return { min: ajouterJours(ajouterMois(aujourdhui, -3), 1), max: aujourdhui }
  }
}

/** Titre d'une journée dans un fil : « Aujourd'hui », « Hier », sinon « mar. 10 nov. ». */
export function libelleJourActivite(date: string, aujourdhui: string): string {
  if (date === aujourdhui) return "Aujourd'hui"
  if (date === ajouterJours(aujourdhui, -1)) return 'Hier'
  return formaterJourCourt(date, aujourdhui)
}
