/** Outils communs aux raccourcis clavier. */

/** Vrai si l'élément reçoit du texte tapé (champ, zone de texte, liste, zone éditable). */
export function estUnChamp(element: Element | null): boolean {
  if (element === null) return false
  if (element instanceof HTMLElement && element.isContentEditable) return true
  const balise = element.tagName
  if (balise === 'TEXTAREA' || balise === 'SELECT') return true
  if (balise !== 'INPUT') return false
  // Une case à cocher ou un bouton ne reçoit pas de texte.
  const type = (element.getAttribute('type') ?? 'text').toLowerCase()
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(
    type,
  )
}

/** Ce qu'on lit d'un appui de touche pour « Annuler » (un `KeyboardEvent` convient). */
export type AppuiAnnuler = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
  /** Dans un champ, Ctrl Z défait la saisie : il ne commande rien d'autre. */
  dansUnChamp: boolean
}

/** Vrai pour Ctrl Z (⌘ Z sur Mac) hors d'un champ : le geste « Annuler » du clavier. */
export function estAnnulation(appui: AppuiAnnuler): boolean {
  if (appui.dansUnChamp || appui.altKey || appui.shiftKey) return false
  return (appui.ctrlKey || appui.metaKey) && appui.key.toLowerCase() === 'z'
}

/** Vrai sur un appareil Apple (Mac, iPad avec clavier) : la touche de commande y est ⌘. */
export function estAppareilApple(systeme: string): boolean {
  return /mac|iphone|ipad|ipod/i.test(systeme)
}

/** Le système de l'appareil, tel que le navigateur le décrit (texte vide si inconnu). */
function systemeDeLAppareil(): string {
  if (typeof navigator === 'undefined') return ''
  const donnees = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
  return donnees?.platform ?? navigator.platform ?? navigator.userAgent
}

/** Le rappel du raccourci de la recherche : « ⌘K » sur un appareil Apple, « Ctrl K » ailleurs. */
export function rappelRecherche(systeme: string = systemeDeLAppareil()): string {
  return estAppareilApple(systeme) ? '⌘K' : 'Ctrl K'
}

/** Ce qu'on lit d'un appui de touche pour « Enregistrer » (un `KeyboardEvent` convient). */
export type AppuiEnregistrer = Pick<AppuiAnnuler, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>

/** Vrai pour ⌘ Entrée ou Ctrl Entrée : enregistrer le formulaire, même depuis un champ. */
export function estEnregistrement(appui: AppuiEnregistrer): boolean {
  return appui.key === 'Enter' && !appui.altKey && (appui.ctrlKey || appui.metaKey)
}

/** Le rappel du raccourci « Enregistrer » : « ⌘ Entrée » sur Apple, « Ctrl Entrée » ailleurs. */
export function rappelEnregistrer(systeme: string = systemeDeLAppareil()): string {
  return estAppareilApple(systeme) ? '⌘ Entrée' : 'Ctrl Entrée'
}
