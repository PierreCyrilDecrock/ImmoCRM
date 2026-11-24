import { formaterPrix, formaterSurface } from '../../lib/nombres'
import { champUtilise, communeBien, libelleType, type Bien } from './biens'

/**
 * Ce que dit une ligne de la liste des biens sur téléphone et tablette (étape F.3,
 * proposition 2 de la revue n° 2) : l'adresse en entier, puis le prix, qui sert à décider et
 * ne se coupe jamais, le type court et la surface, puis la commune. L'ordinateur garde sa
 * ligne d'un seul tenant (`resumeBien`).
 */

/** Le prix d'une ligne : « 285 000 € », ou « Prix à fixer » (en gris) s'il manque. */
export function prixDeListe(prix: number | null): { texte: string; aFixer: boolean } {
  if (prix === null) return { texte: 'Prix à fixer', aFixer: true }
  return { texte: formaterPrix(prix), aFixer: false }
}

/**
 * Le type en un mot : « T3 » pour un appartement dont on connaît les pièces (sinon
 * « Appartement »), « Maison », « Terrain », « Commerce ». Ancien, neuf ou viager restent
 * sur la fiche.
 */
export function typeCourt(bien: Pick<Bien, 'type' | 'pieces'>): string {
  switch (bien.type) {
    case 'appartement':
      return bien.pieces !== null && bien.pieces > 0 ? `T${bien.pieces}` : 'Appartement'
    case 'commerce':
      return 'Commerce'
    default:
      return libelleType(bien.type)
  }
}

/**
 * Le type court et la surface : « T3 · 64 m² », « Maison · 118 m² », « Terrain · 1 200 m² »
 * (la surface du terrain pour un terrain). Sans surface, le type seul.
 */
export function typeEtSurface(
  bien: Pick<Bien, 'type' | 'categorie' | 'pieces' | 'surface' | 'surface_terrain'>,
): string {
  const surface = champUtilise(bien, 'surface_terrain') ? bien.surface_terrain : bien.surface
  const type = typeCourt(bien)
  return surface === null ? type : `${type} · ${formaterSurface(surface)}`
}

/** Les trois lignes d'un bien dans la liste (téléphone et tablette). */
export type LigneBien = {
  /** Ligne 1 : l'adresse, en entier (sur deux lignes au plus). */
  adresse: string
  /** Ligne 2 : le prix, puis le type court et la surface ; la pastille du statut à droite. */
  prix: { texte: string; aFixer: boolean }
  typeEtSurface: string
  /** Ligne 3 : la commune, en gris ; `null` si elle n'est pas renseignée. */
  commune: string | null
}

export function ligneBien(bien: Bien): LigneBien {
  const commune = communeBien(bien)
  return {
    adresse: bien.adresse,
    prix: prixDeListe(bien.prix),
    typeEtSurface: typeEtSurface(bien),
    commune: commune === '' ? null : commune,
  }
}
