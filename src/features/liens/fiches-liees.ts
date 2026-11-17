import type { SupabaseClient } from '@supabase/supabase-js'
import { listerPage, type Resultat } from '../../lib/donnees'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'

/**
 * Fiches liées à une liste de lignes (tâches, activités) : les contacts et les biens dont
 * on veut afficher le nom ou l'adresse. Deux lectures en tout, quelle que soit la longueur
 * de la liste ; les fiches archivées sont lues aussi.
 */

/** Une ligne qui peut être liée à un contact et à un bien. */
type AvecLiens = { contact_id: string | null; bien_id: string | null }

/** Une ligne accompagnée des fiches auxquelles elle est liée. */
export type AvecFiches = { contact: Contact | null; bien: Bien | null }

/** Les identifiants distincts, sans les liens vides. */
export function identifiantsLies(lignes: readonly AvecLiens[], colonne: keyof AvecLiens): string[] {
  return [...new Set(lignes.flatMap((ligne) => (ligne[colonne] === null ? [] : [ligne[colonne]])))]
}

async function lireParIds<T extends 'contacts' | 'biens'>(
  client: SupabaseClient,
  table: T,
  ids: string[],
) {
  return listerPage(client, table, {
    archives: 'avec',
    filtres: [{ colonne: 'id', genre: 'parmi', valeur: ids }],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: ids.length,
  })
}

/** Lit les contacts et les biens liés à ces lignes, et les ajoute à chacune. */
export async function lireFichesLiees<L extends AvecLiens>(
  client: SupabaseClient,
  lignes: readonly L[],
): Promise<Resultat<(AvecFiches & { ligne: L })[]>> {
  const idsContacts = identifiantsLies(lignes, 'contact_id')
  const idsBiens = identifiantsLies(lignes, 'bien_id')
  const contacts = new Map<string, Contact>()
  const biens = new Map<string, Bien>()
  if (idsContacts.length > 0) {
    const lus = await lireParIds(client, 'contacts', idsContacts)
    if (!lus.ok) return lus
    for (const contact of lus.donnees.lignes) contacts.set(contact.id, contact)
  }
  if (idsBiens.length > 0) {
    const lus = await lireParIds(client, 'biens', idsBiens)
    if (!lus.ok) return lus
    for (const bien of lus.donnees.lignes) biens.set(bien.id, bien)
  }
  return {
    ok: true,
    donnees: lignes.map((ligne) => ({
      ligne,
      contact: ligne.contact_id === null ? null : (contacts.get(ligne.contact_id) ?? null),
      bien: ligne.bien_id === null ? null : (biens.get(ligne.bien_id) ?? null),
    })),
  }
}
