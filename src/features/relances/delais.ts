import { ajouterJours, ajouterMois } from '../../lib/dates'
import { TEMPERATURES, type Temperature } from '../contacts/contacts'

/**
 * Délais de relance. La température d'un contact fixe le rythme de relance par défaut
 * (cadrage, « Suivi de prospection ») : chaud chaque semaine, tiède chaque mois, froid chaque
 * trimestre, veille deux fois par an. Les délais se changent dans Réglages, et la date
 * proposée se change au cas par cas au moment de clôturer une tâche.
 *
 * Un délai s'écrit comme dans la base : un nombre de 1 à 99 suivi de l'unité, `j` (jours),
 * `s` (semaines) ou `m` (mois). « 1s » : une semaine ; « 3m » : trois mois.
 */

export type UniteDelai = 'j' | 's' | 'm'
export type Delai = { nombre: number; unite: UniteDelai }

/** Le délai de relance de chaque température, au format de la base (« 1s », « 3m »). */
export type DelaisRelance = Record<Temperature, string>

export const DELAIS_PAR_DEFAUT: DelaisRelance = {
  chaud: '1s',
  tiede: '1m',
  froid: '3m',
  veille: '6m',
}

/** Délai retenu pour un contact sans température : celui d'un contact tiède. */
export const TEMPERATURE_PAR_DEFAUT: Temperature = 'tiede'

/** Lit un délai écrit « 1s », « 3m » ; `null` s'il est illisible. */
export function lireDelai(code: string): Delai | null {
  const correspondance = /^([1-9]\d?)([jsm])$/.exec(code)
  if (correspondance === null) return null
  const [, nombre = '', unite = ''] = correspondance
  if (unite !== 'j' && unite !== 's' && unite !== 'm') return null
  return { nombre: Number(nombre), unite }
}

/** Un délai en clair : « 2 jours », « 1 semaine », « 3 mois », « 1 an ». */
export function libelleDelai(code: string): string {
  const delai = lireDelai(code)
  if (delai === null) return code
  const { nombre, unite } = delai
  if (unite === 'j') return nombre > 1 ? `${nombre} jours` : '1 jour'
  if (unite === 's') return nombre > 1 ? `${nombre} semaines` : '1 semaine'
  if (nombre % 12 === 0) return nombre === 12 ? '1 an' : `${nombre / 12} ans`
  return `${nombre} mois`
}

/**
 * La date qui suit `date` de ce délai. Les semaines comptent 7 jours ; les mois suivent le
 * calendrier (le 31 janvier + 1 mois = le 28 ou 29 février). `null` si le délai est illisible.
 */
export function ajouterDelai(date: string, code: string): string | null {
  const delai = lireDelai(code)
  if (delai === null) return null
  if (delai.unite === 'j') return ajouterJours(date, delai.nombre)
  if (delai.unite === 's') return ajouterJours(date, delai.nombre * 7)
  return ajouterMois(date, delai.nombre)
}

/** Les délais proposés dans Réglages et sous la date de la prochaine action. */
export const CHOIX_DELAIS: readonly { valeur: string; libelle: string }[] = [
  '2j',
  '3j',
  '1s',
  '2s',
  '3s',
  '1m',
  '2m',
  '3m',
  '4m',
  '6m',
  '9m',
  '12m',
].map((code) => ({ valeur: code, libelle: libelleDelai(code) }))

/** Les raccourcis de date proposés pour la prochaine action. */
export const RACCOURCIS_RELANCE: readonly string[] = ['2j', '1s', '1m', '3m', '6m']

function estTemperature(valeur: string | null): valeur is Temperature {
  return TEMPERATURES.some((option) => option.valeur === valeur)
}

/**
 * Relit des délais enregistrés : un délai absent ou illisible est remplacé par celui par
 * défaut, pour que la proposition de date ne manque jamais.
 */
export function delaisLisibles(valeurs: Partial<Record<Temperature, string>>): DelaisRelance {
  const lisible = (temperature: Temperature) => {
    const code = valeurs[temperature]
    return code !== undefined && lireDelai(code) !== null ? code : DELAIS_PAR_DEFAUT[temperature]
  }
  return {
    chaud: lisible('chaud'),
    tiede: lisible('tiede'),
    froid: lisible('froid'),
    veille: lisible('veille'),
  }
}

/** Ce que propose la boucle de relance : la date, et d'où elle vient. */
export type PropositionRelance = {
  echeance: string
  delai: string
  /** La température dont le délai a servi. */
  temperature: Temperature
  /** Vrai si le contact n'a pas de température : le délai d'un contact tiède a servi. */
  parDefaut: boolean
}

/**
 * Date proposée pour la prochaine relance : aujourd'hui plus le délai de la température du
 * contact. Sans température connue, on applique le délai d'un contact tiède.
 */
export function proposerRelance(
  aujourdhui: string,
  temperature: string | null,
  delais: DelaisRelance = DELAIS_PAR_DEFAUT,
): PropositionRelance {
  const connue = estTemperature(temperature)
  const retenue = connue ? temperature : TEMPERATURE_PAR_DEFAUT
  const lisibles = delaisLisibles(delais)
  const delai = lisibles[retenue]
  return {
    echeance: ajouterDelai(aujourdhui, delai) ?? ajouterMois(aujourdhui, 1),
    delai,
    temperature: retenue,
    parDefaut: !connue,
  }
}
