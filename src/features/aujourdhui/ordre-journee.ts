import { depuisQuand, ecartJours, formaterHeure } from '../../lib/dates'
import { libelleTypeActivite, libelleResultatAppel, type Activite } from '../activites/activites'
import { libelleRole, type Contact } from '../contacts/contacts'
import { libelleJour } from '../taches/echeances'
import type { Tache } from '../taches/taches'

/**
 * Écran « Aujourd'hui » : l'ordre et les regroupements des blocs « À rappeler » et
 * « Tâches », et la façon de dire chaque ligne. Fonctions pures, sans accès à la base.
 */

// ---------------------------------------------------------------------------
// Ordre : la plus urgente en premier
// ---------------------------------------------------------------------------

type TacheTriable = Pick<Tache, 'id' | 'echeance' | 'heure' | 'priorite' | 'created_at'>

/**
 * Compare deux tâches par urgence : la plus ancienne échéance d'abord (la plus en retard),
 * puis la priorité (haute avant normale avant basse), l'heure (une tâche sans heure après
 * celles qui en ont une), l'ancienneté de la saisie, et enfin l'identifiant pour un ordre
 * toujours le même.
 */
export function comparerUrgence(a: TacheTriable, b: TacheTriable): number {
  if (a.echeance !== b.echeance) return a.echeance < b.echeance ? -1 : 1
  if (a.priorite !== b.priorite) return a.priorite - b.priorite
  if (a.heure !== b.heure) {
    if (a.heure === null) return 1
    if (b.heure === null) return -1
    return a.heure < b.heure ? -1 : 1
  }
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Les lignes rangées par urgence, sans toucher à la liste reçue. */
export function parUrgence<L extends { tache: TacheTriable }>(lignes: readonly L[]): L[] {
  return [...lignes].sort((a, b) => comparerUrgence(a.tache, b.tache))
}

// ---------------------------------------------------------------------------
// À rappeler : filtre par rôle
// ---------------------------------------------------------------------------

export type FiltreRappels = 'tous' | 'vendeurs' | 'acquereurs'

export const FILTRES_RAPPELS: readonly { valeur: FiltreRappels; libelle: string }[] = [
  { valeur: 'tous', libelle: 'Tous' },
  { valeur: 'vendeurs', libelle: 'Vendeurs' },
  { valeur: 'acquereurs', libelle: 'Acquéreurs' },
]

const ROLE_DU_FILTRE: Record<Exclude<FiltreRappels, 'tous'>, string> = {
  vendeurs: 'vendeur',
  acquereurs: 'acquereur',
}

/**
 * Garde les relances du filtre, d'après les rôles du contact : un contact à la fois vendeur
 * et acquéreur est dans les deux. Une relance sans contact n'apparaît que dans « Tous ».
 */
export function filtrerRappels<L extends { contact: Pick<Contact, 'roles'> | null }>(
  lignes: readonly L[],
  filtre: FiltreRappels,
): L[] {
  if (filtre === 'tous') return [...lignes]
  const role = ROLE_DU_FILTRE[filtre]
  return lignes.filter((ligne) => ligne.contact?.roles.includes(role) === true)
}

/**
 * Le compteur du bloc selon le filtre. « Tous » : le total de la base. Avec un filtre, le
 * nombre de relances lues qui y correspondent ; si toutes les relances n'ont pas été lues
 * (au-delà de la limite de l'écran), le nombre est un minimum (`partiel`).
 */
export function compteurRappels(
  filtre: FiltreRappels,
  total: number,
  lues: number,
  filtrees: number,
): { nombre: number; partiel: boolean } {
  if (filtre === 'tous') return { nombre: total, partiel: false }
  return { nombre: filtrees, partiel: total > lues }
}

/**
 * Nombre de relances montrées d'emblée : au-delà, « Afficher les 12 autres » déplie la
 * suite. Sur téléphone, l'écran reste lisible et les blocs suivants à portée du pouce.
 */
export const RELANCES_D_EMBLEE = 10

/** Les relances à montrer, et combien restent repliées. */
export function premieresRelances<L>(
  lignes: readonly L[],
  toutes: boolean,
): { affichees: L[]; reste: number } {
  if (toutes || lignes.length <= RELANCES_D_EMBLEE) return { affichees: [...lignes], reste: 0 }
  return {
    affichees: lignes.slice(0, RELANCES_D_EMBLEE),
    reste: lignes.length - RELANCES_D_EMBLEE,
  }
}

/** Ce que dit le bloc quand le filtre ne laisse personne. */
export function videRappels(filtre: FiltreRappels): { titre: string; texte: string } {
  switch (filtre) {
    case 'tous':
      return { titre: 'Personne à rappeler.', texte: 'Toutes vos relances sont à jour.' }
    case 'vendeurs':
      return { titre: 'Aucun vendeur à rappeler.', texte: 'Vos vendeurs sont tous à jour.' }
    case 'acquereurs':
      return { titre: 'Aucun acquéreur à rappeler.', texte: 'Vos acquéreurs sont tous à jour.' }
  }
}

const CLE_FILTRE = 'immocrm.aujourdhui.filtre-rappels'

/** Lit le filtre mémorisé ; « Tous » si rien n'est mémorisé ou si la valeur est inconnue. */
export function lireFiltreRappels(memoire: string | null): FiltreRappels {
  return FILTRES_RAPPELS.find((option) => option.valeur === memoire)?.valeur ?? 'tous'
}

/** Le filtre choisi sur cet appareil (gardé d'une visite à l'autre). */
export function filtreRappelsMemorise(): FiltreRappels {
  try {
    return lireFiltreRappels(window.localStorage.getItem(CLE_FILTRE))
  } catch {
    return 'tous'
  }
}

export function memoriserFiltreRappels(filtre: FiltreRappels): void {
  try {
    window.localStorage.setItem(CLE_FILTRE, filtre)
  } catch {
    // Mémoire de l'appareil indisponible (navigation privée) : on s'en passe.
  }
}

// ---------------------------------------------------------------------------
// À rappeler : ce que dit une ligne
// ---------------------------------------------------------------------------

/**
 * Les rôles du contact, pour la ligne : « Vendeur », « Vendeur · Acquéreur ». Un contact
 * sans rôle est encore un prospect.
 */
export function rolesDuContact(contact: Pick<Contact, 'roles'>): string {
  return contact.roles.length === 0 ? 'Prospect' : contact.roles.map(libelleRole).join(' · ')
}

/**
 * La pastille de retard : « En retard · 2 j », et ce qu'entend un lecteur d'écran
 * (« En retard de 2 jours »). `null` pour une relance du jour : pas de pastille.
 */
export function pastilleRetard(
  echeance: string,
  aujourdhui: string,
): { texte: string; annonce: string } | null {
  const jours = ecartJours(echeance, aujourdhui)
  if (jours <= 0) return null
  return {
    texte: `En retard · ${jours} j`,
    annonce: jours === 1 ? "En retard d'un jour" : `En retard de ${jours} jours`,
  }
}

/** « rendez-vous », « SMS », « appel, messagerie » : le type en minuscules, sigles gardés. */
function typeEnMinuscules(activite: Pick<Activite, 'type' | 'resultat'>): string {
  const type = libelleTypeActivite(activite.type)
  const enMinuscules = type === type.toLocaleUpperCase('fr') ? type : type.toLocaleLowerCase('fr')
  const resultat = activite.type === 'appel' ? libelleResultatAppel(activite.resultat) : null
  return resultat === null ? enMinuscules : `${enMinuscules}, ${resultat.toLocaleLowerCase('fr')}`
}

/**
 * Le dernier échange avec le contact, en une ligne : « Dernier échange il y a 8 jours ·
 * rendez-vous ». Sans activité au journal : « Aucun échange au journal ».
 */
export function dernierEchange(
  activite: Pick<Activite, 'type' | 'resultat' | 'date_activite'> | null,
  aujourdhui: string,
): string {
  if (activite === null) return 'Aucun échange au journal'
  const jours = ecartJours(activite.date_activite, aujourdhui)
  return `Dernier échange ${depuisQuand(jours)} · ${typeEnMinuscules(activite)}`
}

// ---------------------------------------------------------------------------
// Tâches : « En retard » puis « Aujourd'hui »
// ---------------------------------------------------------------------------

export type GroupeTaches<L> = { cle: 'en_retard' | 'du_jour'; titre: string; lignes: L[] }

/**
 * Les tâches du bloc en deux groupes, « En retard » puis « Aujourd'hui », chacun rangé par
 * urgence. Un groupe vide n'apparaît pas.
 */
export function grouperTaches<L extends { tache: TacheTriable }>(
  lignes: readonly L[],
  aujourdhui: string,
): GroupeTaches<L>[] {
  const rangees = parUrgence(lignes)
  const groupes: GroupeTaches<L>[] = [
    {
      cle: 'en_retard',
      titre: 'En retard',
      lignes: rangees.filter((ligne) => ligne.tache.echeance < aujourdhui),
    },
    {
      cle: 'du_jour',
      titre: "Aujourd'hui",
      lignes: rangees.filter((ligne) => ligne.tache.echeance >= aujourdhui),
    },
  ]
  return groupes.filter((groupe) => groupe.lignes.length > 0)
}

/**
 * L'échéance affichée à droite d'une tâche : « Hier », « lun. 16 nov. » pour une tâche en
 * retard ; l'heure (« 17 h 30 ») pour une tâche du jour qui en a une, sinon rien (le titre
 * du groupe le dit déjà).
 */
export function echeanceADroite(
  tache: Pick<Tache, 'echeance' | 'heure'>,
  aujourdhui: string,
): string {
  if (tache.echeance < aujourdhui) return libelleJour(tache.echeance, aujourdhui)
  return formaterHeure(tache.heure)
}
