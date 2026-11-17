import type { SupabaseClient } from '@supabase/supabase-js'
import { listerPage, type Filtre, type Resultat } from '../../lib/donnees'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'

/**
 * Fiches liées à une liste de lignes (tâches, activités) : les contacts et les biens dont
 * on veut afficher le nom ou l'adresse. Deux lectures en tout, quelle que soit la longueur
 * de la liste ; les fiches archivées sont lues aussi.
 */

/** Une ligne qui peut être liée à un contact et à un bien. */
export type AvecLiens = { contact_id: string | null; bien_id: string | null }

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

/** Les fiches lues, rangées par identifiant. */
export type FichesLues = { contacts: Map<string, Contact>; biens: Map<string, Bien> }

/** Lit les contacts et les biens liés à ces lignes (deux lectures au plus). */
export async function lireFiches(
  client: SupabaseClient,
  lignes: readonly AvecLiens[],
): Promise<Resultat<FichesLues>> {
  const idsContacts = identifiantsLies(lignes, 'contact_id')
  const idsBiens = identifiantsLies(lignes, 'bien_id')
  const [lusContacts, lusBiens] = await Promise.all([
    idsContacts.length > 0 ? lireParIds(client, 'contacts', idsContacts) : null,
    idsBiens.length > 0 ? lireParIds(client, 'biens', idsBiens) : null,
  ])
  if (lusContacts !== null && !lusContacts.ok) return lusContacts
  if (lusBiens !== null && !lusBiens.ok) return lusBiens
  return {
    ok: true,
    donnees: {
      contacts: new Map((lusContacts?.donnees.lignes ?? []).map((c) => [c.id, c])),
      biens: new Map((lusBiens?.donnees.lignes ?? []).map((b) => [b.id, b])),
    },
  }
}

/** Les fiches liées à une ligne, d'après les fiches lues. */
export function fichesDe(ligne: AvecLiens, fiches: FichesLues): AvecFiches {
  return {
    contact: ligne.contact_id === null ? null : (fiches.contacts.get(ligne.contact_id) ?? null),
    bien: ligne.bien_id === null ? null : (fiches.biens.get(ligne.bien_id) ?? null),
  }
}

/** Lit les contacts et les biens liés à ces lignes, et les ajoute à chacune. */
export async function lireFichesLiees<L extends AvecLiens>(
  client: SupabaseClient,
  lignes: readonly L[],
): Promise<Resultat<(AvecFiches & { ligne: L })[]>> {
  const fiches = await lireFiches(client, lignes)
  if (!fiches.ok) return fiches
  return {
    ok: true,
    donnees: lignes.map((ligne) => ({ ligne, ...fichesDe(ligne, fiches.donnees) })),
  }
}

/** Une fiche à laquelle des tâches ou des activités sont liées. */
export type LienFiche =
  | { contactId: string }
  | { bienId: string }
  | { projetVendeurId: string }
  | { projetAcquereurId: string }

/** La condition qui retrouve les lignes liées à cette fiche. */
export function filtreLien(
  lien: LienFiche,
): Filtre<'taches'> & Filtre<'activites'> & { genre: 'egal' } {
  if ('contactId' in lien) return { colonne: 'contact_id', genre: 'egal', valeur: lien.contactId }
  if ('bienId' in lien) return { colonne: 'bien_id', genre: 'egal', valeur: lien.bienId }
  if ('projetVendeurId' in lien) {
    return { colonne: 'projet_vendeur_id', genre: 'egal', valeur: lien.projetVendeurId }
  }
  return { colonne: 'projet_acquereur_id', genre: 'egal', valeur: lien.projetAcquereurId }
}
