/**
 * « À venir » de l'onglet Activité d'une fiche : quelles tâches montrer. Règle pure, testée ;
 * l'affichage est dans `SectionTaches`.
 */

export type ChoixAVenir<T> = {
  /** Les tâches montrées, les plus proches d'abord. */
  montrees: T[]
  /** Combien restent à voir dans l'onglet Tâches. */
  cachees: number
  /** Vrai quand la seule tâche à faire est la prochaine action, déjà montrée au-dessus. */
  seulementLaProchaine: boolean
}

/**
 * Les tâches de « À venir », triées comme la prochaine action (échéance, heure, priorité).
 * Avec `sansLaPremiere`, la plus proche est laissée de côté : la carte « Prochaine action »
 * la montre déjà juste au-dessus (revue de design, règle 4 : une information une fois par
 * écran ; étape E.6). Puis `limite` tâches au plus ; les autres sont comptées.
 */
export function choisirAVenir<T>(
  taches: readonly T[],
  { limite, sansLaPremiere = false }: { limite: number; sansLaPremiere?: boolean },
): ChoixAVenir<T> {
  const suivantes = sansLaPremiere ? taches.slice(1) : [...taches]
  const montrees = suivantes.slice(0, Math.max(limite, 0))
  return {
    montrees,
    cachees: suivantes.length - montrees.length,
    seulementLaProchaine: sansLaPremiere && taches.length === 1,
  }
}

/**
 * Ce que dit la rubrique quand il n'y a aucune tâche à faire : une phrase grise, avec ou sans
 * le bouton pour en créer une (`ajout`) ; `masquer` : la rubrique disparaît, parce qu'un
 * autre bloc de la fiche dit déjà l'absence et porte le geste (une absence se dit une fois).
 */
export type VideTaches = { phrase: string; ajout: boolean } | 'masquer'

/** Par défaut, sur les fiches Contact et Bien. */
export const VIDE_TACHES: VideTaches = {
  phrase: 'Aucune tâche à faire. Les relances et les rendez-vous à venir s’afficheront ici.',
  ajout: true,
}
