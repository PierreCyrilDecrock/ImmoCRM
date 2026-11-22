import { ajouterJours, ecartJours } from '../../lib/dates'
import type { Filtre } from '../../lib/donnees'
import { adresseBien, type Bien } from '../biens/biens'
import { adresseComplete, type Contact } from '../contacts/contacts'
import { CATEGORIES_TACHE, type Tache } from '../taches/taches'

/**
 * Écran « Aujourd'hui » : ce qui range chaque élément de la journée dans son bloc, et la
 * façon de le dire. Fonctions pures, sans accès à la base (la lecture est dans
 * `lecture-journee.ts`).
 *
 * Chaque tâche à faire, datée d'aujourd'hui ou en retard, apparaît dans un seul bloc :
 *   - Agenda du jour : les tâches d'aujourd'hui qui ont une heure (rendez-vous, visites,
 *     estimations, appels à heure fixe), par heure ;
 *   - À rappeler : les relances (catégorie « Relance ») d'aujourd'hui sans heure ou en
 *     retard, les plus anciennes d'abord ;
 *   - Tâches : toutes les autres (hors relance), les plus anciennes d'abord. Un rendez-vous
 *     d'un jour passé, resté ouvert, y apparaît aussi : rien ne se perd.
 */

/** Les cinq blocs, dans l'ordre où la journée se vit. */
export type CleBloc = 'agenda' | 'relances' | 'taches' | 'alertes' | 'nouveautes'

export const BLOCS: readonly CleBloc[] = ['agenda', 'relances', 'taches', 'alertes', 'nouveautes']

/** Nombre de lignes lues au plus pour chaque bloc : l'écran reste rapide. */
export const LIMITES = {
  agenda: 30,
  relances: 30,
  taches: 30,
  contactsSansAction: 5,
  projetsSansActivite: 10,
  nouveautes: 10,
} as const

/** Un projet en cours sans activité depuis ce nombre de jours est signalé. */
export const JOURS_SANS_ACTIVITE = 15

/** Une demande entrante se qualifie dans l'heure : au-delà, son délai s'affiche en alerte. */
export const MINUTES_POUR_QUALIFIER = 60

/** Les catégories de tâches autres que la relance. */
export const CATEGORIES_HORS_RELANCE: string[] = CATEGORIES_TACHE.map((c) => c.valeur).filter(
  (categorie) => categorie !== 'relance',
)

/** Avant aujourd'hui, ou aujourd'hui sans heure : les deux moments d'un bloc de tâches. */
export type Moment = 'en_retard' | 'du_jour'

const A_FAIRE: Filtre<'taches'> = { colonne: 'etat', genre: 'egal', valeur: 'a_faire' }

function conditionsMoment(moment: Moment, aujourdhui: string): Filtre<'taches'>[] {
  return moment === 'en_retard'
    ? [{ colonne: 'echeance', genre: 'max', valeur: ajouterJours(aujourdhui, -1) }]
    : [
        { colonne: 'echeance', genre: 'egal', valeur: aujourdhui },
        { colonne: 'heure', genre: 'vide' },
      ]
}

/** Agenda du jour : les tâches à faire aujourd'hui qui ont une heure. */
export function conditionsAgenda(aujourdhui: string): Filtre<'taches'>[] {
  return [
    A_FAIRE,
    { colonne: 'echeance', genre: 'egal', valeur: aujourdhui },
    { colonne: 'heure', genre: 'nonVide' },
  ]
}

/** À rappeler : les relances en retard, ou d'aujourd'hui sans heure. */
export function conditionsRelances(moment: Moment, aujourdhui: string): Filtre<'taches'>[] {
  return [
    A_FAIRE,
    { colonne: 'categorie', genre: 'egal', valeur: 'relance' },
    ...conditionsMoment(moment, aujourdhui),
  ]
}

/** Tâches : les autres tâches, en retard ou d'aujourd'hui sans heure. */
export function conditionsTaches(moment: Moment, aujourdhui: string): Filtre<'taches'>[] {
  return [
    A_FAIRE,
    { colonne: 'categorie', genre: 'parmi', valeur: CATEGORIES_HORS_RELANCE },
    ...conditionsMoment(moment, aujourdhui),
  ]
}

/** Le bloc dans lequel une tâche à faire apparaît, ou `null` si elle est pour plus tard. */
export function blocDeTache(
  tache: Pick<Tache, 'echeance' | 'heure' | 'categorie' | 'etat'>,
  aujourdhui: string,
): 'agenda' | 'relances' | 'taches' | null {
  if (tache.etat !== 'a_faire' || tache.echeance > aujourdhui) return null
  if (tache.echeance === aujourdhui && tache.heure !== null) return 'agenda'
  return tache.categorie === 'relance' ? 'relances' : 'taches'
}

/** Les lignes d'un bloc, et leur nombre total (qui peut dépasser les lignes lues). */
export type ContenuBloc<L> = { lignes: L[]; total: number }

/**
 * Réunit les parties d'un bloc lues séparément (en retard, puis d'aujourd'hui) : les lignes
 * dans l'ordre des parties, `limite` au plus ; le total est la somme des totaux.
 */
export function assembler<L>(
  parties: readonly { lignes: readonly L[]; total: number | null }[],
  limite: number,
): ContenuBloc<L> {
  return {
    lignes: parties.flatMap((partie) => partie.lignes).slice(0, limite),
    total: parties.reduce((somme, partie) => somme + (partie.total ?? partie.lignes.length), 0),
  }
}

// ---------------------------------------------------------------------------
// Agenda : adresse et itinéraire
// ---------------------------------------------------------------------------

