/** Ce qu'on regarde dans une erreur renvoyée par Supabase lors d'une connexion. */
export type ErreurConnexion = { code?: string; status?: number; name?: string }

/** Traduit une erreur de connexion de Supabase en message clair, en français. */
export function messageErreurConnexion(erreur: ErreurConnexion): string {
  switch (erreur.code) {
    case 'invalid_credentials':
      return 'Courriel ou mot de passe incorrect.'
    case 'email_not_confirmed':
      return "Ce compte n'est pas encore confirmé. Ouvrez le courriel de confirmation reçu, puis réessayez."
    case 'user_banned':
      return 'Ce compte est bloqué.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
    case 'weak_password':
      return 'Ce mot de passe est trop simple. Choisissez-en un plus long ou plus varié.'
    case 'same_password':
      return "Le nouveau mot de passe doit être différent de l'ancien."
    case 'session_not_found':
    case 'session_expired':
      return 'Le lien a expiré. Demandez un nouveau courriel avec « Mot de passe oublié ».'
  }
  if (erreur.status === 429) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  }
  if (erreur.name === 'AuthRetryableFetchError' || erreur.status === 0) {
    return 'Connexion à Internet impossible. Vérifiez votre réseau, puis réessayez.'
  }
  return "Une erreur inattendue s'est produite. Réessayez dans un instant."
}

/** Longueur minimale demandée pour un nouveau mot de passe. */
export const LONGUEUR_MIN_MOT_DE_PASSE = 10

/** Vérifie un nouveau mot de passe et sa confirmation. Renvoie un message, ou `null` si tout va bien. */
export function validerNouveauMotDePasse(motDePasse: string, confirmation: string): string | null {
  if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
    return `Le mot de passe doit compter au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`
  }
  if (motDePasse !== confirmation) {
    return 'Les deux mots de passe ne sont pas identiques.'
  }
  return null
}
