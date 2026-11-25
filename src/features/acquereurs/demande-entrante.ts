import type { SupabaseClient } from '@supabase/supabase-js'
import { creer, modifier } from '../../lib/donnees'
import { formaterHeure, instantDeParis } from '../../lib/dates'
import type { Bien } from '../biens/biens'
import {
  deNom,
  brouillonVide,
  creerContact,
  nomComplet,
  preparerContact,
  type Contact,
  type ValeursContact,
} from '../contacts/contacts'
import { LONGUEURS_MAX_TACHE, type Tache } from '../taches/taches'
import {
  LONGUEURS_MAX_PROJET_ACQUEREUR,
  libelleOrigine,
  type OrigineDemande,
  type ProjetAcquereur,
} from './pipeline-acquereur'
import { creerProjetAcquereur, type CreationProjetAcquereur } from './projets-acquereurs'

/**
 * Demande entrante : un acquéreur appelle ou écrit depuis un portail. Un seul écran saisit
 * le contact (nouveau ou existant), le bien concerné, l'origine et l'heure de réception ;
 * l'enregistrement crée le contact s'il le faut, le projet acquéreur à l'étape « Demande »
 * et, sauf avis contraire, l'appel de qualification du jour (la demande se traite dans
 * l'heure).
 */

export type BrouillonDemande = {
  /** Contact existant choisi par la recherche ; `null` : nouveau contact. */
  contact: Contact | null
  prenom: string
  nom: string
  telephone: string
  courriel: string
  origine: OrigineDemande
  portail: string
  bien: Bien | null
  /** Jour et heure de réception, à Paris. */
  recueDate: string
  recueHeure: string
  /** Le message reçu, recopié dans les notes du projet. */
  message: string
  /** La personne demande à être rappelée : l'accord pour être appelé est noté, avec sa preuve. */
  demandeRappel: boolean
  /** Prévoir l'appel de qualification aujourd'hui. */
  planifierAppel: boolean
}

export type ErreursDemande = Partial<
  Record<'contact' | 'nom' | 'telephone' | 'courriel' | 'recue' | 'portail' | 'message', string>
>

export function brouillonDemande(
  maintenant: { date: string; heure: string },
  depart: { contact?: Contact | null; bien?: Bien | null } = {},
): BrouillonDemande {
  return {
    contact: depart.contact ?? null,
    prenom: '',
    nom: '',
    telephone: '',
    courriel: '',
    origine: 'portail',
    portail: '',
    bien: depart.bien ?? null,
    recueDate: maintenant.date,
    recueHeure: maintenant.heure,
    message: '',
    demandeRappel: false,
    planifierAppel: true,
  }
}

/** « Portail Leboncoin », « Appel » : le canal de la demande, pour les textes enregistrés. */
function canal(brouillon: Pick<BrouillonDemande, 'origine' | 'portail'>): string {
  const portail = brouillon.portail.trim()
  const origine = libelleOrigine(brouillon.origine)
  return portail === '' ? origine : `${origine} ${portail}`
}

/** Ce que l'enregistrement d'une demande va écrire. */
export type DemandePreparee = {
  /** Le nouveau contact à créer ; `null` si un contact existant est choisi. */
  nouveauContact: ValeursContact | null
  projet: CreationProjetAcquereur
  /** L'appel de qualification à créer (titre et jour), ou `null`. */
  appel: { titre: string; echeance: string } | null
}

/**
 * Vérifie la demande et prépare ce qu'il faut enregistrer. Un nouveau contact demande son
 * nom et un moyen de lui répondre (téléphone ou courriel) ; il est créé avec le rôle
 * Acquéreur, la source « Demande entrante » et l'origine de la collecte. S'il demande à être
 * rappelé, l'accord pour être appelé est noté avec sa preuve (la demande elle-même).
 */
