import type { RubriqueAFaire, Tranche } from './echeances'
import type { Tache } from './taches'

/**
 * L'onglet « À faire » de la page Tâches (étape F.1, proposition 1 de la revue n° 2) : les
 * tâches en retard puis celles du jour, en deux rubriques titrées. La pastille de la
 * navigation compte les retards ; elle mène ici, où ils sont en tête (règle 9 : un compteur
 * mène à ce qu'il compte).
 */

type TacheTriable = Pick<Tache, 'echeance' | 'heure' | 'priorite'>

const TITRES: Record<RubriqueAFaire, string> = {
  en_retard: 'En retard',
  aujourdhui: "Aujourd'hui",
}

/**
 * L'ordre des tâches à faire : la plus ancienne échéance d'abord ; le même jour, les tâches à
 * heure fixe dans l'ordre des heures, puis celles sans heure ; enfin la priorité. C'est l'ordre
 * de la base (`TRI_A_FAIRE`, `taches.ts`), refait ici pour qu'il ne dépende pas d'elle.
 */
export function ordreAFaire(a: TacheTriable, b: TacheTriable): number {
  if (a.echeance !== b.echeance) return a.echeance < b.echeance ? -1 : 1
  if (a.heure !== b.heure) {
    if (a.heure === null) return 1
    if (b.heure === null) return -1
    return a.heure < b.heure ? -1 : 1
  }
  return a.priorite - b.priorite
}

export type Rubrique<T> = {
  cle: RubriqueAFaire
  /** « En retard », « Aujourd'hui ». */
  titre: string
  /** Le nombre affiché après le titre : celui de la base, ou à défaut celui des lignes lues. */
  nombre: number
  taches: T[]
}

/**
 * Les rubriques de l'onglet « À faire » : « En retard » (la plus ancienne d'abord), puis
 * « Aujourd'hui » (rendez-vous par heure, puis tâches sans heure). Une rubrique vide n'est
 * pas rendue ; aucune rubrique : l'état vide de la page. `comptes` donne les nombres de la
 * base, quand la liste n'est pas lue en entier.
 */
export function rubriquesAFaire<T extends { tache: TacheTriable }>(
  taches: readonly T[],
  aujourdhui: string,
  comptes: Partial<Record<Tranche, number | null>> = {},
): Rubrique<T>[] {
  const triees = [...taches].sort((a, b) => ordreAFaire(a.tache, b.tache))
  const parRubrique: Record<RubriqueAFaire, T[]> = {
    en_retard: triees.filter(({ tache }) => tache.echeance < aujourdhui),
    aujourdhui: triees.filter(({ tache }) => tache.echeance === aujourdhui),
  }
  return (['en_retard', 'aujourdhui'] as const)
    .filter((cle) => parRubrique[cle].length > 0)
    .map((cle) => ({
      cle,
      titre: TITRES[cle],
      nombre: Math.max(comptes[cle] ?? 0, parRubrique[cle].length),
      taches: parRubrique[cle],
    }))
}

/** Le compteur de l'onglet « À faire » : retards et tâches du jour. `null` : inconnu. */
export function compteurAFaire(comptes: Partial<Record<Tranche, number | null>>): number | null {
  const { en_retard: retard, aujourdhui } = comptes
  if (retard === undefined || retard === null || aujourdhui === undefined || aujourdhui === null) {
    return null
  }
  return retard + aujourdhui
}
