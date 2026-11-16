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

/** Écrit un prix en euros, sans centimes : « 250 000 € ». */
export function formaterPrix(euros: number): string {
  return `${formaterNombre(euros)} €`
}

const DECIMAL = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/** Écrit un nombre avec au plus deux décimales, à la française : « 85,5 ». */
export function formaterDecimal(nombre: number): string {
  return DECIMAL.format(nombre)
}

/** Écrit une surface : « 85,5 m² ». */
export function formaterSurface(metresCarres: number): string {
  return `${formaterDecimal(metresCarres)} m²`
}

/**
 * Lit un nombre saisi à la française : espaces entre les milliers, virgule ou point pour
 * les décimales, unité éventuelle à la fin (« 250 000 € », « 85,5 m² », « 12 % »).
 * Renvoie `null` si rien n'est saisi, `'invalide'` si ce n'est pas un nombre positif ou nul.
 * `decimales` : nombre de décimales acceptées (0 par défaut : un nombre entier).
 */
export function lireNombre(saisie: string, decimales = 0): number | null | 'invalide' {
  const texte = saisie.replace(/\s/g, '').replace(/(€|m²|m2|%)$/i, '')
  if (texte === '') return saisie.trim() === '' ? null : 'invalide'
  const forme = decimales > 0 ? new RegExp(`^\\d+([.,]\\d{1,${decimales}})?$`) : /^\d+$/
  if (!forme.test(texte) || texte.replace(/[.,]\d*$/, '').length > 12) return 'invalide'
  return Number(texte.replace(',', '.'))
}

/** Écrit un poids de fichier : « 245 Ko », « 3,4 Mo », « 1 Go » (1 Ko = 1 000 octets). */
export function formaterPoids(octets: number): string {
  if (octets < 1000) return `${formaterNombre(octets)} octet${octets > 1 ? 's' : ''}`
  if (octets < 999_500) return `${formaterNombre(Math.round(octets / 1000))} Ko`
  const UN_CHIFFRE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
  if (octets < 999_950_000) return `${UN_CHIFFRE.format(octets / 1_000_000)} Mo`
  return `${formaterDecimal(octets / 1_000_000_000)} Go`
}
