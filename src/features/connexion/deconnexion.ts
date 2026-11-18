import { exigerSupabase } from '../../lib/supabase'
import { effacerRecentes } from '../saisie/recents'

/**
 * Déconnecte cet appareil uniquement : les autres appareils (téléphone, tablette,
 * ordinateur) restent connectés. Les fiches consultées récemment, gardées sur l'appareil,
 * sont effacées.
 */
export async function seDeconnecter(): Promise<void> {
  effacerRecentes()
  await exigerSupabase().auth.signOut({ scope: 'local' })
}
