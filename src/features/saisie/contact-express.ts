import type { SupabaseClient } from '@supabase/supabase-js'
import { creer, type Resultat } from '../../lib/donnees'
import { heureDuMoment } from '../../lib/dates'
import {
  brouillonActiviteVide,
  creerActivite,
  LONGUEUR_MAX_COMPTE_RENDU,
  preparerActivite,
} from '../activites/activites'
import {
  brouillonVide,
  creerContact,
  preparerContact,
  type Contact,
  type Source,
  type Temperature,
  type ValeursContact,
} from '../contacts/contacts'
import { proposerRelance, type DelaisRelance } from '../relances/delais'
import { brouillonTacheVide, preparerTache, type Tache } from '../taches/taches'
import {
  prochaineVide,
  verifierProchaine,
  type BrouillonProchaine,
  type ErreursProchaine,
  type ProchaineProposee,
} from './prochaine-action'

/**
 * « Nouveau contact express » : un seul écran pour noter quelqu'un rencontré en porte-à-porte,
 * au téléphone ou en visite. Nom, téléphone, source, température, une première note et la
 * prochaine action. Le reste (adresse, rôles, consentement…) se complète sur la fiche.
 */

export type BrouillonContactExpress = {
  prenom: string
  nom: string
  telephone: string
  source: Source | ''
  temperature: Temperature | ''
  /** Première note : elle rejoint le journal du contact. */
  note: string
  prochaine: BrouillonProchaine
}

export type ErreursContactExpress = ErreursProchaine &
  Partial<Record<'nom' | 'telephone' | 'note', string>>

export function brouillonContactExpress(): BrouillonContactExpress {
  return {
    prenom: '',
    nom: '',
    telephone: '',
    source: '',
    temperature: '',
    note: '',
    prochaine: prochaineVide(),
  }
}

/** « Relancer Camille Fictif » ; « Relancer » tant que le nom n'est pas tapé. */
export function titreRelanceExpress(prenom: string, nom: string): string {
  const qui = [prenom.trim(), nom.trim()].filter((morceau) => morceau !== '').join(' ')
  return qui === '' ? 'Relancer' : `Relancer ${qui}`
}

/** La prochaine action proposée : relancer la personne, au rythme de sa température. */
export function prochaineProposeeContact(
  brouillon: Pick<BrouillonContactExpress, 'prenom' | 'nom' | 'temperature'>,
  aujourdhui: string,
  delais: DelaisRelance,
): ProchaineProposee {
  return {
    titre: titreRelanceExpress(brouillon.prenom, brouillon.nom),
    echeance: proposerRelance(aujourdhui, brouillon.temperature || null, delais).echeance,
  }
}

export type ContactExpressPrepare = {
  contact: ValeursContact
  note: string
  tache: ProchaineProposee | null
}

/**
 * Vérifie l'écran. Seul le nom est obligatoire ; le téléphone, s'il est tapé, doit être
 * lisible. Les valeurs du contact passent par la même vérification que la fiche complète.
 */
export function preparerContactExpress(
  brouillon: BrouillonContactExpress,
  contexte: { aujourdhui: string; delais: DelaisRelance },
): { ok: true; valeurs: ContactExpressPrepare } | { ok: false; erreurs: ErreursContactExpress } {
  const erreurs: ErreursContactExpress = {}
  const contact = preparerContact(
    {
      ...brouillonVide(contexte.aujourdhui),
      prenom: brouillon.prenom,
      nom: brouillon.nom,
      telephones: [brouillon.telephone],
      source: brouillon.source,
      temperature: brouillon.temperature,
    },
    contexte.aujourdhui,
  )
  if (!contact.ok) {
    if (contact.erreurs.nom !== undefined) erreurs.nom = contact.erreurs.nom
    const telephone = contact.erreurs.telephones?.[0]
    if (telephone !== undefined) erreurs.telephone = telephone
  }
  const note = brouillon.note.trim()
  if (note.length > LONGUEUR_MAX_COMPTE_RENDU) {
    erreurs.note = `${LONGUEUR_MAX_COMPTE_RENDU} caractères au plus.`
  }
  const prochaine = verifierProchaine(
    brouillon.prochaine,
    prochaineProposeeContact(brouillon, contexte.aujourdhui, contexte.delais),
    contexte.aujourdhui,
  )
  if (!prochaine.ok) Object.assign(erreurs, prochaine.erreurs)
  if (!contact.ok || !prochaine.ok || Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return { ok: true, valeurs: { contact: contact.valeurs, note, tache: prochaine.tache } }
}

/** Ce qui a déjà été enregistré, pour reprendre après un échec sans rien créer en double. */
export type AvanceeContactExpress = { contact: Contact | null; note: boolean }

export const AVANCEE_VIDE: AvanceeContactExpress = { contact: null, note: false }

/**
 * Enregistre dans l'ordre : le contact, la première note au journal, la prochaine action.
 * En cas d'échec, renvoie ce qui a déjà été fait : un nouvel essai repart de là.
 */
export async function enregistrerContactExpress(
  client: SupabaseClient,
  valeurs: ContactExpressPrepare,
  deja: AvanceeContactExpress,
  maintenant: { date: string; heure?: string },
): Promise<
  | { ok: true; contact: Contact; tache: Tache | null }
  | { ok: false; message: string; avancee: AvanceeContactExpress }
> {
  let contact = deja.contact
  if (contact === null) {
    const cree = await creerContact(client, valeurs.contact)
    if (!cree.ok) {
      return {
        ok: false,
        message: `Le contact n'a pas pu être créé. ${cree.erreur.message}`,
        avancee: deja,
      }
    }
    contact = cree.donnees
  }

  let note = deja.note
  if (!note && valeurs.note !== '') {
    const activite = preparerActivite(
      {
        ...brouillonActiviteVide(
          'note',
          { date: maintenant.date, heure: maintenant.heure ?? heureDuMoment() },
          { contact },
        ),
        compteRendu: valeurs.note,
      },
      maintenant.date,
    )
    const creee: Resultat<unknown> = activite.ok
      ? await creerActivite(client, activite.valeurs)
      : {
          ok: false,
          erreur: {
            genre: 'invalide',
            message: 'Elle est peut-être trop longue : ajoutez-la depuis la fiche du contact.',
          },
        }
    if (!creee.ok) {
      return {
        ok: false,
        message: `Le contact est créé, mais la note n'a pas pu être enregistrée. ${creee.erreur.message}`,
        avancee: { contact, note: false },
      }
    }
    note = true
  }

  if (valeurs.tache === null) return { ok: true, contact, tache: null }
  const tache = preparerTache({
    ...brouillonTacheVide(valeurs.tache.echeance, { contact }),
    titre: valeurs.tache.titre,
  })
  const creee: Resultat<Tache> = tache.ok
    ? await creer(client, 'taches', tache.valeurs)
    : {
        ok: false,
        erreur: {
          genre: 'invalide',
          message: 'Vérifiez son titre et sa date, puis ajoutez-la depuis la fiche du contact.',
        },
      }
  if (!creee.ok) {
    return {
      ok: false,
      message: `Le contact est créé, mais la prochaine action n'a pas pu être enregistrée. ${creee.erreur.message}`,
      avancee: { contact, note },
    }
  }
  return { ok: true, contact, tache: creee.donnees }
}
