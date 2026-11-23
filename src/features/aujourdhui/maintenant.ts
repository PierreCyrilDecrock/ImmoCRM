import { formaterDuree, formaterHeure, heureDeFin, minutesDuJour } from '../../lib/dates'
import type { Tache, TacheAffichee } from '../taches/taches'

/**
 * Écran « Aujourd'hui » : ce qui vient maintenant. Le choix du rendez-vous de la carte
 * « Maintenant », son temps restant, la place du trait « maintenant » dans l'agenda et ce
 * qu'il reste à préparer. Fonctions pures : l'heure est donnée en minutes depuis minuit, à
 * Paris (`minutesDuJour(heureDuMoment())`).
 */

/**
 * Un rendez-vous sans durée est tenu pour durer une demi-heure : il reste « en cours » ce
 * temps-là, puis il passe sous le trait « maintenant ».
 */
export const DUREE_SANS_FIN = 30

/** Au plus ce nombre de tâches « À préparer » sur la carte. */
export const LIMITE_A_PREPARER = 4

/** Le début et la fin d'un rendez-vous, en minutes depuis minuit ; `null` sans heure lisible. */
export function bornesRendezVous(
  tache: Pick<Tache, 'heure' | 'duree'>,
): { debut: number; fin: number } | null {
  if (tache.heure === null) return null
  const debut = minutesDuJour(tache.heure)
  if (debut === null) return null
  return { debut, fin: debut + (tache.duree ?? DUREE_SANS_FIN) }
}

export type EtatRendezVous = 'passe' | 'en_cours' | 'a_venir'

/** Où en est un rendez-vous du jour à cette heure ; un rendez-vous sans heure est « à venir ». */
export function etatRendezVous(
  tache: Pick<Tache, 'heure' | 'duree'>,
  minutes: number,
): EtatRendezVous {
  const bornes = bornesRendezVous(tache)
  if (bornes === null || minutes < bornes.debut) return 'a_venir'
  return minutes < bornes.fin ? 'en_cours' : 'passe'
}

/** Ce que montre la carte « Maintenant ». */
export type ChoixMaintenant<R> =
  | { genre: 'rendez_vous'; affichee: TacheAffichee; enCours: boolean }
  | { genre: 'relance'; relance: R }

/**
 * Le rendez-vous en cours (s'il y en a plusieurs, celui qui a commencé le plus tard : un
 * rendez-vous pris pendant un créneau de prospection passe devant), sinon le prochain de la
 * journée. Après le dernier, la première relance du jour ; s'il n'y a plus rien, `null` :
 * la carte disparaît.
 */
export function choisirMaintenant<R>(
  agenda: readonly TacheAffichee[],
  relances: readonly R[],
  minutes: number,
): ChoixMaintenant<R> | null {
  let enCours: { affichee: TacheAffichee; debut: number } | null = null
  let prochain: { affichee: TacheAffichee; debut: number } | null = null
  for (const affichee of agenda) {
    const bornes = bornesRendezVous(affichee.tache)
    if (bornes === null) continue
    const { debut } = bornes
    const etat = etatRendezVous(affichee.tache, minutes)
    if (etat === 'en_cours' && (enCours === null || debut > enCours.debut)) {
      enCours = { affichee, debut }
    }
    if (etat === 'a_venir' && (prochain === null || debut < prochain.debut)) {
      prochain = { affichee, debut }
    }
  }
  if (enCours !== null) return { genre: 'rendez_vous', affichee: enCours.affichee, enCours: true }
  if (prochain !== null)
    return { genre: 'rendez_vous', affichee: prochain.affichee, enCours: false }
  const relance = relances[0]
  return relance === undefined ? null : { genre: 'relance', relance }
}

/**
 * Le temps qui reste avant le rendez-vous : « En cours », « Dans 25 min », « Dans 1 h 15 »,
 * « Dans 4 h » (à l'heure près au-delà de trois heures), « Terminé ».
 */
