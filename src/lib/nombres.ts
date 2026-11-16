/** Nombres : mise en forme à la française. */

const ENTIER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/** Écrit un nombre entier avec ses séparateurs de milliers : « 30 000 ». */
export function formaterNombre(nombre: number): string {
  return ENTIER.format(nombre)
}

/** Accorde un mot avec un nombre : `accorder(2, 'contact')` donne « 2 contacts ». */
export function accorder(nombre: number, singulier: string, pluriel = `${singulier}s`): string {
  return `${formaterNombre(nombre)} ${nombre > 1 ? pluriel : singulier}`
}
