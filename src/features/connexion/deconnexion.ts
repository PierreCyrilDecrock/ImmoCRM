import { exigerSupabase } from '../../lib/supabase'

/**
 * Déconnecte cet appareil uniquement : les autres appareils (téléphone, tablette,
 * ordinateur) restent connectés.
 */
export async function seDeconnecter(): Promise<void> {
  await exigerSupabase().auth.signOut({ scope: 'local' })
}
