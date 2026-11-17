import type { Filtre } from '../../lib/donnees'
import { lireNombre } from '../../lib/nombres'
import { MAX_TERMES, normaliserRecherche } from '../../lib/recherche'
import {
  CATEGORIES_BIEN,
  STATUTS_BIEN,
  TYPES_BIEN,
  type CategorieBien,
  type StatutBien,
  type TypeBien,
} from './biens'

/**
 * Recherche et filtres de la liste des biens. Ils se combinent (toutes les conditions à la
 * fois) et sont gardés en mémoire tant que l'onglet reste ouvert.
 */
export type FiltresBiens = {
  /** Ce qui est tapé dans le champ de recherche : un morceau d'adresse. */
  recherche: string
  type: TypeBien | ''
  categorie: CategorieBien | ''
  statut: StatutBien | ''
  /** Fourchette de prix, telle qu'elle est saisie. */
  prixMin: string
  prixMax: string
}

export const FILTRES_BIENS_VIDES: FiltresBiens = {
  recherche: '',
  type: '',
  categorie: '',
  statut: '',
  prixMin: '',
  prixMax: '',
}

/**
 * Découpe une saisie en mots à chercher dans l'adresse (chacun doit y figurer), mis en forme
 * comme la base range le texte cherchable : sans accent ni majuscule.
 */
export function termesAdresse(saisie: string): string[] {
  const mots = normaliserRecherche(saisie)
    .split(' ')
    .filter((mot) => mot !== '')
    .map((mot) => mot.slice(0, 50))
  return [...new Set(mots)].slice(0, MAX_TERMES)
}

/** Un prix de la fourchette : `null` s'il est vide ou illisible (il est alors ignoré). */
function prixFiltre(saisie: string): number | null {
  const prix = lireNombre(saisie)
  return prix === 'invalide' ? null : prix
}

/** Vrai si une borne de prix est saisie mais illisible : l'écran le signale. */
export function prixIllisible(saisie: string): boolean {
  return lireNombre(saisie) === 'invalide'
}

/** Nombre de filtres choisis (la recherche ne compte pas). */
export function nombreFiltresBiens(filtres: FiltresBiens): number {
  return [
    filtres.type !== '',
    filtres.categorie !== '',
    filtres.statut !== '',
    prixFiltre(filtres.prixMin) !== null,
    prixFiltre(filtres.prixMax) !== null,
  ].filter(Boolean).length
}

/** Vrai si la liste est restreinte par une recherche ou par un filtre. */
export function listeBiensRestreinte(filtres: FiltresBiens): boolean {
  return termesAdresse(filtres.recherche).length > 0 || nombreFiltresBiens(filtres) > 0
}

/** Traduit recherche et filtres en conditions pour la base. */
export function conditionsBiens(filtres: FiltresBiens): Filtre<'biens'>[] {
  const conditions: Filtre<'biens'>[] = termesAdresse(filtres.recherche).map((terme) => ({
    colonne: 'recherche',
    genre: 'contient',
    valeur: terme,
  }))
  if (filtres.type !== '') conditions.push({ colonne: 'type', genre: 'egal', valeur: filtres.type })
  if (filtres.categorie !== '') {
    conditions.push({ colonne: 'categorie', genre: 'egal', valeur: filtres.categorie })
  }
  if (filtres.statut !== '') {
    conditions.push({ colonne: 'statut', genre: 'egal', valeur: filtres.statut })
  }
  // Avec une borne de prix, les biens sans prix ne sont pas listés.
  const min = prixFiltre(filtres.prixMin)
  const max = prixFiltre(filtres.prixMax)
  if (min !== null) conditions.push({ colonne: 'prix', genre: 'min', valeur: min })
  if (max !== null) conditions.push({ colonne: 'prix', genre: 'max', valeur: max })
  return conditions
}

function parmi<V extends string>(options: readonly { valeur: V }[], valeur: unknown): V | '' {
  return options.find((option) => option.valeur === valeur)?.valeur ?? ''
}

function texte(valeur: unknown, longueurMax: number): string {
  return typeof valeur === 'string' ? valeur.slice(0, longueurMax) : ''
}

/** Relit des filtres mis en mémoire. Tout ce qui est illisible ou inconnu est ignoré. */
export function lireFiltresBiens(memoire: string | null): FiltresBiens {
  if (memoire === null) return FILTRES_BIENS_VIDES
  let lu: unknown
  try {
    lu = JSON.parse(memoire)
  } catch {
    return FILTRES_BIENS_VIDES
  }
  if (typeof lu !== 'object' || lu === null) return FILTRES_BIENS_VIDES
  const valeurs = lu as Record<string, unknown>
  return {
    recherche: texte(valeurs.recherche, 200),
    type: parmi(TYPES_BIEN, valeurs.type),
    categorie: parmi(CATEGORIES_BIEN, valeurs.categorie),
    statut: parmi(STATUTS_BIEN, valeurs.statut),
    prixMin: texte(valeurs.prixMin, 20),
    prixMax: texte(valeurs.prixMax, 20),
  }
}

const CLE_MEMOIRE = 'immocrm.filtres-biens'

/** Filtres gardés depuis le dernier passage sur la liste (vides au premier). */
export function filtresBiensMemorises(): FiltresBiens {
  try {
    return lireFiltresBiens(window.sessionStorage.getItem(CLE_MEMOIRE))
  } catch {
    // Mémoire du navigateur indisponible (navigation privée stricte) : on fait sans.
    return FILTRES_BIENS_VIDES
  }
}

/** Garde les filtres jusqu'à la fermeture de l'onglet. */
export function memoriserFiltresBiens(filtres: FiltresBiens): void {
  try {
    window.sessionStorage.setItem(CLE_MEMOIRE, JSON.stringify(filtres))
  } catch {
    // Sans mémoire, les filtres ne sont simplement pas retenus.
  }
}
