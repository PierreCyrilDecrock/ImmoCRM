/**
 * Les thèmes du compte (page Apparence) : couleurs, police, taille du texte et arrondis.
 * Ils sont enregistrés dans les réglages du compte (colonne `apparence`), donc partagés entre
 * le téléphone, la tablette et l'ordinateur. Fonctions pures, sans accès à la page.
 */
import {
  CLES_COULEURS,
  COULEURS_ORIGINE,
  estCouleur,
  JETONS,
  memesCouleurs,
  paletteDuMode,
  type CouleursBase,
  type Palette,
} from './couleurs'

// ---------------------------------------------------------------------------
// Police, taille du texte, arrondis
// ---------------------------------------------------------------------------

export type IdPolice = 'inter' | 'atkinson' | 'lexend' | 'literata'

export type Police = {
  id: IdPolice
  nom: string
  /** Pile de polices CSS (`font-family`). */
  famille: string
  description: string
}

/** Les quatre polices proposées, servies avec le site (paquets `@fontsource-variable/…`). */
export const POLICES: readonly Police[] = [
  {
    id: 'inter',
    nom: 'Inter',
    famille:
      "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    description: 'Nette et compacte : celle d’origine.',
  },
  {
    id: 'atkinson',
    nom: 'Atkinson Hyperlegible',
    famille: "'Atkinson Hyperlegible Next Variable', ui-sans-serif, system-ui, sans-serif",
    description: '1, l et I ne se confondent pas.',
  },
  {
    id: 'lexend',
    nom: 'Lexend',
    famille: "'Lexend Variable', ui-sans-serif, system-ui, sans-serif",
    description: 'Ronde et large, très aérée : se lit sans effort.',
  },
  {
    id: 'literata',
    nom: 'Literata',
    famille: "'Literata Variable', Georgia, ui-serif, serif",
    description: 'Avec empattements, comme un livre : plus classique.',
  },
]

export type IdTaille = 'tres-petite' | 'petite' | 'normale' | 'grande' | 'tres-grande'

export type Taille = {
  id: IdTaille
  /** Libellé sur deux lignes au plus, pour les choix en colonnes (« Très\npetite »). */
  libelle: string
  nom: string
  /** Accordé avec « texte », pour le résumé d'un thème (« texte grand »). */
  adjectif: string
  /** Multiplie toutes les tailles de texte. */
  echelle: number
}

export const TAILLES: readonly Taille[] = [
  {
    id: 'tres-petite',
    libelle: 'Très\npetite',
    nom: 'Très petite',
    adjectif: 'très petit',
    echelle: 0.875,
  },
  { id: 'petite', libelle: 'Petite', nom: 'Petite', adjectif: 'petit', echelle: 0.9375 },
  { id: 'normale', libelle: 'Normale', nom: 'Normale', adjectif: 'normal', echelle: 1 },
  { id: 'grande', libelle: 'Grande', nom: 'Grande', adjectif: 'grand', echelle: 1.125 },
  {
    id: 'tres-grande',
    libelle: 'Très\ngrande',
    nom: 'Très grande',
    adjectif: 'très grand',
    echelle: 1.25,
  },
]

export type IdArrondi = 'carres' | 'nets' | 'doux' | 'ronds' | 'tres-ronds'

export type Arrondi = {
  id: IdArrondi
  libelle: string
  nom: string
  /** Rayons en rem des classes `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`. */
  rayons: { lg: number; xl: number; '2xl': number; '3xl': number }
}

export const ARRONDIS: readonly Arrondi[] = [
  {
    id: 'carres',
    libelle: 'Carrés',
    nom: 'Carrés',
    rayons: { lg: 0.1875, xl: 0.25, '2xl': 0.375, '3xl': 0.5 },
  },
  {
    id: 'nets',
    libelle: 'Nets',
    nom: 'Nets',
    rayons: { lg: 0.375, xl: 0.5, '2xl': 0.625, '3xl': 0.875 },
  },
  {
    id: 'doux',
    libelle: 'Doux',
    nom: 'Doux',
    rayons: { lg: 0.75, xl: 1, '2xl': 1.25, '3xl': 1.75 },
  },
  {
    id: 'ronds',
    libelle: 'Ronds',
    nom: 'Ronds',
    rayons: { lg: 1, xl: 1.375, '2xl': 1.75, '3xl': 2.25 },
  },
  {
    id: 'tres-ronds',
    libelle: 'Très\nronds',
    nom: 'Très ronds',
    rayons: { lg: 1.375, xl: 1.75, '2xl': 2.25, '3xl': 2.75 },
  },
]

