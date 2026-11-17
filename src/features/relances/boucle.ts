import type { SupabaseClient } from '@supabase/supabase-js'
import { appeler, type Resultat } from '../../lib/donnees'
import { estDateValide, estHeureValide } from '../../lib/dates'
import type { Database } from '../../lib/types-base'
import {
  LONGUEUR_MAX_COMPTE_RENDU,
  RESULTATS_APPEL,
  type ResultatAppel,
  type TypeActivite,
} from '../activites/activites'
import { nomComplet, TEMPERATURES, type Contact, type Temperature } from '../contacts/contacts'
import {
  LONGUEURS_MAX_TACHE,
  suivanteDeSerie,
  type CategorieTache,
  type Tache,
} from '../taches/taches'
import { proposerRelance, type DelaisRelance } from './delais'

/**
 * Boucle de relance : une tâche liée à un contact est faite. Un seul écran, en trois
 * temps — le résultat, un compte rendu court, la prochaine action préremplie — pour tenir
 * les deux règles du cadrage : clôturer une tâche crée une activité et propose aussitôt la
 * suivante ; aucun contact sans prochaine action datée.
 */

/** Les résultats proposés pour une relance par téléphone. */
export const RESULTATS_RELANCE = RESULTATS_APPEL.filter((option) => option.valeur !== 'rappeler')

/** L'activité qu'une tâche faite inscrit au journal, selon sa catégorie. */
const TYPE_PAR_CATEGORIE: Record<CategorieTache, TypeActivite> = {
  relance: 'appel',
  prospection: 'appel',
  rendez_vous: 'rendez_vous',
  visite: 'visite',
  estimation: 'estimation',
  administratif: 'autre',
  autre: 'autre',
}

export function typeActiviteDeTache(categorie: string): TypeActivite {
  return categorie in TYPE_PAR_CATEGORIE ? TYPE_PAR_CATEGORIE[categorie as CategorieTache] : 'autre'
}

/** Titre proposé pour la prochaine relance : « Relancer Camille Fictif ». */
export function titreRelance(contact: Contact): string {
  return `Relancer ${nomComplet(contact)}`.slice(0, LONGUEURS_MAX_TACHE.titre)
}

/** Une action déjà prévue pour le contact une fois la tâche close. */
export type SuitePrevue = { titre: string; echeance: string; serie: boolean }

/**
 * Ce qui restera prévu pour le contact quand la tâche sera faite : l'occurrence suivante
 * d'une série, ou une autre tâche à faire déjà liée au contact. La plus proche des deux ;
 * `null` s'il n'y a rien.
 */
export function suitePrevue(
  tache: Tache,
  autres: readonly Tache[],
  aujourdhui: string,
): SuitePrevue | null {
  const candidates: SuitePrevue[] = autres
    .filter((autre) => autre.id !== tache.id && autre.etat === 'a_faire')
    .map((autre) => ({ titre: autre.titre, echeance: autre.echeance, serie: false }))
  const suivante = suivanteDeSerie(tache, aujourdhui)
  if (suivante !== null) {
    candidates.push({ titre: tache.titre, echeance: suivante.echeance, serie: true })
  }
  return candidates.sort((a, b) => a.echeance.localeCompare(b.echeance))[0] ?? null
}

/**
 * Ce qu'il advient du contact après la tâche :
 *   - `planifier` : une nouvelle tâche est créée (le cas ordinaire) ;
 *   - `deja_prevue` : rien de plus, une autre action reste prévue ;
 *   - `aucune` : rien n'est prévu, refus confirmé : la fiche est marquée « sans prochaine
 *     action ».
 */
export type ModeSuite = 'planifier' | 'deja_prevue' | 'aucune'

/** L'écran de la boucle, tel qu'il est saisi. */
export type BrouillonBoucle = {
  type: TypeActivite
  resultat: ResultatAppel | ''
  compteRendu: string
  mode: ModeSuite
  /** Température du contact, modifiable pendant la boucle ; vide si elle n'est pas connue. */
  temperature: Temperature | ''
  titre: string
  categorie: CategorieTache
  echeance: string
  /** `HH:MM`, ou vide. */
  heure: string
  motif: string
}

export type ErreursBoucle = Partial<
  Record<'compteRendu' | 'titre' | 'echeance' | 'heure' | 'mode', string>
>

function temperatureConnue(valeur: string | null): Temperature | '' {
  return TEMPERATURES.find((option) => option.valeur === valeur)?.valeur ?? ''
}

/**
 * L'écran prérempli : l'activité qui correspond à la tâche, et une relance à la date que
 * donne la température du contact. Si une autre action reste prévue, rien de plus n'est
 * proposé par défaut.
 */
