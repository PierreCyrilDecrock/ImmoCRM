/** Ce que dit l'adresse quand on arrive depuis un lien envoyé par courriel par Supabase. */
export type RetourCourriel = { type: 'recuperation' } | { type: 'erreur'; message: string }

/**
 * Analyse la partie de l'adresse située après le « # ».
 * Supabase y place soit un jeton de récupération de mot de passe, soit une erreur
 * (lien expiré ou déjà utilisé). Une adresse normale de l'application (#/contacts) renvoie `null`.
 */
export function analyserRetourCourriel(ancre: string): RetourCourriel | null {
  const brut = ancre.replace(/^#/, '')
  if (brut === '' || brut.startsWith('/')) return null

  const parametres = new URLSearchParams(brut)
  if (parametres.has('error') || parametres.has('error_code')) {
    return {
      type: 'erreur',
      message:
        parametres.get('error_code') === 'otp_expired'
          ? 'Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau courriel avec « Mot de passe oublié ».'
          : "Ce lien n'a pas fonctionné. Demandez un nouveau courriel avec « Mot de passe oublié ».",
    }
  }
  if (parametres.has('access_token') && parametres.get('type') === 'recovery') {
    return { type: 'recuperation' }
  }
  return null
}

/**
 * Adresse vers laquelle Supabase renvoie après un clic dans le courriel : la racine du site,
 * sans ancre ni paramètre. Elle doit figurer dans les adresses autorisées du projet Supabase.
 */
export function adresseDeRetour(emplacement: { origin: string; pathname: string }): string {
  return emplacement.origin + emplacement.pathname
}