/** Les tailles de texte de Tailwind et du projet (`src/index.css`), en rem, à l'échelle 1. */
export const TAILLES_TEXTE: Readonly<Record<string, number>> = {
  micro: 0.625,
  mini: 0.6875,
  xs: 0.75,
  petit: 0.8125,
  sm: 0.875,
  moyen: 0.9375,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  'titre-fiche': 1.375,
  '2xl': 1.5,
  titre: 1.75,
  '3xl': 1.875,
  '4xl': 2.25,
}

// ---------------------------------------------------------------------------
// Thèmes
// ---------------------------------------------------------------------------

export type Theme = {
  id: string
  nom: string
  couleurs: { clair: CouleursBase; sombre: CouleursBase }
  police: IdPolice
  taille: IdTaille
  arrondi: IdArrondi
}

export const ID_STANDARD = 'standard'

/** Le thème d'origine : toujours là, jamais modifié. */
export const THEME_STANDARD: Theme = {
  id: ID_STANDARD,
  nom: 'Standard',
  couleurs: { clair: COULEURS_ORIGINE.clair, sombre: COULEURS_ORIGINE.sombre },
  police: 'inter',
  taille: 'normale',
  arrondi: 'doux',
}

/** Ce que le compte garde : le thème choisi et les thèmes créés (« Standard » n'y est pas). */
export type ApparenceCompte = {
  themeChoisi: string
  themes: Theme[]
}

export const APPARENCE_PAR_DEFAUT: ApparenceCompte = { themeChoisi: ID_STANDARD, themes: [] }

export const LONGUEUR_MAX_NOM_THEME = 40
/** Au-delà, la colonne de la base (64 Ko) pourrait déborder. */
export const NOMBRE_MAX_THEMES = 30

export function police(id: IdPolice): Police {
  return POLICES.find((p) => p.id === id) ?? (POLICES[0] as Police)
}

export function taille(id: IdTaille): Taille {
  return TAILLES.find((t) => t.id === id) ?? (TAILLES[2] as Taille)
}

