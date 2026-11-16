import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { analyserRetourCourriel } from '../features/connexion/retour-courriel'
import { lireConfigSupabase } from './config-supabase'

/**
 * Accès à Supabase depuis le navigateur.
 *
 * Seule la clé publique est utilisée ici : elle est visible par tous, c'est normal.
 * La sécurité repose sur les règles d'accès par ligne de chaque table, dans la base.
 */

// À lire avant de créer le client : Supabase efface ensuite ces informations de l'adresse.
const retourCourriel = analyserRetourCourriel(window.location.hash)

/** Vrai si la page a été ouverte depuis le lien « mot de passe oublié » reçu par courriel. */
export const arriveeParLienDeRecuperation = retourCourriel?.type === 'recuperation'

/** Message à afficher si le lien reçu par courriel n'est plus valable, sinon `null`. */
export const erreurLienCourriel = retourCourriel?.type === 'erreur' ? retourCourriel.message : null

if (retourCourriel?.type === 'erreur') {
  // Nettoie l'adresse pour que la navigation reparte d'une adresse normale.
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

const lecture = lireConfigSupabase({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_CLE_PUBLIQUE: import.meta.env.VITE_SUPABASE_CLE_PUBLIQUE,
})

/** Explication en français si la configuration est absente ou incorrecte, sinon `null`. */
export const erreurConfigSupabase: string | null = lecture.ok ? null : lecture.message

/**
 * Client Supabase, ou `null` si la configuration manque (l'application affiche alors
 * un écran d'explication). La session est conservée dans le navigateur et renouvelée
 * automatiquement : elle survit à un rechargement de page.
 */
export const supabase: SupabaseClient | null = lecture.ok
  ? createClient(lecture.config.url, lecture.config.clePublique, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

/** Client Supabase pour les écrans qui ne s'affichent que si la configuration est correcte. */
export function exigerSupabase(): SupabaseClient {
  if (supabase === null) throw new Error(erreurConfigSupabase ?? 'Supabase non configuré')
  return supabase
}
