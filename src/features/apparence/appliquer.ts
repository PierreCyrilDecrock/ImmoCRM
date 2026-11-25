/**
 * Pose l'apparence sur la page : le mode et le zoom de l'appareil (attributs et taille du
 * texte de `<html>`), puis le thème (une feuille de style placée après celle du site) et sa
 * police. Appelé dès le démarrage (`main.tsx`), avant même la connexion, puis à chaque
 * changement.
 */
import {
  CLE_PREFERENCES,
  lirePreferences,
  ZOOM_ORIGINE,
  type PreferencesAppareil,
} from './appareil'
import { feuilleDuTheme, lireTheme, THEME_STANDARD, type IdPolice, type Theme } from './themes'

/** Clé de la mémoire du navigateur : le dernier thème en service, pour l'afficher sans attendre la base. */
export const CLE_THEME = 'immocrm.apparence.theme'

const ID_FEUILLE = 'immocrm-theme'

/** Les polices autres qu'Inter ne se chargent que si un thème (ou l'éditeur) les demande. */
const CHARGEURS: Record<Exclude<IdPolice, 'inter'>, () => Promise<unknown>> = {
  atkinson: () => import('@fontsource-variable/atkinson-hyperlegible-next'),
  lexend: () => import('@fontsource-variable/lexend'),
  literata: () => import('@fontsource-variable/literata'),
}

const chargees = new Set<IdPolice>(['inter'])

/** Charge les fichiers d'une police (une seule fois). */
export function chargerPolice(id: IdPolice): void {
  if (chargees.has(id)) return
  chargees.add(id)
  if (id === 'inter') return
  CHARGEURS[id]().catch(() => {
    // Sans réseau, la police de secours prend le relais ; on réessaiera plus tard.
    chargees.delete(id)
  })
}

/** Le mode et le zoom de cet appareil. */
export function appliquerPreferences(preferences: PreferencesAppareil): void {
  const racine = document.documentElement
  if (preferences.mode === 'auto') delete racine.dataset.mode
  else racine.dataset.mode = preferences.mode
  racine.dataset.zoom = String(preferences.zoom)
  // Toutes les tailles de l'interface sont en rem : changer celle de <html> zoome tout.
  racine.style.fontSize = preferences.zoom === ZOOM_ORIGINE ? '' : `${preferences.zoom}%`
  mettreAJourCouleurBarre()
}

let themeEnService: Theme = THEME_STANDARD

/** Le thème du compte. */
export function appliquerTheme(theme: Theme): void {
  themeEnService = theme
  let feuille = document.getElementById(ID_FEUILLE)
  if (feuille === null) {
    feuille = document.createElement('style')
    feuille.id = ID_FEUILLE
    document.head.appendChild(feuille)
  }
  feuille.textContent = feuilleDuTheme(theme)
  chargerPolice(theme.police)
  mettreAJourCouleurBarre()
}

/**
 * La couleur de la barre du navigateur et du téléphone (`<meta name="theme-color">`, une
 * pour le clair et une pour le sombre dans `index.html`) suit le fond du thème et le mode.
 */
function mettreAJourCouleurBarre(): void {
  const mode = document.documentElement.dataset.mode
  const fondClair = themeEnService.couleurs.clair.fond
  const fondSombre = themeEnService.couleurs.sombre.fond
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const pourSombre = (meta.media || '').includes('dark')
    const imposee = mode === 'clair' ? fondClair : mode === 'sombre' ? fondSombre : null
    meta.content = imposee ?? (pourSombre ? fondSombre : fondClair)
  })
}

/** Lit la mémoire du navigateur sans jamais échouer (navigation privée, stockage bloqué). */
export function lireMemoire(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle)
  } catch {
    return null
  }
}

/** Écrit dans la mémoire du navigateur ; sans stockage, le réglage vaut le temps de la page. */
export function ecrireMemoire(cle: string, valeur: string | null): void {
  try {
    if (valeur === null) window.localStorage.removeItem(cle)
    else window.localStorage.setItem(cle, valeur)
  } catch {
    // Rien de grave : le réglage reste en mémoire jusqu'au prochain chargement.
  }
}

/** Le dernier thème en service sur cet appareil ; « Standard » si aucun n'est gardé. */
export function themeMemorise(): Theme {
  const texte = lireMemoire(CLE_THEME)
  if (texte === null) return THEME_STANDARD
  try {
    return lireTheme(JSON.parse(texte)) ?? THEME_STANDARD
  } catch {
    return THEME_STANDARD
  }
}

/** Au démarrage : l'apparence gardée par cet appareil, avant le premier affichage. */
export function appliquerAuDemarrage(): void {
  appliquerPreferences(lirePreferences(lireMemoire(CLE_PREFERENCES)))
  appliquerTheme(themeMemorise())
}