export function arrondi(id: IdArrondi): Arrondi {
  return ARRONDIS.find((a) => a.id === id) ?? (ARRONDIS[2] as Arrondi)
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

function lireCouleurs(valeur: unknown, origine: CouleursBase): CouleursBase {
  const objet = estObjet(valeur) ? valeur : {}
  const resultat = { ...origine }
  for (const cle of CLES_COULEURS) {
    const couleur = objet[cle]
    if (estCouleur(couleur)) resultat[cle] = couleur.toLowerCase()
  }
  return resultat
}

function lireParmi<T extends string>(valeur: unknown, ids: readonly T[], defaut: T): T {
  return ids.find((id) => id === valeur) ?? defaut
}

/** Un thème lu dans la base ; `null` s'il est inutilisable (sans identifiant). */
export function lireTheme(valeur: unknown): Theme | null {
  if (!estObjet(valeur)) return null
  const id = valeur.id
  if (typeof id !== 'string' || id.length === 0 || id === ID_STANDARD) return null
  const nom =
    typeof valeur.nom === 'string' ? valeur.nom.trim().slice(0, LONGUEUR_MAX_NOM_THEME) : ''
  const couleurs = estObjet(valeur.couleurs) ? valeur.couleurs : {}
  return {
    id,
    nom: nom.length > 0 ? nom : 'Thème sans nom',
    couleurs: {
      clair: lireCouleurs(couleurs.clair, COULEURS_ORIGINE.clair),
      sombre: lireCouleurs(couleurs.sombre, COULEURS_ORIGINE.sombre),
    },
    police: lireParmi(
      valeur.police,
      POLICES.map((p) => p.id),
      'inter',
    ),
    taille: lireParmi(
      valeur.taille,
      TAILLES.map((t) => t.id),
      'normale',
    ),
    arrondi: lireParmi(
      valeur.arrondi,
      ARRONDIS.map((a) => a.id),
      'doux',
    ),
  }
}

/**
 * Les thèmes du compte, depuis la colonne `apparence`. Toute valeur inconnue ou abîmée est
 * remplacée par celle d'origine ; un thème choisi qui n'existe plus ramène à « Standard ».
 */
export function lireApparenceCompte(valeur: unknown): ApparenceCompte {
  if (!estObjet(valeur)) return APPARENCE_PAR_DEFAUT
  const themes: Theme[] = []
  if (Array.isArray(valeur.themes)) {
    for (const element of valeur.themes) {
      const theme = lireTheme(element)
      if (theme !== null && !themes.some((t) => t.id === theme.id)) themes.push(theme)
    }
  }
  const choisi = valeur.theme_choisi
  const themeChoisi =
    typeof choisi === 'string' && themes.some((t) => t.id === choisi) ? choisi : ID_STANDARD
  return { themeChoisi, themes: themes.slice(0, NOMBRE_MAX_THEMES) }
}

/** Ce qui s'enregistre dans la colonne `apparence`. */
export function versColonne(apparence: ApparenceCompte): {
  theme_choisi: string
  themes: {
    id: string
    nom: string
    couleurs: { clair: CouleursBase; sombre: CouleursBase }
    police: IdPolice
    taille: IdTaille
    arrondi: IdArrondi
  }[]
} {
  return {
    theme_choisi: apparence.themeChoisi,
    themes: apparence.themes.map((t) => ({
      id: t.id,
      nom: t.nom,
      couleurs: { clair: { ...t.couleurs.clair }, sombre: { ...t.couleurs.sombre } },
      police: t.police,
      taille: t.taille,
      arrondi: t.arrondi,
    })),
  }
}

/** « Standard » d'abord, puis les thèmes créés. */
export function tousLesThemes(apparence: ApparenceCompte): Theme[] {
  return [THEME_STANDARD, ...apparence.themes]
}

/** Le thème en service. */
export function themeChoisi(apparence: ApparenceCompte): Theme {
  return apparence.themes.find((t) => t.id === apparence.themeChoisi) ?? THEME_STANDARD
}

/** Un nouveau thème, aux réglages d'origine. */
export function nouveauTheme(id: string, nom: string): Theme {
  return { ...THEME_STANDARD, id, nom, couleurs: { ...THEME_STANDARD.couleurs } }
}

/** « Mon thème », puis « Mon thème 2 », « Mon thème 3 »… selon les noms déjà pris. */
export function nomLibre(themes: readonly Theme[]): string {
  const pris = new Set(themes.map((t) => t.nom.toLowerCase()))
  if (!pris.has('mon thème')) return 'Mon thème'
  let rang = 2
  while (pris.has(`mon thème ${rang}`)) rang += 1
  return `Mon thème ${rang}`
}

/** Vérifie le nom saisi. Renvoie un message, ou `null` si tout va bien. */
export function validerNomTheme(nom: string): string | null {
  const propre = nom.trim()
  if (propre.length === 0) return 'Donnez un nom au thème.'
  if (propre.length > LONGUEUR_MAX_NOM_THEME) {
    return `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_THEME} caractères.`
  }
  if (propre.toLowerCase() === THEME_STANDARD.nom.toLowerCase()) {
    return '« Standard » est le nom du thème d’origine : choisissez-en un autre.'
  }
  return null
}

/** Ajoute ou remplace un thème du compte. */
export function avecTheme(apparence: ApparenceCompte, theme: Theme): ApparenceCompte {
  const existe = apparence.themes.some((t) => t.id === theme.id)
  return {
    ...apparence,
    themes: existe
      ? apparence.themes.map((t) => (t.id === theme.id ? theme : t))
      : [...apparence.themes, theme],
  }
}

/** Retire un thème du compte ; s'il était choisi, « Standard » reprend la place. */
export function sansTheme(apparence: ApparenceCompte, id: string): ApparenceCompte {
  return {
    themeChoisi: apparence.themeChoisi === id ? ID_STANDARD : apparence.themeChoisi,
    themes: apparence.themes.filter((t) => t.id !== id),
  }
}

/** Deux thèmes disent la même chose (pour savoir si un brouillon a changé). */
export function memesThemes(a: Theme, b: Theme): boolean {
  return (
    a.nom.trim() === b.nom.trim() &&
    a.police === b.police &&
    a.taille === b.taille &&
    a.arrondi === b.arrondi &&
    memesCouleurs(a.couleurs.clair, b.couleurs.clair) &&
    memesCouleurs(a.couleurs.sombre, b.couleurs.sombre)
  )
}

/** « Lexend · texte grand · arrondis doux ». */
export function resumeTheme(theme: Theme): string {
  return `${police(theme.police).nom} · texte ${taille(theme.taille).adjectif} · arrondis ${arrondi(theme.arrondi).nom.toLowerCase()}`
}

// ---------------------------------------------------------------------------
// Traduction en variables CSS
// ---------------------------------------------------------------------------

function arrondir(valeur: number): string {
  return `${Math.round(valeur * 10000) / 10000}rem`
}

/** Police, tailles de texte et arrondis d'un thème, en variables CSS. */
export function variablesFormes(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = { '--font-sans': police(theme.police).famille }
  const echelle = taille(theme.taille).echelle
  for (const [nom, rem] of Object.entries(TAILLES_TEXTE)) {
    variables[`--text-${nom}`] = arrondir(rem * echelle)
  }
  const rayons = arrondi(theme.arrondi).rayons
  for (const [nom, rem] of Object.entries(rayons)) variables[`--radius-${nom}`] = arrondir(rem)
  return variables
}

/** Les couleurs d'un mode, en variables CSS (`--fond`, `--bord-fort`…). */
export function variablesCouleurs(palette: Palette): Record<string, string> {
  const variables: Record<string, string> = {}
  for (const jeton of JETONS) variables[`--${jeton}`] = palette[jeton]
  return variables
}

/** Toutes les variables d'un thème dans un mode : pour un aperçu posé dans la page. */
export function variablesApercu(theme: Theme, sombre: boolean): Record<string, string> {
  const base = sombre ? theme.couleurs.sombre : theme.couleurs.clair
  return { ...variablesCouleurs(paletteDuMode(base, sombre)), ...variablesFormes(theme) }
}

function bloc(selecteur: string, variables: Record<string, string>): string {
  const lignes = Object.entries(variables).map(([nom, valeur]) => `${nom}:${valeur};`)
  return `${selecteur}{${lignes.join('')}}`
}

/**
 * La feuille de style d'un thème, posée par-dessus `src/index.css`. Vide pour « Standard » :
 * seul ce qui diffère de l'origine est écrit. Le mode sombre suit le réglage de l'appareil
 * (`prefers-color-scheme`), sauf si le mode est imposé (`data-mode` sur `<html>`).
 */
export function feuilleDuTheme(theme: Theme): string {
  const regles: string[] = []
  const formesOrigine =
    theme.police === THEME_STANDARD.police &&
    theme.taille === THEME_STANDARD.taille &&
    theme.arrondi === THEME_STANDARD.arrondi
  if (!formesOrigine) regles.push(bloc(':root', variablesFormes(theme)))
  if (!memesCouleurs(theme.couleurs.clair, COULEURS_ORIGINE.clair)) {
    regles.push(bloc(':root', variablesCouleurs(paletteDuMode(theme.couleurs.clair, false))))
  }
  if (!memesCouleurs(theme.couleurs.sombre, COULEURS_ORIGINE.sombre)) {
    const sombre = variablesCouleurs(paletteDuMode(theme.couleurs.sombre, true))
    regles.push(
      `@media (prefers-color-scheme: dark){${bloc(":root:not([data-mode='clair'])", sombre)}}`,
    )
    regles.push(bloc(":root[data-mode='sombre']", sombre))
  }
  return regles.join('\n')
}