export function brouillonBoucle(
  tache: Tache,
  contact: Contact,
  contexte: { aujourdhui: string; delais: DelaisRelance; suite: SuitePrevue | null },
): BrouillonBoucle {
  const temperature = temperatureConnue(contact.temperature)
  return {
    type: typeActiviteDeTache(tache.categorie),
    resultat: '',
    compteRendu: '',
    mode: contexte.suite === null ? 'planifier' : 'deja_prevue',
    temperature,
    titre: titreRelance(contact),
    categorie: 'relance',
    echeance: proposerRelance(contexte.aujourdhui, temperature || null, contexte.delais).echeance,
    heure: '',
    motif: '',
  }
}

/** Ce qui est envoyé à la base (fonction `boucler_tache`). */
export type ParametresBoucle = Database['public']['Functions']['boucler_tache']['Args']

/**
 * Vérifie l'écran et prépare l'envoi. La prochaine action se prévoit à partir
 * d'aujourd'hui ; « rien de plus » n'est possible que si une autre action reste prévue.
 * La température n'est envoyée que si elle a changé.
 */
export function preparerBoucle(
  brouillon: BrouillonBoucle,
  contexte: { tache: Tache; contact: Contact; aujourdhui: string; suite: SuitePrevue | null },
): { ok: true; parametres: ParametresBoucle } | { ok: false; erreurs: ErreursBoucle } {
  const { tache, contact, aujourdhui, suite } = contexte
  const erreurs: ErreursBoucle = {}
  const compteRendu = brouillon.compteRendu.trim()
  if (compteRendu.length > LONGUEUR_MAX_COMPTE_RENDU) {
    erreurs.compteRendu = `${LONGUEUR_MAX_COMPTE_RENDU} caractères au plus.`
  }

  const planifier = brouillon.mode === 'planifier'
  const titre = brouillon.titre.trim()
  const heure = brouillon.heure.trim()
  if (planifier) {
    if (titre === '') erreurs.titre = 'Indiquez la prochaine action.'
    else if (titre.length > LONGUEURS_MAX_TACHE.titre) {
      erreurs.titre = `${LONGUEURS_MAX_TACHE.titre} caractères au plus.`
    }
    if (!estDateValide(brouillon.echeance)) erreurs.echeance = 'Choisissez une date.'
    else if (brouillon.echeance < aujourdhui) {
      erreurs.echeance = 'La prochaine action se prévoit à partir d’aujourd’hui.'
    }
    if (heure !== '' && !estHeureValide(heure)) erreurs.heure = 'Heure illisible. Exemple : 14:30.'
  }
  if (brouillon.mode === 'deja_prevue' && suite === null) {
    erreurs.mode =
      'Aucune autre action n’est prévue : prévoyez la suite, ou confirmez qu’il n’y en aura pas.'
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }

  const serie = suivanteDeSerie(tache, aujourdhui)
  const temperature =
    brouillon.temperature !== '' && brouillon.temperature !== contact.temperature
      ? brouillon.temperature
      : undefined

  return {
    ok: true,
    parametres: {
      p_id: tache.id,
      p_type: brouillon.type,
      ...(brouillon.type === 'appel' && brouillon.resultat !== ''
        ? { p_resultat: brouillon.resultat }
        : {}),
      p_compte_rendu: compteRendu,
      ...(serie === null
        ? {}
        : { p_suivante_echeance: serie.echeance, p_suivante_rang: serie.rang }),
      ...(planifier
        ? {
            p_prochaine_titre: titre,
            p_prochaine_categorie: brouillon.categorie,
            p_prochaine_echeance: brouillon.echeance,
            ...(heure === '' ? {} : { p_prochaine_heure: heure }),
            p_prochaine_motif: brouillon.motif.trim().slice(0, LONGUEURS_MAX_TACHE.motif),
          }
        : {}),
      ...(temperature === undefined ? {} : { p_temperature: temperature }),
      p_sans_prochaine_action: brouillon.mode === 'aucune',
    },
  }
}

/**
 * Enregistre la boucle en une seule opération : tâche faite, activité au journal,
 * prochaine action (ou refus confirmé). Renvoie les tâches créées (suite de la série,
 * prochaine action).
 */
export async function bouclerTache(
  client: SupabaseClient,
  parametres: ParametresBoucle,
): Promise<Resultat<Tache[]>> {
  const resultat = await appeler(client, 'boucler_tache', parametres)
  if (!resultat.ok && resultat.erreur.genre === 'invalide') {
    return {
      ok: false,
      erreur: {
        genre: 'invalide',
        message:
          'La base a refusé l’enregistrement : la tâche a peut-être déjà été close, depuis un autre appareil. Rechargez la page.',
      },
    }
  }
  return resultat
}
