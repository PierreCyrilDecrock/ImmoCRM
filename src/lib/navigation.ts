import type { NomIcone } from '../components/Icone'

export type EntreeNavigation = {
  /** Adresse de la page (après le « # »). */
  chemin: string
  libelle: string
  icone: NomIcone
}

/**
 * Entrées de la navigation principale, dans l'ordre d'affichage.
 * Six au maximum : au-delà, elles ne tiennent plus au pouce sur un téléphone.
 */
export const ENTREES_NAVIGATION: readonly EntreeNavigation[] = [
  { chemin: '/', libelle: "Aujourd'hui", icone: 'aujourdhui' },
  { chemin: '/contacts', libelle: 'Contacts', icone: 'contacts' },
  { chemin: '/biens', libelle: 'Biens', icone: 'biens' },
  { chemin: '/pipelines', libelle: 'Pipelines', icone: 'pipelines' },
  { chemin: '/taches', libelle: 'Tâches', icone: 'taches' },
  { chemin: '/plus', libelle: 'Plus', icone: 'plus' },
]

/**
 * Entrée à mettre en avant pour une adresse donnée : une sous-page garde son entrée
 * allumée (« /plus/reglages » allume « Plus »). `null` si l'adresse n'est pas connue.
 */
export function entreeActive(
  chemin: string,
  entrees: readonly EntreeNavigation[] = ENTREES_NAVIGATION,
): EntreeNavigation | null {
  const propre = chemin.replace(/\/+$/, '') || '/'
  return (
    entrees.find((entree) =>
      entree.chemin === '/'
        ? propre === '/'
        : propre === entree.chemin || propre.startsWith(`${entree.chemin}/`),
    ) ?? null
  )
}
