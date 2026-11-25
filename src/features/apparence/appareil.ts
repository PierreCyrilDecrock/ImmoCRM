/**
 * Les réglages d'apparence propres à cet appareil : le mode (auto, clair, sombre) et le zoom.
 * Gardés dans la mémoire du navigateur, pas dans la base : le téléphone peut rester en sombre
 * à 90 % pendant que l'ordinateur est en clair à 100 %. Fonctions pures.
 */

export type Mode = 'auto' | 'clair' | 'sombre'

export const MODES: readonly { valeur: Mode; libelle: string }[] = [
  { valeur: 'auto', libelle: 'Auto' },
  { valeur: 'clair', libelle: 'Clair' },
  { valeur: 'sombre', libelle: 'Sombre' },
]

/** Les crans du zoom, en pour cent, comme ceux d'un navigateur. */
export const CRANS_ZOOM = [50, 67, 75, 80, 90, 100, 110, 125] as const

export const ZOOM_ORIGINE = 100

/**
 * En dessous de ce zoom, les zones à toucher rétrécissent aussi : ces niveaux visent
 * l'ordinateur et la souris. À partir de lui, elles gardent leurs 44 px.
 */
export const ZOOM_MIN_TACTILE = 90

export type PreferencesAppareil = { mode: Mode; zoom: number }

export const PREFERENCES_PAR_DEFAUT: PreferencesAppareil = { mode: 'auto', zoom: ZOOM_ORIGINE }

/** Clé de la mémoire du navigateur. */
export const CLE_PREFERENCES = 'immocrm.apparence.appareil'

/** Les préférences gardées par le navigateur ; celles d'origine si rien n'est lisible. */
export function lirePreferences(texte: string | null): PreferencesAppareil {
  if (texte === null) return PREFERENCES_PAR_DEFAUT
  try {
    const valeur: unknown = JSON.parse(texte)
    if (typeof valeur !== 'object' || valeur === null) return PREFERENCES_PAR_DEFAUT
    const { mode, zoom } = valeur as { mode?: unknown; zoom?: unknown }
    return {
      mode: MODES.find((m) => m.valeur === mode)?.valeur ?? PREFERENCES_PAR_DEFAUT.mode,
      zoom: CRANS_ZOOM.find((c) => c === zoom) ?? ZOOM_ORIGINE,
    }
  } catch {
    return PREFERENCES_PAR_DEFAUT
  }
}

/** Le cran voisin : `sens` = -1 pour réduire, +1 pour agrandir ; reste au bout s'il y est. */
export function cranVoisin(zoom: number, sens: -1 | 1): number {
  const rang = CRANS_ZOOM.findIndex((c) => c === zoom)
  const depart = rang === -1 ? CRANS_ZOOM.indexOf(ZOOM_ORIGINE) : rang
  const suivant = Math.min(CRANS_ZOOM.length - 1, Math.max(0, depart + sens))
  return CRANS_ZOOM[suivant] ?? ZOOM_ORIGINE
}

/** Le mode réellement affiché : « auto » suit l'appareil. */
export function estSombre(mode: Mode, appareilSombre: boolean): boolean {
  return mode === 'sombre' || (mode === 'auto' && appareilSombre)
}

/** La phrase qui explique le mode choisi. */
export function explicationMode(mode: Mode, appareilSombre: boolean): string {
  if (mode === 'clair') return 'Toujours clair, quel que soit le réglage de l’appareil.'
  if (mode === 'sombre') return 'Toujours sombre, quel que soit le réglage de l’appareil.'
  return `Suit le réglage de l’appareil : clair le jour, sombre quand il passe en sombre (en ce moment : ${appareilSombre ? 'sombre' : 'clair'}).`
}

/** La phrase qui explique le zoom choisi. */
export function explicationZoom(zoom: number): string {
  if (zoom < ZOOM_MIN_TACTILE) {
    return 'Pour l’ordinateur et la souris : tout est réduit, boutons compris. Au doigt, les boutons deviennent difficiles à toucher.'
  }
  if (zoom < ZOOM_ORIGINE) {
    return 'Tout est un peu plus petit : davantage de contenu tient à l’écran. Les zones à toucher gardent 44 px.'
  }
  if (zoom === ZOOM_ORIGINE) return 'Taille d’origine.'
  return 'Tout est plus grand : texte, marges et boutons ; on fait défiler davantage.'
}
