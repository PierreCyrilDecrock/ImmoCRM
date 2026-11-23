/** Le curseur dans le bloc « Consigner un échange » d'une fiche. */

/** L'identifiant du bloc : « Consigner » de la barre du bas y cherche le champ du texte. */
export const ID_CONSIGNER_ECHANGE = 'consigner-echange'

/** Met le curseur dans le texte et l'amène au milieu de l'écran. */
export function placerCurseur(champ: HTMLTextAreaElement) {
  champ.focus({ preventScroll: true })
  champ.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

/**
 * Le champ du texte, s'il est affiché. Appelé dans le geste même (toucher « Consigner »),
 * le curseur fait monter le clavier de l'iPhone, qui l'ignore hors d'un geste.
 */
export function champConsigner(): HTMLTextAreaElement | null {
  return document.querySelector<HTMLTextAreaElement>(`#${ID_CONSIGNER_ECHANGE} textarea`)
}
