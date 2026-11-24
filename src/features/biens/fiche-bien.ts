import { formaterPrix, formaterSurface } from '../../lib/nombres'
import { champUtilise, type Bien } from './biens'

/**
 * Fiche Bien (étape D.7) : ses onglets et les petites phrases du profil, sur le modèle de la
 * fiche Contact. Règles pures, testées ; l'affichage est dans `src/pages/FicheBien.tsx`.
 */

export type OngletBien = 'activite' | 'projets' | 'taches' | 'details'

/**
 * Les mêmes onglets sur tous les écrans. Sans colonne de profil (téléphone, tablette tenue
 * en hauteur), les propriétaires passent en tête de « Détails ».
 */
export const ONGLETS_BIEN: readonly OngletBien[] = ['activite', 'projets', 'taches', 'details']

export const LIBELLES_ONGLETS_BIEN: Record<OngletBien, string> = {
  activite: 'Activité',
  projets: 'Acquéreurs',
  taches: 'Tâches',
  details: 'Détails',
}

/**
 * « 245 000 € · 82 m² » : le prix et la surface (celle du terrain pour un terrain), ce qui
 * est connu. Vide si rien ne l'est.
 */
export function prixEtSurface(
  bien: Pick<Bien, 'type' | 'categorie' | 'prix' | 'surface' | 'surface_terrain'>,
): string {
  const surface =
    champUtilise(bien, 'surface') && bien.surface !== null
      ? bien.surface
      : champUtilise(bien, 'surface_terrain') && bien.surface_terrain !== null
        ? bien.surface_terrain
        : null
  return [
    bien.prix === null ? null : formaterPrix(bien.prix),
    surface === null ? null : formaterSurface(surface),
  ]
    .filter((morceau) => morceau !== null)
    .join(' · ')
}
