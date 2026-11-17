import { ajouterJours, ajouterMois, estDateValide, formaterJourCourt } from '../../lib/dates'

/**
 * Périodes de la page Journal. Toutes les dates sont des jours du calendrier, à l'heure de
 * Paris (`dateDuJour`) ; les bornes sont incluses.
 */

export type Periode =
  | 'tout'
  | 'aujourdhui'
  | 'hier'
  | 'sept_jours'
  | 'trente_jours'
  | 'mois'
  | 'mois_dernier'
  | 'annee'
  | 'dates'

export const PERIODES: readonly { valeur: Periode; libelle: string }[] = [
  { valeur: 'tout', libelle: 'Tout le journal' },
  { valeur: 'aujourdhui', libelle: "Aujourd'hui" },
  { valeur: 'hier', libelle: 'Hier' },
  { valeur: 'sept_jours', libelle: '7 derniers jours' },
  { valeur: 'trente_jours', libelle: '30 derniers jours' },
  { valeur: 'mois', libelle: 'Ce mois-ci' },
  { valeur: 'mois_dernier', libelle: 'Le mois dernier' },
  { valeur: 'annee', libelle: 'Cette année' },
  { valeur: 'dates', libelle: 'Dates choisies' },
]

export function estPeriode(valeur: string): valeur is Periode {
  return PERIODES.some((option) => option.valeur === valeur)
}

export type Bornes = { min?: string; max?: string }

/**
 * Bornes d'une période (`AAAA-MM-JJ`, incluses). « 7 derniers jours » compte aujourd'hui.
 * Pour « Dates choisies », une date vide ou illisible laisse ce côté ouvert, et deux dates
 * données à l'envers sont remises dans l'ordre.
 */
export function bornesPeriode(
  periode: Periode,
  aujourdhui: string,
  libres: { du: string; au: string } = { du: '', au: '' },
): Bornes {
  const premierDuMois = `${aujourdhui.slice(0, 8)}01`
  switch (periode) {
    case 'tout':
      return {}
    case 'aujourdhui':
      return { min: aujourdhui, max: aujourdhui }
    case 'hier': {
      const hier = ajouterJours(aujourdhui, -1)
      return { min: hier, max: hier }
    }
    case 'sept_jours':
      return { min: ajouterJours(aujourdhui, -6), max: aujourdhui }
    case 'trente_jours':
      return { min: ajouterJours(aujourdhui, -29), max: aujourdhui }
    case 'mois':
      return { min: premierDuMois, max: aujourdhui }
    case 'mois_dernier':
      return { min: ajouterMois(premierDuMois, -1), max: ajouterJours(premierDuMois, -1) }
    case 'annee':
      return { min: `${aujourdhui.slice(0, 4)}-01-01`, max: aujourdhui }
    case 'dates': {
      const du = estDateValide(libres.du) ? libres.du : undefined
      const au = estDateValide(libres.au) ? libres.au : undefined
      if (du !== undefined && au !== undefined && du > au) return { min: au, max: du }
      return { ...(du === undefined ? {} : { min: du }), ...(au === undefined ? {} : { max: au }) }
    }
  }
}

/** Titre d'une journée dans un fil : « Aujourd'hui », « Hier », sinon « mar. 10 nov. ». */
export function libelleJourActivite(date: string, aujourdhui: string): string {
  if (date === aujourdhui) return "Aujourd'hui"
  if (date === ajouterJours(aujourdhui, -1)) return 'Hier'
  return formaterJourCourt(date, aujourdhui)
}
