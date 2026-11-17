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

const HEURE_PARIS = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Europe/Paris',
})

/** L'heure qu'il est à Paris, au format des champs d'heure : `09:05`, `14:30`. */
export function heureDuMoment(maintenant: Date = new Date()): string {
  return HEURE_PARIS.format(maintenant)
}

/** Vérifie qu'un texte est une heure `HH:MM` (de `00:00` à `23:59`). */
export function estHeureValide(heure: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(heure)
}

/** Vérifie qu'un texte est une date `AAAA-MM-JJ` qui existe (pas de 30 février). */
export function estDateValide(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const instant = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(instant.getTime()) && instant.toISOString().slice(0, 10) === date
}

/*
 * Calcul sur des jours du calendrier (`AAAA-MM-JJ`).
 * Tout est fait en temps universel, sur la date seule : un changement d'heure (fin mars,
 * fin octobre) ne peut donc jamais décaler un jour. Ces fonctions supposent une date valide.
 */

const MS_PAR_JOUR = 24 * 60 * 60 * 1000

function versInstant(date: string): number {
  const [annee = 0, mois = 1, jour = 1] = date.split('-').map(Number)
  return Date.UTC(annee, mois - 1, jour)
}

function depuisInstant(instant: number): string {
  return new Date(instant).toISOString().slice(0, 10)
}

/** Ajoute (ou retire, si négatif) un nombre de jours : `2026-01-31` + 1 = `2026-02-01`. */
export function ajouterJours(date: string, jours: number): string {
  return depuisInstant(versInstant(date) + jours * MS_PAR_JOUR)
}

/** Nombre de jours entre deux dates : positif si `fin` est après `debut`. */
export function ecartJours(debut: string, fin: string): number {
  return Math.round((versInstant(fin) - versInstant(debut)) / MS_PAR_JOUR)
}

/** Nombre de jours d'un mois (`mois` de 1 à 12). */
export function joursDansLeMois(annee: number, mois: number): number {
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate()
}

/**
 * Ajoute des mois. Si le jour n'existe pas dans le mois d'arrivée, on prend le dernier jour
 * du mois : `2027-01-31` + 1 mois = `2027-02-28`.
 */
export function ajouterMois(date: string, mois: number): string {
  const [annee = 0, moisDepart = 1, jour = 1] = date.split('-').map(Number)
  const rang = annee * 12 + (moisDepart - 1) + mois
  const anneeArrivee = Math.floor(rang / 12)
  const moisArrivee = rang - anneeArrivee * 12 + 1
  const jourArrivee = Math.min(jour, joursDansLeMois(anneeArrivee, moisArrivee))
  return depuisInstant(Date.UTC(anneeArrivee, moisArrivee - 1, jourArrivee))
}

/** Jour de la semaine, à la française : 1 pour lundi… 7 pour dimanche. */
export function jourDeSemaine(date: string): number {
  const jour = new Date(versInstant(date)).getUTCDay()
  return jour === 0 ? 7 : jour
}

/** Le dimanche qui termine la semaine (du lundi au dimanche) de cette date. */
export function finDeSemaine(date: string): string {
  return ajouterJours(date, 7 - jourDeSemaine(date))
}

const JOUR_COURT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const JOUR_COURT_ANNEE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * Un jour en abrégé : « mer. 18 nov. ». L'année n'est ajoutée que si elle diffère de
 * celle de `aujourdhui`. Chaîne vide si la date est illisible.
 */
export function formaterJourCourt(date: string, aujourdhui: string = dateDuJour()): string {
  if (!estDateValide(date)) return ''
  const format = date.slice(0, 4) === aujourdhui.slice(0, 4) ? JOUR_COURT : JOUR_COURT_ANNEE
  return format.format(new Date(versInstant(date)))
}

/** Une heure de la base (`09:30:00`) à la française : « 9 h 30 », « 14 h ». */
export function formaterHeure(heure: string | null): string {
  if (heure === null) return ''
  const correspondance = /^(\d{1,2}):(\d{2})/.exec(heure)
  if (correspondance === null) return ''
  const [, heures = '0', minutes = '00'] = correspondance
  return minutes === '00' ? `${Number(heures)} h` : `${Number(heures)} h ${minutes}`
}

/** Une durée en minutes : « 30 min », « 1 h », « 1 h 30 ». */
export function formaterDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  const reste = minutes % 60
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`
}

/** L'heure de fin, `heure` + `minutes` (`09:30:00` + 90 = `11:00`) ; `null` si elle passe minuit. */
export function heureDeFin(heure: string, minutes: number): string | null {
  const correspondance = /^(\d{1,2}):(\d{2})/.exec(heure)
  if (correspondance === null) return null
  const total = Number(correspondance[1]) * 60 + Number(correspondance[2]) + minutes
  if (total >= 24 * 60) return null
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