/**
 * L'adresse où se rendre : le lieu du rendez-vous s'il est indiqué, sinon l'adresse du bien,
 * sinon celle du contact. `null` : aucune adresse connue.
 */
export function adresseRendezVous(
  tache: Pick<Tache, 'lieu'>,
  bien: Pick<Bien, 'adresse' | 'complement' | 'code_postal' | 'ville'> | null,
  contact: Pick<Contact, 'adresse' | 'code_postal' | 'ville'> | null,
): string | null {
  const lieu = tache.lieu.trim()
  if (lieu !== '') return lieu
  if (bien !== null && bien.adresse.trim() !== '') return adresseBien(bien)
  if (contact !== null && contact.adresse.trim() !== '') return adresseComplete(contact)
  return null
}

/** L'application de cartes à ouvrir : Plans sur iPhone, iPad et Mac, Google Maps ailleurs. */
export type Cartes = 'apple' | 'google'

export function cartesDeLAppareil(agent: string): Cartes {
  return /iPhone|iPad|iPod|Macintosh/.test(agent) ? 'apple' : 'google'
}

/**
 * Le lien qui ouvre l'application de cartes avec l'itinéraire jusqu'à cette adresse (depuis
 * la position actuelle). Sur téléphone, le lien ouvre directement l'application.
 */
export function lienItineraire(adresse: string, cartes: Cartes): string {
  const destination = encodeURIComponent(adresse.trim())
  return cartes === 'apple'
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

// ---------------------------------------------------------------------------
// À rappeler : retard (carte « Maintenant ») et texte sur une ligne
// ---------------------------------------------------------------------------

/** « Aujourd'hui », « En retard d'un jour », « En retard de 5 jours ». */
export function retardRelance(
  echeance: string,
  aujourdhui: string,
): { texte: string; enRetard: boolean } {
  const jours = ecartJours(echeance, aujourdhui)
  if (jours <= 0) return { texte: "Aujourd'hui", enRetard: false }
  return {
    texte: jours === 1 ? "En retard d'un jour" : `En retard de ${jours} jours`,
    enRetard: true,
  }
}

const LONGUEUR_RESUME = 90

/** Coupe un texte sur une ligne, avec des points de suspension s'il est trop long. */
export function enUneLigne(texte: string, longueur: number = LONGUEUR_RESUME): string {
  const ligne = texte.replace(/\s+/g, ' ').trim()
  return ligne.length <= longueur ? ligne : `${ligne.slice(0, longueur - 1).trimEnd()}…`
}

// ---------------------------------------------------------------------------
// Alertes et nouveautés : depuis combien de temps
// ---------------------------------------------------------------------------

/** « depuis 23 jours » : le calme d'un projet, compté en jours. */
export function joursDepuis(date: string, aujourdhui: string): number {
  return Math.max(0, ecartJours(date, aujourdhui))
}

/**
 * Le temps écoulé depuis un instant, pour une demande entrante : « à l'instant »,
 * « il y a 12 min », « il y a 3 h », « il y a 2 h 15 », « il y a 4 jours ».
 */
export function tempsEcoule(depuis: string, maintenant: Date): string {
  const instant = new Date(depuis).getTime()
  if (Number.isNaN(instant)) return ''
  const minutes = Math.floor((maintenant.getTime() - instant) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const heures = Math.floor(minutes / 60)
  if (heures < 24) {
    const reste = minutes % 60
    return reste === 0 || heures >= 6
      ? `il y a ${heures} h`
      : `il y a ${heures} h ${String(reste).padStart(2, '0')}`
  }
  const jours = Math.floor(heures / 24)
  return jours === 1 ? 'il y a 1 jour' : `il y a ${jours} jours`
}

/** La demande attend depuis plus d'une heure : elle aurait dû être qualifiée. */
export function qualificationEnRetard(depuis: string, maintenant: Date): boolean {
  const instant = new Date(depuis).getTime()
  return !Number.isNaN(instant) && maintenant.getTime() - instant > MINUTES_POUR_QUALIFIER * 60000
}

// ---------------------------------------------------------------------------
// Blocs repliés : mémoire de l'appareil
// ---------------------------------------------------------------------------

const CLE_REPLIS = 'immocrm.aujourdhui.replies'

/** Lit les blocs repliés, tels que mémorisés (texte JSON) ; ignore ce qui est illisible. */
export function lireReplis(memoire: string | null): CleBloc[] {
  try {
    const lu: unknown = JSON.parse(memoire ?? '[]')
    if (!Array.isArray(lu)) return []
    return BLOCS.filter((bloc) => lu.includes(bloc))
  } catch {
    return []
  }
}

/** Replie un bloc ouvert, ou rouvre un bloc replié. */
export function basculerRepli(replies: readonly CleBloc[], bloc: CleBloc): CleBloc[] {
  return replies.includes(bloc)
    ? replies.filter((cle) => cle !== bloc)
    : BLOCS.filter((cle) => cle === bloc || replies.includes(cle))
}

/** Les blocs repliés sur cet appareil (gardés d'une visite à l'autre). */
export function replisMemorises(): CleBloc[] {
  try {
    return lireReplis(window.localStorage.getItem(CLE_REPLIS))
  } catch {
    return []
  }
}

export function memoriserReplis(replies: readonly CleBloc[]): void {
  try {
    window.localStorage.setItem(CLE_REPLIS, JSON.stringify(replies))
  } catch {
    // Mémoire de l'appareil indisponible (navigation privée) : on s'en passe.
  }
}
