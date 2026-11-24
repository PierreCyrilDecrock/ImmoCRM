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

/**
 * « À venir » de l'onglet Activité, quand la prochaine tâche (montrée en haut de la fiche)
 * était la seule : la liste ne la répète pas (revue n° 2, proposition 11, règle 12).
 */
export const RIEN_D_AUTRE_BIEN = 'Rien d’autre de prévu.'

/**
 * Le haut de la fiche : la photo principale s'il y en a une ; sinon rien à sa place (plus de
 * carré gris), le statut et le type passent au-dessus de l'adresse. Tant que les photos ne
 * sont pas lues (`null`), rien non plus : un bien sans photo ne voit pas de carré apparaître
 * puis disparaître.
 */
export function avecPhoto(nombrePhotos: number | null): boolean {
  return nombrePhotos !== null && nombrePhotos > 0
}
