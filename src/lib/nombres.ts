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

/** Un montant arrondi pour un repère : le nombre et son unité (€, k€ ou M€). */
function montantArrondi(euros: number): { nombre: string; unite: string } {
  const entier = Math.round(euros)
  if (entier < 1000) return { nombre: formaterNombre(entier), unite: '€' }
  const milliers = Math.round(entier / 1000)
  if (milliers < 1000) return { nombre: formaterNombre(milliers), unite: 'k€' }
  return { nombre: formaterDecimal(entier / 1_000_000), unite: 'M€' }
}

/**
 * Un montant court, pour une carte ou un total : « 850 € », « 415 k€ », « 1,25 M€ ». Une
 * espace insécable avant l'unité : elle ne passe jamais seule à la ligne.
 */
export function montantCourt(euros: number): string {
  const { nombre, unite } = montantArrondi(euros)
  return `${nombre}\u00a0${unite}`
}

/**
 * Une fourchette courte, l'unité écrite une fois : « 410 – 440 k€ » ; « 850 k€ – 1,2 M€ »
 * si les deux bouts n'ont pas la même unité ; un seul montant si les deux sont égaux.
 */
export function fourchetteCourte(bas: number, haut: number): string {
  const [petit, grand] = bas <= haut ? [bas, haut] : [haut, bas]
  const debut = montantArrondi(petit)
  const fin = montantArrondi(grand)
  if (debut.unite !== fin.unite) return `${montantCourt(petit)} – ${montantCourt(grand)}`
  if (debut.nombre === fin.nombre) return montantCourt(grand)
  return `${debut.nombre} – ${fin.nombre}\u00a0${fin.unite}`
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