export function tempsRestant(tache: Pick<Tache, 'heure' | 'duree'>, minutes: number): string {
  const bornes = bornesRendezVous(tache)
  if (bornes === null) return ''
  const etat = etatRendezVous(tache, minutes)
  if (etat === 'en_cours') return 'En cours'
  if (etat === 'passe') return 'Terminé'
  const reste = bornes.debut - minutes
  if (reste < 60) return `Dans ${reste} min`
  const heures = Math.floor(reste / 60)
  const minutesRestantes = reste % 60
  return minutesRestantes === 0 || heures >= 3
    ? `Dans ${heures} h`
    : `Dans ${heures} h ${String(minutesRestantes).padStart(2, '0')}`
}

/**
 * La place du trait « maintenant » dans l'agenda (rangé par heure) : devant le premier
 * rendez-vous qui n'a pas encore commencé. Un rendez-vous en cours reste au-dessus du trait.
 */
export function placeDuTrait(
  agenda: readonly { tache: Pick<Tache, 'heure' | 'duree'> }[],
  minutes: number,
): number {
  const place = agenda.findIndex(({ tache }) => etatRendezVous(tache, minutes) === 'a_venir')
  return place === -1 ? agenda.length : place
}

// ---------------------------------------------------------------------------
// Agenda du jour, en frise
// ---------------------------------------------------------------------------

/**
 * Le rendez-vous déjà montré par la carte « Maintenant » : dans l'agenda, il porte la marque
 * « Ci-dessus » et aucun geste (ils sont dans la carte). `null` si la carte montre une
 * relance ou n'est pas affichée.
 */
export function rendezVousCiDessus<R>(choix: ChoixMaintenant<R> | null): string | null {
  return choix !== null && choix.genre === 'rendez_vous' ? choix.affichee.id : null
}

/**
 * La fiche qu'ouvre le toucher sur un rendez-vous de l'agenda : celle du bien, sinon celle
 * du contact. `null` sans l'un ni l'autre : le toucher ouvre alors le rendez-vous lui-même.
 */
export function ficheDuRendezVous(affichee: {
  contact: { id: string } | null
  bien: { id: string } | null
}): string | null {
  if (affichee.bien !== null) return `/biens/${affichee.bien.id}`
  if (affichee.contact !== null) return `/contacts/${affichee.contact.id}`
  return null
}

/**
 * La seconde ligne d'un rendez-vous de la frise : la durée, puis le lieu, ou à défaut le
 * contact (« 1 h 30 · 12 rue des Essais, Lyon », « 45 min · Camille Fictif »). Ce qui manque
 * est omis ; rien du tout : une chaîne vide.
 */
export function detailRendezVous(
  duree: number | null,
  lieu: string | null,
  contact: string | null,
): string {
  const ou = lieu ?? contact
  return [duree === null || duree <= 0 ? null : formaterDuree(duree), ou]
    .filter((morceau) => morceau !== null && morceau !== '')
    .join(' · ')
}

/**
 * « À préparer » : les autres tâches à faire du jour (ou en retard) liées au même contact
 * ou au même bien que le rendez-vous, sans doublon, `LIMITE_A_PREPARER` au plus.
 */
export function aPreparer(
  rendezVous: TacheAffichee,
  taches: readonly TacheAffichee[],
): TacheAffichee[] {
  const { contact_id, bien_id } = rendezVous.tache
  const vues = new Set<string>([rendezVous.id])
  const retenues: TacheAffichee[] = []
  for (const affichee of taches) {
    if (vues.has(affichee.id) || affichee.tache.etat !== 'a_faire') continue
    const memeContact = contact_id !== null && affichee.tache.contact_id === contact_id
    const memeBien = bien_id !== null && affichee.tache.bien_id === bien_id
    if (!memeContact && !memeBien) continue
    vues.add(affichee.id)
    retenues.push(affichee)
    if (retenues.length === LIMITE_A_PREPARER) break
  }
  return retenues
}

// ---------------------------------------------------------------------------
// En-tête : salutation, résumé de la journée et progression
// ---------------------------------------------------------------------------

/** « Bonjour Camille », ou « Bonjour » si aucun nom n'est indiqué dans Réglages. */
export function salutation(nomAffiche: string): string {
  const nom = nomAffiche.replace(/\s+/g, ' ').trim()
  return nom === '' ? 'Bonjour' : `Bonjour ${nom}`
}

