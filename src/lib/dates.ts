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

const JOUR_SEMAINE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const JOUR_SEMAINE_ANNEE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * Le jour de la semaine en entier, le mois abrégé : « jeudi 26 nov. », dans une phrase.
 * L'année n'est ajoutée que si elle diffère de celle de `aujourdhui`. Vide si illisible.
 */
export function formaterJourSemaine(date: string, aujourdhui: string = dateDuJour()): string {
  if (!estDateValide(date)) return ''
  const format = date.slice(0, 4) === aujourdhui.slice(0, 4) ? JOUR_SEMAINE : JOUR_SEMAINE_ANNEE
  return format.format(new Date(versInstant(date)))
}

const JOUR_NOM = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'UTC' })

/**
 * Un jour proche dit en mots : « aujourd’hui », « demain », puis le nom du jour jusqu'à six
 * jours (« jeudi » : on ne peut pas le confondre avec celui de la semaine suivante), et la
 * date abrégée au-delà (« ven. 4 déc. »), comme pour un jour passé. Vide si illisible.
 */
export function jourEnMots(date: string, aujourdhui: string = dateDuJour()): string {
  if (!estDateValide(date)) return ''
  const ecart = ecartJours(aujourdhui, date)
  if (ecart === 0) return 'aujourd’hui'
  if (ecart === 1) return 'demain'
  if (ecart > 1 && ecart <= 6) return JOUR_NOM.format(new Date(versInstant(date)))
  return formaterJourCourt(date, aujourdhui)
}

const JOUR_LONG_SEMAINE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** Un jour en toutes lettres, pour un titre : « Mardi 17 novembre ». Vide si illisible. */
export function formaterJourLong(date: string): string {
  if (!estDateValide(date)) return ''
  const texte = JOUR_LONG_SEMAINE.format(new Date(versInstant(date)))
  return texte.charAt(0).toUpperCase() + texte.slice(1)
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

/**
 * L'instant (temps universel, format de la base) d'un jour et d'une heure lus sur une montre
 * à Paris : `2026-11-17` et `14:30` donnent `2026-11-17T13:30:00.000Z` en hiver.
 */
export function instantDeParis(date: string, heure: string): string {
  const supposition = new Date(`${date}T${heure}:00Z`)
  // Ce que la montre de Paris afficherait à cet instant : l'écart donne le décalage horaire.
  const affiche = new Date(`${dateDuJour(supposition)}T${heureDuMoment(supposition)}:00Z`)
  return new Date(2 * supposition.getTime() - affiche.getTime()).toISOString()
}

/**
 * Numéro de la semaine, à la norme ISO (celle des agendas français) : la semaine 1 est celle
 * qui contient le premier jeudi de l'année. `2026-11-21` est en semaine 47 ; `2027-01-01`,
 * un vendredi, est encore en semaine 53 de 2026.
 */
export function numeroSemaine(date: string): number {
  // Le jeudi de la même semaine décide de l'année à laquelle elle appartient.
  const jeudi = ajouterJours(date, 4 - jourDeSemaine(date))
  const premierJanvier = `${jeudi.slice(0, 4)}-01-01`
  return Math.floor(ecartJours(premierJanvier, jeudi) / 7) + 1
}

/** « Samedi 21 novembre · semaine 47 ». Vide si la date est illisible. */
export function formaterJourEtSemaine(date: string): string {
  if (!estDateValide(date)) return ''
  return `${formaterJourLong(date)} · semaine ${numeroSemaine(date)}`
}

/** Les minutes écoulées depuis minuit pour une heure `HH:MM` (ou `HH:MM:SS`) ; `null` si illisible. */
export function minutesDuJour(heure: string): number | null {
  const correspondance = /^(\d{1,2}):(\d{2})/.exec(heure)
  if (correspondance === null) return null
  const heures = Number(correspondance[1])
  const minutes = Number(correspondance[2])
  if (heures > 23 || minutes > 59) return null
  return heures * 60 + minutes
}

/** « aujourd'hui », « hier », « il y a 8 jours », « il y a 2 mois », « il y a plus d'un an ». */
export function depuisQuand(jours: number): string {
  if (jours <= 0) return "aujourd'hui"
  if (jours === 1) return 'hier'
  if (jours < 60) return `il y a ${jours} jours`
  if (jours < 365) return `il y a ${Math.floor(jours / 30)} mois`
  return "il y a plus d'un an"
}

/**
 * Depuis quand date un moment de la base (`2026-11-16T09:00:00Z`), compté en jours du
 * calendrier de Paris : « il y a 3 jours ». Chaîne vide si le moment est illisible.
 */
export function depuisLeMoment(moment: string, aujourdhui: string = dateDuJour()): string {
  const instant = new Date(moment)
  if (Number.isNaN(instant.getTime())) return ''
  return depuisQuand(ecartJours(dateDuJour(instant), aujourdhui))
}