export function preparerDemande(
  brouillon: BrouillonDemande,
  aujourdhui: string,
): { ok: true; demande: DemandePreparee } | { ok: false; erreurs: ErreursDemande } {
  const erreurs: ErreursDemande = {}
  const recueValide =
    /^\d{4}-\d{2}-\d{2}$/.test(brouillon.recueDate) && /^\d{2}:\d{2}$/.test(brouillon.recueHeure)
  if (!recueValide) erreurs.recue = 'Indiquez le jour et l’heure de réception.'
  else if (brouillon.recueDate > aujourdhui)
    erreurs.recue = 'La demande a déjà été reçue : la date est passée.'
  const portail = brouillon.portail.trim()
  if (portail.length > LONGUEURS_MAX_PROJET_ACQUEREUR.portail) {
    erreurs.portail = `${LONGUEURS_MAX_PROJET_ACQUEREUR.portail} caractères au plus.`
  }
  const message = brouillon.message.trim()
  if (message.length > LONGUEURS_MAX_PROJET_ACQUEREUR.notes - 100) {
    erreurs.message = 'Message trop long : gardez l’essentiel.'
  }

  const description = canal(brouillon)
  const quand = `le ${brouillon.recueDate.split('-').reverse().join('/')} à ${formaterHeure(brouillon.recueHeure)}`

  let nouveauContact: ValeursContact | null = null
  if (brouillon.contact === null) {
    if (brouillon.telephone.trim() === '' && brouillon.courriel.trim() === '') {
      erreurs.telephone = 'Indiquez un téléphone ou un courriel, pour pouvoir répondre.'
    }
    const saisie = {
      ...brouillonVide(recueValide ? brouillon.recueDate : aujourdhui),
      prenom: brouillon.prenom,
      nom: brouillon.nom,
      telephones: [brouillon.telephone],
      courriels: [brouillon.courriel],
      roles: ['acquereur' as const],
      source: 'demande_entrante' as const,
      source_detail: [description, brouillon.bien?.adresse ?? ''].filter(Boolean).join(', '),
      collecte_origine: `Demande entrante (${description})`,
      ...(brouillon.demandeRappel
        ? {
            accord_appel: 'oui' as const,
            accord_appel_date: brouillon.recueDate,
            accord_appel_preuve: `Demande de rappel reçue (${description}) ${quand}`,
          }
        : {}),
    }
    const contact = preparerContact(saisie, aujourdhui)
    if (!contact.ok) {
      if (contact.erreurs.nom !== undefined) erreurs.nom = contact.erreurs.nom
      const telephone = contact.erreurs.telephones?.find((e) => e !== undefined)
      if (telephone !== undefined) erreurs.telephone = telephone
      const courriel = contact.erreurs.courriels?.find((e) => e !== undefined)
      if (courriel !== undefined) erreurs.courriel = courriel
      if (Object.keys(erreurs).length === 0)
        erreurs.recue = 'La date de réception n’est pas valide.'
    } else {
      nouveauContact = contact.valeurs
    }
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }

  const nom =
    brouillon.contact !== null
      ? nomComplet(brouillon.contact)
      : [brouillon.prenom.trim(), brouillon.nom.trim()].filter(Boolean).join(' ')
  return {
    ok: true,
    demande: {
      nouveauContact,
      projet: {
        etape: 'demande',
        origine: brouillon.origine,
        portail,
        bien_origine_id: brouillon.bien?.id ?? null,
        recue_le: instantDeParis(brouillon.recueDate, brouillon.recueHeure),
        notes: message === '' ? '' : `Message reçu ${quand} : ${message}`,
      },
      appel: brouillon.planifierAppel
        ? {
            titre: `Qualifier la demande ${deNom(nom)}`.slice(0, LONGUEURS_MAX_TACHE.titre),
            echeance: aujourdhui,
          }
        : null,
    },
  }
}

/** Ce que l'enregistrement a créé, étape par étape (pour reprendre sans doublon). */
export type DemandeEnregistree = { contact: Contact; projet: ProjetAcquereur; appel: Tache | null }

/**
 * Enregistre la demande : le contact (créé, ou complété du rôle Acquéreur), le projet,
 * l'appel de qualification. `contactDejaCree` : contact créé lors d'un premier essai
 * interrompu, à ne pas recréer.
 */
export async function enregistrerDemande(
  client: SupabaseClient,
  brouillon: BrouillonDemande,
  demande: DemandePreparee,
  contactDejaCree: Contact | null,
): Promise<
  | { ok: true; donnees: DemandeEnregistree }
  | { ok: false; erreur: { message: string }; contactCree: Contact | null }
> {
  let contact = contactDejaCree ?? brouillon.contact
  if (contact === null) {
    if (demande.nouveauContact === null) {
      return { ok: false, erreur: { message: 'Choisissez le contact.' }, contactCree: null }
    }
    const cree = await creerContact(client, demande.nouveauContact)
    if (!cree.ok) {
      return {
        ok: false,
        erreur: { message: `Le contact n'a pas pu être créé. ${cree.erreur.message}` },
        contactCree: null,
      }
    }
    contact = cree.donnees
  } else if (!contact.roles.includes('acquereur')) {
    // Sans conséquence si cela échoue : le rôle se corrige sur la fiche.
    const roles = [...contact.roles, 'acquereur']
    const modifie = await modifier(client, 'contacts', contact.id, { roles })
    if (modifie.ok) contact = modifie.donnees
  }

  const projet = await creerProjetAcquereur(client, contact.id, demande.projet)
  if (!projet.ok) {
    return {
      ok: false,
      erreur: { message: `Le projet n'a pas pu être créé. ${projet.erreur.message}` },
      contactCree: contactDejaCree ?? (brouillon.contact === null ? contact : null),
    }
  }

  let appel: Tache | null = null
  if (demande.appel !== null) {
    const tache = await creer(client, 'taches', {
      titre: demande.appel.titre,
      categorie: 'relance',
      priorite: 1,
      echeance: demande.appel.echeance,
      motif: 'Demande entrante : répondre dans l’heure, puis qualifier (budget, critères).',
      contact_id: contact.id,
      bien_id: brouillon.bien?.id ?? null,
      projet_acquereur_id: projet.donnees.id,
    })
    // Le projet existe : un échec ici n'empêche pas d'aller plus loin (la fiche le signale).
    if (tache.ok) appel = tache.donnees
  }
  return { ok: true, donnees: { contact, projet: projet.donnees, appel } }
}