/** La fin du dernier rendez-vous : son heure, et si elle vient d'une durée (« finit vers »). */
export type FinDeJournee = { heure: string; minutes: number; avecDuree: boolean }

/**
 * Le rendez-vous qui finit le plus tard. Sans durée, on ne connaît que son heure de début
 * (« commence à »). `null` : aucun rendez-vous.
 */
export function finDuDernierRendezVous(
  agenda: readonly Pick<Tache, 'heure' | 'duree'>[],
): FinDeJournee | null {
  let derniere: FinDeJournee | null = null
  for (const tache of agenda) {
    if (tache.heure === null) continue
    const fin = tache.duree === null ? null : heureDeFin(tache.heure, tache.duree)
    const heure = fin ?? tache.heure.slice(0, 5)
    const minutes = minutesDuJour(heure)
    if (minutes === null) continue
    if (derniere === null || minutes > derniere.minutes) {
      derniere = { heure, minutes, avecDuree: fin !== null }
    }
  }
  return derniere
}

function compteRendezVous(nombre: number): string {
  if (nombre === 0) return 'Aucun rendez-vous'
  return nombre === 1 ? 'Un rendez-vous' : `${nombre} rendez-vous`
}

function comptePersonnes(nombre: number): string {
  if (nombre === 0) return 'personne à rappeler'
  return nombre === 1 ? 'une personne à rappeler' : `${nombre} personnes à rappeler`
}

/**
 * La journée en une ou deux phrases : « 4 rendez-vous et 4 personnes à rappeler. Votre
 * dernier rendez-vous finit vers 18 h 15. » Zéro et un ont leur propre tournure. La seconde
 * phrase disparaît quand ce moment est passé.
 */
export function resumeJournee(journee: {
  rendezVous: number
  rappels: number
  fin: FinDeJournee | null
  /** L'heure qu'il est, en minutes depuis minuit. */
  minutes: number
}): string {
  const { rendezVous, rappels, fin, minutes } = journee
  const premiere =
    rendezVous === 0 && rappels === 0
      ? 'Ni rendez-vous ni personne à rappeler aujourd’hui.'
      : rendezVous > 0 && rappels > 0
        ? `${compteRendezVous(rendezVous)} et ${comptePersonnes(rappels)}.`
        : `${compteRendezVous(rendezVous)}, ${comptePersonnes(rappels)}.`
  if (rendezVous === 0 || fin === null || fin.minutes <= minutes) return premiere
  const sujet = rendezVous === 1 ? 'Votre rendez-vous' : 'Votre dernier rendez-vous'
  const quand = fin.avecDuree
    ? `finit vers ${formaterHeure(fin.heure)}`
    : `commence à ${formaterHeure(fin.heure)}`
  return `${premiere} ${sujet} ${quand}.`
}

/** L'anneau « 3 sur 7 faits ». */
export type Progression = {
  faites: number
  total: number
  /** De 0 à 1. */
  part: number
  /** « 3 sur 7 ». */
  texte: string
  /** « faits » ou « fait ». */
  suite: string
  /** Lu par les lecteurs d'écran : « Progression de la journée : 3 tâches faites sur 7 prévues. » */
  annonce: string
}

/**
 * La progression du jour : les tâches et relances prévues aujourd'hui ou en retard (encore à
 * faire) plus celles faites aujourd'hui. `null` (l'anneau disparaît) s'il n'y a rien de
 * prévu ou si un des nombres n'a pas pu être lu.
 */
export function progression(aFaire: number | null, faites: number | null): Progression | null {
  if (aFaire === null || faites === null) return null
  const total = aFaire + faites
  if (total <= 0) return null
  const faitesTexte =
    faites === 0 ? 'aucune tâche faite' : faites === 1 ? '1 tâche faite' : `${faites} tâches faites`
  return {
    faites,
    total,
    part: faites / total,
    texte: `${faites} sur ${total}`,
    suite: faites > 1 ? 'faits' : 'fait',
    annonce: `Progression de la journée : ${faitesTexte} sur ${total} ${total > 1 ? 'prévues' : 'prévue'}.`,
  }
}
