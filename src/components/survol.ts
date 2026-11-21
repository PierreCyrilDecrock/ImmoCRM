/**
 * Classes d'un geste secondaire qui n'apparaît qu'au survol de sa ligne sur ordinateur :
 * caché sur un appareil à souris (`hover: hover`) tant que la ligne n'est pas survolée ni
 * atteinte au clavier ; toujours visible sur un écran tactile. La ligne porte `group/ligne`.
 * L'élément reste à sa place (seule son opacité change) : la ligne ne saute pas.
 */
export const VISIBLE_AU_SURVOL =
  'motion-safe:transition-opacity [@media(hover:hover)]:opacity-0 group-hover/ligne:opacity-100 group-focus-within/ligne:opacity-100'
