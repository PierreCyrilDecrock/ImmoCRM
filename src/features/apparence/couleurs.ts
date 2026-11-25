/**
 * Les couleurs d'un thème : les cinq couleurs modifiables, les nuances qui s'en déduisent et
 * les vérifications de lisibilité (page Apparence). Fonctions pures, sans accès à la page.
 */

/** Les cinq couleurs qu'un thème peut changer, pour un mode (clair ou sombre). */
export type CouleursBase = {
  /** Couleur d'action : bouton principal, liens, onglet actif. */
  accent: string
  /** Fond de l'application, derrière les cartes. */
  fond: string
  /** Fond des cartes, des listes, des champs et de la navigation. */
  surface: string
  /** Texte principal. */
  encre: string
  /** Fond de la carte « Maintenant ». */
  inverse: string
}

export type CleCouleur = keyof CouleursBase

/** L'ordre d'affichage des couleurs modifiables. */
export const CLES_COULEURS: readonly CleCouleur[] = [
  'accent',
  'fond',
  'surface',
  'encre',
  'inverse',
]

/** Les noms des couleurs du système de design (variables `--fond`, `--bord-fort`… de `src/index.css`). */
export const JETONS = [
  'fond',
  'surface',
  'creux',
  'bord',
  'bord-fort',
  'encre',
  'encre-douce',
  'accent',
  'accent-fort',
  'accent-doux',
  'sur-plein',
  'danger',
  'danger-doux',
  'succes',
  'succes-doux',
  'alerte',
  'alerte-doux',
  'inverse',
  'inverse-creux',
  'sur-inverse',
  'sur-inverse-doux',
  'bord-inverse',
] as const

export type Jeton = (typeof JETONS)[number]

/** Toutes les couleurs d'un mode, jeton par jeton. */
export type Palette = Record<Jeton, string>

/**
 * Les couleurs d'origine, recopiées de `src/index.css` (thème « Standard ») : à tenir à jour
 * ensemble. Un test vérifie que les deux disent la même chose.
 */
export const PALETTE_ORIGINE: { clair: Palette; sombre: Palette } = {
  clair: {
    fond: '#f6f6f3',
    surface: '#ffffff',
    creux: '#f0f0ec',
    bord: '#e6e6e1',
    'bord-fort': '#8a8d95',
    encre: '#0e0f12',
    'encre-douce': '#5c5f67',
    accent: '#3d3af5',
    'accent-fort': '#2f2cd6',
    'accent-doux': '#ececfe',
    'sur-plein': '#ffffff',
    danger: '#b42a18',
    'danger-doux': '#fcebe8',
    succes: '#127a4a',
    'succes-doux': '#e5f4ec',
    alerte: '#8a5a00',
    'alerte-doux': '#fbf1dc',
    inverse: '#0e0f12',
    'inverse-creux': '#26272d',
    'sur-inverse': '#ffffff',
    'sur-inverse-doux': '#b4b7bf',
    'bord-inverse': '#0e0f12',
  },
  sombre: {
    fond: '#0d0e11',
    surface: '#17181c',
    creux: '#24252b',
    bord: '#2a2c33',
    'bord-fort': '#6b6e76',
    encre: '#f2f2f0',
    'encre-douce': '#a8abb3',
    accent: '#8c8aff',
    'accent-fort': '#b4b3ff',
    'accent-doux': '#23224a',
    'sur-plein': '#0d0e11',
    danger: '#ff8a78',
    'danger-doux': '#3a1a16',
    succes: '#4fd08c',
    'succes-doux': '#14301f',
    alerte: '#f2c25b',
    'alerte-doux': '#352914',
    inverse: '#2a2b31',
    'inverse-creux': '#3a3b42',
    'sur-inverse': '#f2f2f0',
    'sur-inverse-doux': '#b9bcc4',
    'bord-inverse': '#4a4c54',
  },
}

