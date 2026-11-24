import type { SupabaseClient } from '@supabase/supabase-js'
import { ecartJours } from '../../lib/dates'
import { appeler, type Resultat } from '../../lib/donnees'
import type { Contact } from './contacts'
import { aVerifierJamaisContacte, rolesDuContact } from './ligne-contact'

/** Au plus autant de fiches par lecture (limite de la fonction `dernieres_activites`). */
export const MAX_PAR_LECTURE = 200

/**
 * Pour chaque fiche demandée, `true` si elle n'a aucune activité au journal. Une seule
 * lecture, bornée (la dernière activité de chaque fiche, une ligne au plus par fiche).
 */
export async function lireJamaisContactes(
  client: SupabaseClient,
  ids: readonly string[],
): Promise<Resultat<Map<string, boolean>>> {
  const demandes = ids.slice(0, MAX_PAR_LECTURE)
  const resultat = await appeler(client, 'dernieres_activites', { p_contacts: demandes })
  if (!resultat.ok) return resultat
  const avecActivite = new Set(resultat.donnees.map((activite) => activite.contact_id))
  return { ok: true, donnees: new Map(demandes.map((id) => [id, !avecActivite.has(id)])) }
}

// ---------------------------------------------------------------------------
// Accueil : les contacts sans prochaine action (étape F.2, proposition 5)
// ---------------------------------------------------------------------------

/** Les contacts sans prochaine action montrés d'emblée à l'accueil ; la suite dans Contacts. */
export const SANS_ACTION_A_L_ACCUEIL = 3

const RANG_TEMPERATURE: Record<string, number> = { chaud: 0, tiede: 1, froid: 2, veille: 3 }

/** Vendeurs et acquéreurs d'abord (rang 0), puis notaires, prescripteurs, autres, prospects. */
function rangDuRole(contact: Pick<Contact, 'roles'>): number {
  return contact.roles.includes('vendeur') || contact.roles.includes('acquereur') ? 0 : 1
}

/**
 * L'ordre des contacts sans prochaine action à l'accueil : vendeurs et acquéreurs d'abord,
 * puis les autres (notaires, prescripteurs, autres, prospects) ; dans chaque groupe, les plus
 * chauds en tête (chaud, tiède, froid, veille, puis sans température). À égalité, l'ordre
 * reçu est gardé (la base les donne les plus récents d'abord). Les partenaires restent dans
 * la liste : le cadrage veut une prochaine action datée pour chaque contact.
 */
export function ordreSansAction<C extends Pick<Contact, 'roles' | 'temperature'>>(
  contacts: readonly C[],
): C[] {
  const rang = (contact: C) =>
    rangDuRole(contact) * 10 + (RANG_TEMPERATURE[contact.temperature ?? ''] ?? 4)
  // Le tri de JavaScript est stable : l'ordre reçu départage.
  return [...contacts].sort((a, b) => rang(a) - rang(b))
}

/** « aujourd'hui », « hier », « il y a 5 j », « il y a 3 sem. », « il y a 4 mois », « il y a plus d'un an ». */
export function ilYaCourt(jours: number): string {
  if (jours <= 0) return 'aujourd’hui'
  if (jours === 1) return 'hier'
  if (jours < 14) return `il y a ${jours} j`
  if (jours < 60) return `il y a ${Math.floor(jours / 7)} sem.`
  if (jours < 365) return `il y a ${Math.floor(jours / 30)} mois`
  return 'il y a plus d’un an'
}

/**
 * Sous le nom d'un contact sans prochaine action : le rôle, puis « jamais contacté » ou
 * l'ancienneté du dernier échange (« Vendeur · il y a 3 sem. »). `jamaisContacte` vient du
 * journal (`undefined` si la lecture a échoué : on n'en dit rien plutôt que de dire faux).
 */
export function detailSansActionAccueil(
  contact: Pick<Contact, 'roles' | 'dernier_contact_le' | 'collecte_date'>,
  aujourdhui: string,
  jamaisContacte: boolean | undefined,
): string {
  const role = rolesDuContact(contact)
  const verifier = aVerifierJamaisContacte(contact)
  if (verifier && jamaisContacte === undefined) return role
  if (verifier && jamaisContacte === true) return `${role} · jamais contacté`
  return `${role} · ${ilYaCourt(ecartJours(contact.dernier_contact_le, aujourdhui))}`
}
