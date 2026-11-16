/**
 * Téléphones : validation, format d'enregistrement et affichage.
 *
 * Un numéro est enregistré au format international sans espace (`+33612345678`), pour
 * qu'un même numéro s'écrive toujours de la même façon (utile pour repérer les doublons).
 * Il est affiché à la française (`06 12 34 56 78`).
 */

export type AnalyseTelephone = { ok: true; numero: string } | { ok: false; message: string }

const MESSAGE_INCOMPLET = 'Ce numéro est incomplet : un numéro français compte 10 chiffres.'
const MESSAGE_TROP_LONG = 'Ce numéro est trop long : un numéro français compte 10 chiffres.'
const MESSAGE_INVALIDE = "Ce numéro n'est pas reconnu. Exemple : 06 12 34 56 78."
const MESSAGE_CARACTERES =
  'Un numéro ne contient que des chiffres (espaces, points et tirets acceptés).'

/**
 * Lit un numéro tel qu'il a été saisi et le met au format d'enregistrement.
 * Accepte les espaces, points, tirets et parenthèses, les écritures `06…`, `+33 6…`,
 * `0033 6…` et `+33 (0)6…`, ainsi que les numéros étrangers écrits avec leur indicatif.
 */
export function analyserTelephone(saisie: string): AnalyseTelephone {
  // « (0) » après l'indicatif est une habitude d'écriture : il ne se compose pas.
  let texte = saisie.trim().replace(/\(0\)/g, '')
  if (/[^\d\s.\-()+]/.test(texte) || texte.lastIndexOf('+') > 0) {
    return { ok: false, message: MESSAGE_CARACTERES }
  }
  const international = texte.startsWith('+')
  texte = texte.replace(/\D/g, '')
  if (texte === '') return { ok: false, message: MESSAGE_INVALIDE }

  let chiffres = texte
  let avecIndicatif = international
  if (!international && chiffres.startsWith('00')) {
    chiffres = chiffres.slice(2)
    avecIndicatif = true
  }

  if (!avecIndicatif) {
    // Écriture nationale : 0, puis un chiffre de 1 à 9, puis huit chiffres.
    if (!chiffres.startsWith('0')) return { ok: false, message: MESSAGE_INVALIDE }
    if (chiffres.length < 10) return { ok: false, message: MESSAGE_INCOMPLET }
    if (chiffres.length > 10) return { ok: false, message: MESSAGE_TROP_LONG }
    if (chiffres[1] === '0') return { ok: false, message: MESSAGE_INVALIDE }
    return { ok: true, numero: `+33${chiffres.slice(1)}` }
  }

  if (chiffres.startsWith('33')) {
    // Numéro français avec indicatif : un « 0 » resté après +33 est toléré.
    let national = chiffres.slice(2)
    if (national.length === 10 && national.startsWith('0')) national = national.slice(1)
    if (national.length < 9) return { ok: false, message: MESSAGE_INCOMPLET }
    if (national.length > 9) return { ok: false, message: MESSAGE_TROP_LONG }
    if (national.startsWith('0')) return { ok: false, message: MESSAGE_INVALIDE }
    return { ok: true, numero: `+33${national}` }
  }

  // Numéro étranger : on vérifie seulement une longueur plausible (norme internationale).
  if (chiffres.startsWith('0') || chiffres.length < 8 || chiffres.length > 15) {
    return { ok: false, message: MESSAGE_INVALIDE }
  }
  return { ok: true, numero: `+${chiffres}` }
}

/** Vérifie un numéro saisi. Renvoie un message, ou `null` si tout va bien. */
export function validerTelephone(saisie: string): string | null {
  const analyse = analyserTelephone(saisie)
  return analyse.ok ? null : analyse.message
}

/**
 * Met un numéro en forme pour l'affichage : `06 12 34 56 78` pour un numéro français,
 * l'écriture internationale sinon. Un texte qui n'est pas un numéro est rendu tel quel.
 */
export function formaterTelephone(numero: string): string {
  const analyse = analyserTelephone(numero)
  if (!analyse.ok) return numero.trim()
  if (!analyse.numero.startsWith('+33')) return analyse.numero
  const national = `0${analyse.numero.slice(3)}`
  return national.replace(/(\d{2})(?=\d)/g, '$1 ')
}

/** Un numéro de portable français (06 ou 07) : le seul à recevoir des SMS à coup sûr. */
export function estPortable(numero: string): boolean {
  const analyse = analyserTelephone(numero)
  return analyse.ok && /^\+33[67]/.test(analyse.numero)
}

/** Adresse du lien qui lance un appel. */
export function lienAppel(numero: string): string {
  const analyse = analyserTelephone(numero)
  return `tel:${analyse.ok ? analyse.numero : numero.replace(/\s/g, '')}`
}

/** Adresse du lien qui ouvre un nouveau SMS. */
export function lienSms(numero: string): string {
  const analyse = analyserTelephone(numero)
  return `sms:${analyse.ok ? analyse.numero : numero.replace(/\s/g, '')}`
}
