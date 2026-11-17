import type { Filtre } from '../../lib/donnees'
import { termesRecherche } from '../../lib/recherche'
import { ROLES, SOURCES, TEMPERATURES, type Role, type Source, type Temperature } from './contacts'

/**
 * Recherche et filtres de la liste des contacts. Ils se combinent (toutes les conditions
 * à la fois) et sont gardés en mémoire tant que l'onglet reste ouvert.
 */
export type FiltresContacts = {
  /** Ce qui est tapé dans le champ de recherche. */
  recherche: string
  role: Role | ''
  etiquette: string
  source: Source | ''
  temperature: Temperature | ''
  /** Vue « Contacts sans prochaine action » : seulement les fiches où rien n'est prévu. */
  sansAction: boolean
}

export const FILTRES_VIDES: FiltresContacts = {
  recherche: '',
  role: '',
  etiquette: '',
  source: '',
  temperature: '',
  sansAction: false,
}

/** Nombre de filtres choisis (ni la recherche ni la vue ne comptent). */
export function nombreFiltres(filtres: FiltresContacts): number {
  return [filtres.role, filtres.etiquette, filtres.source, filtres.temperature].filter(
    (valeur) => valeur !== '',
  ).length
}

/** Vrai si la liste est restreinte par une recherche ou par un filtre. */
export function listeRestreinte(filtres: FiltresContacts): boolean {
  return termesRecherche(filtres.recherche).length > 0 || nombreFiltres(filtres) > 0
}

/** Traduit recherche et filtres en conditions pour la base. */
export function conditionsContacts(filtres: FiltresContacts): Filtre<'contacts'>[] {
  const conditions: Filtre<'contacts'>[] = termesRecherche(filtres.recherche).map((terme) => ({
    colonne: 'recherche',
    genre: 'contient',
    valeur: terme,
  }))
  if (filtres.role !== '') {
    conditions.push({ colonne: 'roles', genre: 'comprend', valeur: [filtres.role] })
  }
  if (filtres.etiquette !== '') {
    conditions.push({ colonne: 'etiquettes', genre: 'comprend', valeur: [filtres.etiquette] })
  }
  if (filtres.source !== '') {
    conditions.push({ colonne: 'source', genre: 'egal', valeur: filtres.source })
  }
  if (filtres.temperature !== '') {
    conditions.push({ colonne: 'temperature', genre: 'egal', valeur: filtres.temperature })
  }
  if (filtres.sansAction) {
    conditions.push({ colonne: 'prochaine_action_le', genre: 'vide' })
  }
  return conditions
}

function parmi<V extends string>(options: readonly { valeur: V }[], valeur: unknown): V | '' {
  return options.find((option) => option.valeur === valeur)?.valeur ?? ''
}

function texte(valeur: unknown, longueurMax: number): string {
  return typeof valeur === 'string' ? valeur.slice(0, longueurMax) : ''
}

/** Relit des filtres mis en mémoire. Tout ce qui est illisible ou inconnu est ignoré. */
export function lireFiltres(memoire: string | null): FiltresContacts {
  if (memoire === null) return FILTRES_VIDES
  let lu: unknown
  try {
    lu = JSON.parse(memoire)
  } catch {
    return FILTRES_VIDES
  }
  if (typeof lu !== 'object' || lu === null) return FILTRES_VIDES
  const valeurs = lu as Record<string, unknown>
  return {
    recherche: texte(valeurs.recherche, 200),
    role: parmi(ROLES, valeurs.role),
    etiquette: texte(valeurs.etiquette, 30),
    source: parmi(SOURCES, valeurs.source),
    temperature: parmi(TEMPERATURES, valeurs.temperature),
    sansAction: valeurs.sansAction === true,
  }
}

const CLE_MEMOIRE = 'immocrm.filtres-contacts'

/** Filtres gardés depuis le dernier passage sur la liste (vides au premier). */
export function filtresMemorises(): FiltresContacts {
  try {
    return lireFiltres(window.sessionStorage.getItem(CLE_MEMOIRE))
  } catch {
    // Mémoire du navigateur indisponible (navigation privée stricte) : on fait sans.
    return FILTRES_VIDES
  }
}

/** Garde les filtres jusqu'à la fermeture de l'onglet. */
export function memoriserFiltres(filtres: FiltresContacts): void {
  try {
    window.sessionStorage.setItem(CLE_MEMOIRE, JSON.stringify(filtres))
  } catch {
    // Sans mémoire, les filtres ne sont simplement pas retenus.
  }
}
