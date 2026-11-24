import { ecartJours, formaterJourCourt } from '../../lib/dates'
import { libelleRole, TEMPERATURES, type Contact, type Temperature } from './contacts'

/**
 * Ce que dit une ligne de contact, d'un coup d'œil : qui (les initiales colorées selon le
 * rôle, le nom), où en est la relation (le rôle, le dernier échange, ou le retard de la
 * prochaine action en rouge) et la température, toujours à droite du nom. Tout vient de la fiche elle-même
 * (`dernier_contact_le`, `prochaine_action_le`, `temperature`) : la liste ne lit rien de plus,
 * sauf pour savoir si un contact a déjà été joint (`aVerifierJamaisContacte`).
 */

/**
 * Les rôles du contact, pour une ligne : « Vendeur », « Vendeur · Acquéreur ». Un contact
 * sans rôle est encore un prospect.
 */
export function rolesDuContact(contact: Pick<Contact, 'roles'>): string {
  return contact.roles.length === 0 ? 'Prospect' : contact.roles.map(libelleRole).join(' · ')
}

/** La teinte des initiales d'un contact, d'après son rôle. */
export type TeinteRole = 'vendeur' | 'acquereur' | 'prospect'

/**
 * La teinte des initiales : vendeur (bleu doux), sinon acquéreur (vert doux), sinon gris
 * (prospect, notaire, prescripteur, autre, ou relance sans contact). Un contact à la fois
 * vendeur et acquéreur prend la teinte vendeur : c'est le mandat qui se gagne. La même
 * fonction sert à l'accueil (relances) et à la liste des contacts.
 */
export function teinteRole(contact: Pick<Contact, 'roles'> | null): TeinteRole {
  if (contact === null) return 'prospect'
  if (contact.roles.includes('vendeur')) return 'vendeur'
  if (contact.roles.includes('acquereur')) return 'acquereur'
  return 'prospect'
}

/** « aujourd'hui », « hier », « il y a 7 j », « il y a 3 mois », « il y a plus d'un an ». */
export function depuisQuandCourt(jours: number): string {
  if (jours <= 0) return "aujourd'hui"
  if (jours === 1) return 'hier'
  if (jours < 60) return `il y a ${jours} j`
  if (jours < 365) return `il y a ${Math.floor(jours / 30)} mois`
  return "il y a plus d'un an"
}

/**
 * La date du dernier échange ne dit pas à elle seule si le contact a déjà été joint : la base
 * la fait partir de la date de collecte (le jour de création de la fiche). Tant qu'elle n'est
 * pas plus récente que cette date, il faut regarder le journal pour savoir.
 */
export function aVerifierJamaisContacte(
  contact: Pick<Contact, 'dernier_contact_le' | 'collecte_date'>,
): boolean {
  return contact.dernier_contact_le <= contact.collecte_date
}

/**
 * Seconde ligne d'un contact : « Vendeur · dernier échange il y a 7 j », ou « Prospect ·
 * Jamais contacté ». `jamaisContacte` : la réponse du journal pour une fiche à vérifier
 * (`undefined` tant qu'on ne sait pas, ou si la lecture a échoué : on ne dit rien du dernier
 * échange plutôt que de dire faux).
 */
export function detailLigneContact(
  contact: Pick<Contact, 'roles' | 'dernier_contact_le' | 'collecte_date'>,
  aujourdhui: string,
  jamaisContacte: boolean | undefined,
): string {
  const role = rolesDuContact(contact)
  const verifier = aVerifierJamaisContacte(contact)
  if (verifier && jamaisContacte === undefined) return role
  if (verifier && jamaisContacte) return `${role} · Jamais contacté`
  const jours = ecartJours(contact.dernier_contact_le, aujourdhui)
  return `${role} · dernier échange ${depuisQuandCourt(jours)}`
}

/**
 * Dans la vue « Sans prochaine action » : une fiche dont l'absence de suite a été confirmée
 * le dit (« Vendeur · Confirmé le jeu. 12 nov. ») ; les autres, comme partout.
 */
