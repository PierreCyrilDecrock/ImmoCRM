import { estDateValide } from '../../lib/dates'
import { LONGUEURS_MAX_TACHE } from '../taches/taches'

/**
 * La prochaine action d'une saisie express (nouveau contact, compte rendu). Règle du
 * cadrage : aucun contact sans prochaine action datée. Le titre et la date sont proposés
 * (la date selon la température du contact) ; tant qu'on n'y touche pas, ils suivent la
 * saisie (le nom tapé, la température choisie). Dès qu'on les change, ils sont gardés.
 */

/**
 *   - `planifier` : une tâche est créée (le cas ordinaire) ;
 *   - `deja_prevue` : le contact a déjà une action à venir, rien de plus n'est créé ;
 *   - `aucune` : rien n'est prévu ; le contact rejoindra les « sans prochaine action ».
 */
export type ModeProchaine = 'planifier' | 'deja_prevue' | 'aucune'

export type BrouillonProchaine = {
  mode: ModeProchaine
  /** `null` : le titre proposé, qui suit la saisie. */
  titre: string | null
  /** `null` : la date proposée, qui suit la température. */
  echeance: string | null
}

export type ProchaineProposee = { titre: string; echeance: string }

export type ErreursProchaine = Partial<Record<'titre' | 'echeance', string>>

export function prochaineVide(mode: ModeProchaine = 'planifier'): BrouillonProchaine {
  return { mode, titre: null, echeance: null }
}

/** Le titre et la date tels qu'ils s'affichent : saisis, sinon proposés. */
export function prochaineAffichee(
  brouillon: BrouillonProchaine,
  proposee: ProchaineProposee,
): ProchaineProposee {
  return {
    titre: brouillon.titre ?? proposee.titre,
    echeance: brouillon.echeance ?? proposee.echeance,
  }
}

/**
 * Vérifie la prochaine action. Renvoie la tâche à créer, ou `null` quand il n'y en a pas
 * (déjà prévue, ou rien de prévu).
 */
export function verifierProchaine(
  brouillon: BrouillonProchaine,
  proposee: ProchaineProposee,
  aujourdhui: string,
): { ok: true; tache: ProchaineProposee | null } | { ok: false; erreurs: ErreursProchaine } {
  if (brouillon.mode !== 'planifier') return { ok: true, tache: null }
  const { titre: saisi, echeance } = prochaineAffichee(brouillon, proposee)
  const titre = saisi.trim()
  const erreurs: ErreursProchaine = {}
  if (titre === '') erreurs.titre = 'Indiquez la prochaine action.'
  else if (titre.length > LONGUEURS_MAX_TACHE.titre) {
    erreurs.titre = `${LONGUEURS_MAX_TACHE.titre} caractères au plus.`
  }
  if (!estDateValide(echeance)) erreurs.echeance = 'Choisissez une date.'
  else if (echeance < aujourdhui) {
    erreurs.echeance = 'La prochaine action se prévoit à partir d’aujourd’hui.'
  }
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return { ok: true, tache: { titre, echeance } }
}
