/** Les familles d'erreurs qu'un écran peut vouloir distinguer. */
export type GenreErreurDonnees =
  'reseau' | 'session' | 'droits' | 'doublon' | 'lien' | 'invalide' | 'introuvable' | 'inconnue'

/** Erreur d'accès aux données, déjà traduite : `message` peut être affiché tel quel. */
export type ErreurDonnees = { genre: GenreErreurDonnees; message: string }

/** Ce qu'on regarde dans une erreur renvoyée par Supabase lors d'un accès aux données. */
export type ErreurBrute = { code?: string; message?: string; status?: number }

const MESSAGES: Record<GenreErreurDonnees, string> = {
  reseau: 'Connexion à Internet impossible. Vérifiez votre réseau, puis réessayez.',
  session: 'Votre session a expiré. Reconnectez-vous, puis réessayez.',
  droits: "Cette action n'est pas autorisée.",
  doublon: 'Cet élément existe déjà.',
  lien: "Cet élément est lié à d'autres fiches : l'action est impossible en l'état.",
  invalide: "Une des informations saisies n'est pas acceptée. Vérifiez-les, puis réessayez.",
  introuvable: "Cet élément est introuvable. Il a peut-être été archivé ou n'existe plus.",
  inconnue: "Une erreur inattendue s'est produite. Réessayez dans un instant.",
}

/** Construit une erreur d'un genre donné, avec son message en français. */
export function erreurDonnees(genre: GenreErreurDonnees): ErreurDonnees {
  return { genre, message: MESSAGES[genre] }
}

function genreErreur({ code = '', message = '', status }: ErreurBrute): GenreErreurDonnees {
  // Le navigateur n'a pas pu joindre Supabase (les libellés varient selon le navigateur).
  if (status === 0 || /failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
    return 'reseau'
  }
  // Jeton de session expiré ou refusé.
  if (code === 'PGRST301' || code === 'PGRST303' || status === 401) return 'session'
  // Refus par les droits de la table ou par une règle d'accès par ligne.
  if (code === '42501' || status === 403) return 'droits'
  if (code === '23505') return 'doublon'
  if (code === '23503') return 'lien'
  // Valeur manquante, trop longue, mal formée ou refusée par une contrainte.
  if (code === '23502' || code === '23514' || code.startsWith('22')) return 'invalide'
  // Aucune ligne là où on en attendait une.
  if (code === 'PGRST116') return 'introuvable'
  return 'inconnue'
}

/** Traduit une erreur de Supabase en message clair, en français. Ne lève jamais d'erreur. */
export function traduireErreurDonnees(erreur: ErreurBrute): ErreurDonnees {
  return erreurDonnees(genreErreur(erreur))
}