export function detailSansAction(
  contact: Pick<
    Contact,
    'roles' | 'dernier_contact_le' | 'collecte_date' | 'sans_prochaine_action_le'
  >,
  aujourdhui: string,
  jamaisContacte: boolean | undefined,
): string {
  if (contact.sans_prochaine_action_le === null) {
    return detailLigneContact(contact, aujourdhui, jamaisContacte)
  }
  return `${rolesDuContact(contact)} · Confirmé le ${formaterJourCourt(contact.sans_prochaine_action_le, aujourdhui)}`
}

/**
 * Un retard en mots courts : « 3 j » jusqu'à 59 jours, puis « 2 mois », puis « plus d'un an »,
 * et ce qu'entend un lecteur d'écran (« 3 jours », « un jour »).
 */
export function retardEnMots(jours: number): { texte: string; annonce: string } {
  if (jours < 60) {
    return { texte: `${jours} j`, annonce: jours === 1 ? 'un jour' : `${jours} jours` }
  }
  if (jours < 365) {
    const mois = Math.floor(jours / 30)
    return { texte: `${mois} mois`, annonce: `${mois} mois` }
  }
  return { texte: "plus d'un an", annonce: "plus d'un an" }
}

/**
 * Le retard de la prochaine action, en mots, pour la ligne grise : « relance en retard de 3 j »
 * (lu « relance en retard de 3 jours »). `null` si elle est prévue aujourd'hui ou plus tard,
 * ou s'il n'y en a pas.
 */
export function retardRelance(
  prochaineActionLe: string | null,
  aujourdhui: string,
): { texte: string; annonce: string } | null {
  if (prochaineActionLe === null) return null
  const jours = ecartJours(prochaineActionLe, aujourdhui)
  if (jours <= 0) return null
  const enMots = retardEnMots(jours)
  // « de 3 jours », mais « d'un jour ».
  const de = (mots: string) => (mots.startsWith('un ') ? `d'${mots}` : `de ${mots}`)
  return {
    texte: `relance en retard ${de(enMots.texte)}`,
    annonce: `relance en retard ${de(enMots.annonce)}`,
  }
}

/**
 * La ligne grise d'un contact (étape F.3, proposition 9 de la revue n° 2). Une prochaine
 * action en retard y prend la place du dernier échange, en rouge : « Acquéreur · relance en
 * retard de 3 j » (`debut` : « Acquéreur », `retard` : la fin rouge). Sinon, la ligne ne
 * change pas : le rôle et le dernier échange, ou la confirmation dans la vue « Sans prochaine
 * action » (`retard` vaut alors `null`).
 */
export function ligneGriseContact(
  contact: Pick<
    Contact,
    | 'roles'
    | 'dernier_contact_le'
    | 'collecte_date'
    | 'sans_prochaine_action_le'
    | 'prochaine_action_le'
  >,
  aujourdhui: string,
  jamaisContacte: boolean | undefined,
  sansAction = false,
): { debut: string; retard: { texte: string; annonce: string } | null } {
  const retard = retardRelance(contact.prochaine_action_le, aujourdhui)
  if (retard !== null) return { debut: rolesDuContact(contact), retard }
  const debut = sansAction
    ? detailSansAction(contact, aujourdhui, jamaisContacte)
    : detailLigneContact(contact, aujourdhui, jamaisContacte)
  return { debut, retard: null }
}

/** La température d'un contact, à droite de son nom. */
export type RepereContact = { temperature: Temperature; texte: string }

/**
 * À droite du nom, toujours la température (« Chaud »), jamais autre chose : la colonne garde
 * le même sens d'une ligne à l'autre. Rien si elle n'est pas renseignée. Le retard est dans
 * la ligne grise (`ligneGriseContact`).
 */
export function repereContact(contact: Pick<Contact, 'temperature'>): RepereContact | null {
  const option = TEMPERATURES.find((t) => t.valeur === contact.temperature)
  if (option === undefined) return null
  return { temperature: option.valeur, texte: option.libelle }
}
