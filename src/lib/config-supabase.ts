/** Réglages nécessaires pour joindre Supabase depuis le navigateur. */
export type ConfigSupabase = { url: string; clePublique: string }

export type LectureConfigSupabase =
  { ok: true; config: ConfigSupabase } | { ok: false; message: string }

/** Variables d'environnement lues par Vite (fichier .env.local ou variables du dépôt GitHub). */
export type VariablesSupabase = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_CLE_PUBLIQUE?: string
}

/** Lit le rôle inscrit dans une clé Supabase d'ancien format (jeton en trois parties). */
function roleDeLaCle(cle: string): string | undefined {
  const charge = cle.split('.')[1]
  if (charge === undefined) return undefined
  try {
    const texte = atob(charge.replace(/-/g, '+').replace(/_/g, '/'))
    const contenu: unknown = JSON.parse(texte)
    if (typeof contenu === 'object' && contenu !== null && 'role' in contenu) {
      return typeof contenu.role === 'string' ? contenu.role : undefined
    }
  } catch {
    // Clé illisible : ce n'est pas un jeton, on ne peut rien en dire.
  }
  return undefined
}

/**
 * Indique si une clé est une clé d'administration Supabase (« secret » ou « service_role »).
 * Une telle clé contourne les règles d'accès par ligne : elle ne doit jamais arriver dans le site.
 */
export function estCleAdministration(cle: string): boolean {
  return cle.startsWith('sb_secret_') || roleDeLaCle(cle) === 'service_role'
}

/**
 * Vérifie la configuration Supabase et renvoie soit les réglages, soit un message
 * en français qui dit ce qui manque. Ne lève jamais d'erreur.
 */
export function lireConfigSupabase(variables: VariablesSupabase): LectureConfigSupabase {
  const url = variables.VITE_SUPABASE_URL?.trim() ?? ''
  const clePublique = variables.VITE_SUPABASE_CLE_PUBLIQUE?.trim() ?? ''

  if (url === '' || clePublique === '') {
    return {
      ok: false,
      message: "L'adresse du projet Supabase ou sa clé publique n'est pas renseignée.",
    }
  }
  if (
    !/^https:\/\/[^\s/]+\/?$/.test(url) &&
    !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(url)
  ) {
    return {
      ok: false,
      message:
        "L'adresse du projet Supabase n'a pas la bonne forme. Elle doit ressembler à https://xxxxxxxx.supabase.co",
    }
  }
  if (estCleAdministration(clePublique)) {
    return {
      ok: false,
      message:
        "La clé fournie est une clé d'administration. Seule la clé publique doit être utilisée : remplacez-la, puis renouvelez la clé d'administration dans Supabase.",
    }
  }
  return { ok: true, config: { url: url.replace(/\/$/, ''), clePublique } }
}