/** Les cinq couleurs modifiables d'origine, pour chaque mode. */
export const COULEURS_ORIGINE: { clair: CouleursBase; sombre: CouleursBase } = {
  clair: extraireBase(PALETTE_ORIGINE.clair),
  sombre: extraireBase(PALETTE_ORIGINE.sombre),
}

function extraireBase(palette: Palette): CouleursBase {
  return {
    accent: palette.accent,
    fond: palette.fond,
    surface: palette.surface,
    encre: palette.encre,
    inverse: palette.inverse,
  }
}

/** Contraste minimal d'un texte sur son fond (règle commune de l'interface). */
export const CONTRASTE_MINIMAL = 4.5

const BLANC = '#ffffff'
const NOIR = '#0e0f12'

/** Une couleur écrite « #rrggbb ». */
export function estCouleur(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && /^#[0-9a-f]{6}$/i.test(valeur)
}

/** Les trois composantes (0 à 255) d'une couleur « #rrggbb ». */
export function versRvb(couleur: string): [number, number, number] {
  const hex = couleur.replace('#', '')
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ]
}

/** La couleur « #rrggbb » de trois composantes (arrondies, bornées à 0–255). */
export function versHex(rvb: readonly [number, number, number]): string {
  return `#${rvb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** Mélange deux couleurs : `part` = 0 donne `a`, 1 donne `b`. */
export function melanger(a: string, b: string, part: number): string {
  const x = versRvb(a)
  const y = versRvb(b)
  return versHex([
    x[0] + (y[0] - x[0]) * part,
    x[1] + (y[1] - x[1]) * part,
    x[2] + (y[2] - x[2]) * part,
  ])
}

/** Luminance relative (définition des règles d'accessibilité WCAG). */
export function luminance(couleur: string): number {
  const [r, v, b] = versRvb(couleur).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

/** Rapport de contraste entre deux couleurs, de 1 à 21. */
export function contraste(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** « 5,8:1 » : le rapport arrondi vers le bas, pour ne jamais flatter une couleur. */
export function formaterContraste(rapport: number): string {
  return `${(Math.floor(rapport * 10) / 10).toFixed(1).replace('.', ',')}:1`
}

/** Blanc ou presque noir : le texte le plus lisible posé sur cette couleur. */
export function texteSur(fond: string): string {
  return contraste(BLANC, fond) >= contraste(NOIR, fond) ? BLANC : NOIR
}

/** Teinte (0 à 360°) et saturation (0 à 1) d'une couleur. */
export function teinteEtSaturation(couleur: string): { teinte: number; saturation: number } {
  const [r, v, b] = versRvb(couleur).map((c) => c / 255) as [number, number, number]
  const max = Math.max(r, v, b)
  const min = Math.min(r, v, b)
  const ecart = max - min
  const clarte = (max + min) / 2
  const saturation = ecart === 0 ? 0 : ecart / (1 - Math.abs(2 * clarte - 1))
  let teinte = 0
  if (ecart !== 0) {
    if (max === r) teinte = 60 * (((v - b) / ecart) % 6)
    else if (max === v) teinte = 60 * ((b - r) / ecart + 2)
    else teinte = 60 * ((r - v) / ecart + 4)
  }
  if (teinte < 0) teinte += 360
  return { teinte, saturation }
}

/** Vrai quand les cinq couleurs sont celles d'origine. */
export function memesCouleurs(a: CouleursBase, b: CouleursBase): boolean {
  return CLES_COULEURS.every((cle) => a[cle].toLowerCase() === b[cle].toLowerCase())
}

/**
 * Toutes les couleurs d'un mode, déduites des cinq couleurs choisies. Les couleurs d'origine
 * donnent exactement la palette de `src/index.css` ; les autres sont calculées pour garder
 * les mêmes rapports (survol, filets, texte gris, texte posé sur le bleu…). Le rouge, le vert
 * et l'orange ne changent jamais.
 */
export function paletteDuMode(base: CouleursBase, sombre: boolean): Palette {
  const origine = sombre ? PALETTE_ORIGINE.sombre : PALETTE_ORIGINE.clair
  if (memesCouleurs(base, sombre ? COULEURS_ORIGINE.sombre : COULEURS_ORIGINE.clair)) {
    return origine
  }
  const surInverse = texteSur(base.inverse)
  return {
    ...origine,
    fond: base.fond,
    surface: base.surface,
    creux: melanger(base.surface, base.encre, 0.06),
    bord: melanger(base.surface, base.encre, sombre ? 0.08 : 0.1),
    'bord-fort': melanger(base.surface, base.encre, sombre ? 0.4 : 0.5),
    encre: base.encre,
    'encre-douce': melanger(base.encre, base.surface, sombre ? 0.32 : 0.38),
    accent: base.accent,
    'accent-fort': sombre
      ? melanger(base.accent, BLANC, 0.3)
      : melanger(base.accent, '#000000', 0.15),
    'accent-doux': melanger(base.surface, base.accent, sombre ? 0.2 : 0.1),
    'sur-plein': texteSur(base.accent),
    inverse: base.inverse,
    'inverse-creux': melanger(base.inverse, surInverse, 0.14),
    'sur-inverse': surInverse,
    'sur-inverse-doux': melanger(surInverse, base.inverse, 0.3),
    'bord-inverse': sombre ? melanger(base.inverse, surInverse, 0.18) : base.inverse,
  }
}

/** Ce que l'on vérifie pour chaque couleur modifiable : des paires texte / fond. */
const PAIRES: Record<CleCouleur, readonly (readonly [Jeton, Jeton, string])[]> = {
  accent: [
    ['sur-plein', 'accent', 'texte du bouton'],
    ['accent', 'surface', 'liens sur les cartes'],
  ],
  fond: [
    ['encre', 'fond', 'titres sur le fond'],
    ['encre-douce', 'fond', 'texte gris sur le fond'],
  ],
  surface: [
    ['encre', 'surface', 'texte des cartes'],
    ['encre-douce', 'surface', 'texte gris des cartes'],
  ],
  encre: [
    ['encre', 'surface', 'texte des cartes'],
    ['encre-douce', 'surface', 'texte gris'],
    ['encre', 'fond', 'texte sur le fond'],
  ],
  inverse: [
    ['sur-inverse', 'inverse', 'texte de la carte'],
    ['sur-inverse-doux', 'inverse', 'texte gris de la carte'],
  ],
}

export type Lisibilite = {
  /** Le contraste le plus faible parmi ceux qui dépendent de cette couleur. */
  rapport: number
  /** Ce qui est le moins lisible (« texte du bouton »). */
  quoi: string
  lisible: boolean
}

/** La lisibilité de chaque couleur modifiable, dans la palette d'un mode. */
export function lisibilites(palette: Palette): Record<CleCouleur, Lisibilite> {
  const resultat = {} as Record<CleCouleur, Lisibilite>
  for (const cle of CLES_COULEURS) {
    let pire: Lisibilite | null = null
    for (const [texte, fond, quoi] of PAIRES[cle]) {
      const rapport = contraste(palette[texte], palette[fond])
      if (pire === null || rapport < pire.rapport) {
        pire = { rapport, quoi, lisible: rapport >= CONTRASTE_MINIMAL }
      }
    }
    if (pire !== null) resultat[cle] = pire
  }
  return resultat
}

/**
 * Prévient quand la couleur d'action ressemble au rouge des retards, à l'orange des
 * avertissements ou au vert des confirmations. Un conseil : il n'empêche pas d'enregistrer.
 */
export function conseilAccent(couleur: string): string | null {
  const { teinte, saturation } = teinteEtSaturation(couleur)
  if (saturation <= 0.35) return null
  if (teinte < 18 || teinte >= 335) {
    return 'Proche du rouge réservé aux retards : il risque de s’y confondre.'
  }
  if (teinte >= 25 && teinte < 55) {
    return 'Proche de l’orange réservé aux avertissements : il risque de s’y confondre.'
  }
  if (teinte >= 120 && teinte < 165) {
    return 'Proche du vert réservé aux confirmations : il risque de s’y confondre.'
  }
  return null
}
