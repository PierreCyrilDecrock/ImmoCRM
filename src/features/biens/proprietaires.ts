import type { SupabaseClient } from '@supabase/supabase-js'
import { archiver, creer, listerPage, modifier, type Ligne, type Resultat } from '../../lib/donnees'
import { formaterDecimal, lireNombre } from '../../lib/nombres'
import type { Contact } from '../contacts/contacts'
import type { Bien } from './biens'

/**
 * Propriétaires d'un bien : un lien par contact, avec sa quote-part si elle est connue.
 * Retirer un propriétaire archive le lien : rien ne se supprime.
 */

/** Le lien entre un bien et l'un de ses propriétaires. */
export type LienProprietaire = Ligne<'biens_proprietaires'>

/** Un propriétaire d'un bien : le lien et la fiche du contact. */
export type Proprietaire = { lien: LienProprietaire; contact: Contact }

/** Un bien d'un contact : le lien et la fiche du bien. */
export type BienDuContact = { lien: LienProprietaire; bien: Bien }

/** Lit une quote-part saisie : « 50 », « 33,33 % ». `null` si elle est laissée vide. */
export function lireQuotePart(saisie: string): number | null | 'invalide' {
  const part = lireNombre(saisie, 2)
  if (part === null || part === 'invalide') return part
  return part <= 0 || part > 100 ? 'invalide' : part
}

/** Quote-part en clair : « 50 % », « 33,33 % ». */
export function formaterQuotePart(part: number): string {
  return `${formaterDecimal(part)} %`
}

/**
 * Remarque à afficher sous la liste des propriétaires quand les quotes-parts ne tombent pas
 * juste ; `null` si tout va bien ou si aucune n'est renseignée.
 */
export function remarqueQuotesParts(parts: readonly (number | null)[]): string | null {
  const connues = parts.filter((part) => part !== null)
  if (connues.length === 0) return null
  // Au centième près : trois parts de 33,33 % font un total acceptable.
  const total = Math.round(connues.reduce((somme, part) => somme + part, 0) * 100) / 100
  if (total > 100.01)
    return `Le total des quotes-parts dépasse 100 % (${formaterQuotePart(total)}).`
  if (connues.length === parts.length && total < 99.9) {
    return `Le total des quotes-parts ne fait que ${formaterQuotePart(total)}.`
  }
  return null
}

async function listerLiens(
  client: SupabaseClient,
  colonne: 'bien_id' | 'contact_id',
  id: string,
  archives: 'sans' | 'avec',
): Promise<Resultat<LienProprietaire[]>> {
  const resultat = await listerPage(client, 'biens_proprietaires', {
    archives,
    filtres: [{ colonne, genre: 'egal', valeur: id }],
    tri: [{ colonne: 'created_at' }, { colonne: 'id' }],
    debut: 0,
    taille: 200,
  })
  if (!resultat.ok) return resultat
  return { ok: true, donnees: resultat.donnees.lignes }
}

/** Les propriétaires d'un bien, dans l'ordre où ils ont été ajoutés. */
export async function listerProprietaires(
  client: SupabaseClient,
  bienId: string,
): Promise<Resultat<Proprietaire[]>> {
  const liens = await listerLiens(client, 'bien_id', bienId, 'sans')
  if (!liens.ok) return liens
  if (liens.donnees.length === 0) return { ok: true, donnees: [] }
  // Un contact archivé reste propriétaire : sa fiche est lue quand même.
  const contacts = await listerPage(client, 'contacts', {
    archives: 'avec',
    filtres: [{ colonne: 'id', genre: 'parmi', valeur: liens.donnees.map((l) => l.contact_id) }],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: 200,
  })
  if (!contacts.ok) return contacts
  const parId = new Map(contacts.donnees.lignes.map((contact) => [contact.id, contact]))
  return {
    ok: true,
    donnees: liens.donnees.flatMap((lien) => {
      const contact = parId.get(lien.contact_id)
      return contact === undefined ? [] : [{ lien, contact }]
    }),
  }
}

/**
 * Les biens dont un contact est propriétaire. `archives: 'avec'` ajoute les liens retirés
 * (pour l'export des données d'une personne).
 */
export async function listerBiensDuContact(
  client: SupabaseClient,
  contactId: string,
  archives: 'sans' | 'avec' = 'sans',
): Promise<Resultat<BienDuContact[]>> {
  const liens = await listerLiens(client, 'contact_id', contactId, archives)
  if (!liens.ok) return liens
  if (liens.donnees.length === 0) return { ok: true, donnees: [] }
  const biens = await listerPage(client, 'biens', {
    archives: 'avec',
    filtres: [{ colonne: 'id', genre: 'parmi', valeur: liens.donnees.map((l) => l.bien_id) }],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: 200,
  })
  if (!biens.ok) return biens
  const parId = new Map(biens.donnees.lignes.map((bien) => [bien.id, bien]))
  return {
    ok: true,
    donnees: liens.donnees.flatMap((lien) => {
      const bien = parId.get(lien.bien_id)
      return bien === undefined ? [] : [{ lien, bien }]
    }),
  }
}

export function ajouterProprietaire(
  client: SupabaseClient,
  valeurs: { bienId: string; contactId: string; quotePart: number | null },
): Promise<Resultat<LienProprietaire>> {
  return creer(client, 'biens_proprietaires', {
    bien_id: valeurs.bienId,
    contact_id: valeurs.contactId,
    quote_part: valeurs.quotePart,
  })
}

export function modifierQuotePart(
  client: SupabaseClient,
  lienId: string,
  quotePart: number | null,
): Promise<Resultat<LienProprietaire>> {
  return modifier(client, 'biens_proprietaires', lienId, { quote_part: quotePart })
}

/** Retire un propriétaire : le lien est archivé, le contact et le bien ne changent pas. */
export function retirerProprietaire(
  client: SupabaseClient,
  lienId: string,
): Promise<Resultat<LienProprietaire>> {
  return archiver(client, 'biens_proprietaires', lienId)
}
