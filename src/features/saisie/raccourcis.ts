/**
 * Raccourcis clavier, pour l'ordinateur (et la tablette avec un clavier). Une seule touche,
 * sans Ctrl ni Alt, quand on n'est pas en train d'écrire dans un champ :
 *   - « / » (ou Ctrl+K, ⌘K sur Mac) : aller au champ de recherche ;
 *   - « N » : ouvrir le menu de création ;
 *   - « C », « A », « T », « B », « D » : créer directement un contact, une activité
 *     (compte rendu), une tâche, un bien, une demande entrante.
 */

export type Creation = 'contact' | 'activite' | 'tache' | 'bien' | 'demande'

export type Raccourci =
  { genre: 'recherche' } | { genre: 'menu' } | { genre: 'creer'; creation: Creation }

/** Les créations, dans l'ordre du menu, avec leur touche. */
export const CREATIONS: readonly { creation: Creation; touche: string }[] = [
  { creation: 'contact', touche: 'C' },
  { creation: 'activite', touche: 'A' },
  { creation: 'tache', touche: 'T' },
  { creation: 'bien', touche: 'B' },
  { creation: 'demande', touche: 'D' },
]

/** Ce qu'on lit d'un appui de touche (un `KeyboardEvent` du navigateur convient). */
export type Appui = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  /** Vrai si le curseur est dans un champ de saisie : la touche écrit, elle ne commande pas. */
  dansUnChamp: boolean
}

/** Le raccourci que déclenche une touche, ou `null` si elle n'en est pas un. */
export function raccourciDe(appui: Appui): Raccourci | null {
  const touche = appui.key.toLowerCase()
  // Ctrl+K (⌘K sur Mac) marche partout, même depuis un champ.
  if ((appui.ctrlKey || appui.metaKey) && !appui.altKey && touche === 'k') {
    return { genre: 'recherche' }
  }
  if (appui.dansUnChamp || appui.ctrlKey || appui.metaKey || appui.altKey) return null
  if (touche === '/') return { genre: 'recherche' }
  if (touche === 'n') return { genre: 'menu' }
  const creation = CREATIONS.find((option) => option.touche.toLowerCase() === touche)
  return creation === undefined ? null : { genre: 'creer', creation: creation.creation }
}

/** Vrai si l'élément reçoit du texte tapé : commun à tous les raccourcis (`src/lib/clavier.ts`). */
export { estUnChamp } from '../../lib/clavier'
