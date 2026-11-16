/** Numéro de version de l'application (celui de package.json). */
export const VERSION: string = __APP_VERSION__

/** Texte affiché à l'écran pour un numéro de version, par exemple « Version 0.1.0 ». */
export function libelleVersion(version: string): string {
  return `Version ${version.trim()}`
}
