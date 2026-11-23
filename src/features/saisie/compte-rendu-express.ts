import type { SupabaseClient } from '@supabase/supabase-js'
import { ajouterJours } from '../../lib/dates'
import { creer, type Resultat } from '../../lib/donnees'
import {
  brouillonActiviteVide,
  COMPTE_RENDU_VISITE_VIDE,
  creerActivite,
  preparerActivite,
  type CompteRenduVisite,
  type ErreursActivite,
  type ResultatAppel,
  type TypeActivite,
  type ValeursActivite,
} from '../activites/activites'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import type { LienProjet } from '../liens/lien-projet'
import { JOURS_RAPPEL_APRES_VISITE, titreRappelVisite, titreRelance } from '../relances/boucle'
import { proposerRelance, type DelaisRelance } from '../relances/delais'
import {
  brouillonTacheVide,
  preparerTache,
  type CategorieTache,
  type Tache,
  type ValeursTache,
} from '../taches/taches'
import {
  prochaineVide,
  verifierProchaine,
  type BrouillonProchaine,
  type ErreursProchaine,
  type ModeProchaine,
  type ProchaineProposee,
} from './prochaine-action'

/**
 * « Compte rendu express » : juste après un échange, on cherche le contact, on choisit ce
 * qui s'est passé (appel, visite…), on écrit le compte rendu, et on fixe la prochaine action.
 * Un seul écran, ouvert depuis le bouton « + » de n'importe quelle page.
 */

export type BrouillonCompteRendu = {
  contact: Contact | null
  type: TypeActivite
  resultat: ResultatAppel | ''
  compteRendu: string
  visite: CompteRenduVisite
  prochaine: BrouillonProchaine
}

export type ErreursCompteRendu = ErreursProchaine &
  Pick<ErreursActivite, 'compteRendu'> & { contact?: string }

export function brouillonCompteRendu(contact: Contact | null = null): BrouillonCompteRendu {
  return {
    contact,
    type: 'appel',
    resultat: '',
    compteRendu: '',
    visite: COMPTE_RENDU_VISITE_VIDE,
    prochaine: prochaineVide(modeDepart(contact)),
  }
}

/** Le contact a déjà une action prévue : on n'en propose pas une seconde par défaut. */
export function modeDepart(contact: Contact | null): ModeProchaine {
  return contact?.prochaine_action_le != null ? 'deja_prevue' : 'planifier'
}

/** Changer de contact : la prochaine action repart de zéro (titre et date proposés). */
export function choisirContact(
  brouillon: BrouillonCompteRendu,
  contact: Contact | null,
): BrouillonCompteRendu {
  return { ...brouillon, contact, prochaine: prochaineVide(modeDepart(contact)) }
}

/**
 * La prochaine action proposée : après une visite, rappeler l'acquéreur le lendemain
 * (cadrage, automatisations) ; sinon, relancer au rythme de la température du contact.
 */
export function prochaineProposeeCompteRendu(
  brouillon: Pick<BrouillonCompteRendu, 'contact' | 'type'>,
  aujourdhui: string,
  delais: DelaisRelance,
): ProchaineProposee {
  const { contact, type } = brouillon
  if (type === 'visite') {
    return {
      titre: contact === null ? 'Rappeler après la visite' : titreRappelVisite(contact),
      echeance: ajouterJours(aujourdhui, JOURS_RAPPEL_APRES_VISITE),
    }
  }
  return {
    titre: contact === null ? 'Relancer' : titreRelance(contact),
    echeance: proposerRelance(aujourdhui, contact?.temperature ?? null, delais).echeance,
  }
}

export type CompteRenduPrepare = { activite: ValeursActivite; tache: ValeursTache | null }

/**
 * Les fiches auxquelles l'échange est lié en plus du contact : le bien ou le projet de la
 * fiche ouverte (bloc « Consigner un échange » des fiches Bien et Projet, étape D.7).
 */
export type LiensEchange = { bien?: Bien | null; projet?: LienProjet | null }

/**
 * Vérifie l'écran et prépare l'activité du journal et, s'il y a lieu, la prochaine action.
 * `liens` : l'activité et la tâche sont aussi liées à ce bien ou ce projet.
 * `contactFacultatif` : l'échange peut rester sans contact (une note sur un bien) ; rien
 * n'est alors prévu ensuite.
 */
export function preparerCompteRendu(
  brouillon: BrouillonCompteRendu,
  contexte: {
    aujourdhui: string
    heure: string
    delais: DelaisRelance
    liens?: LiensEchange
    contactFacultatif?: boolean
  },
): { ok: true; valeurs: CompteRenduPrepare } | { ok: false; erreurs: ErreursCompteRendu } {
  const { aujourdhui, heure, delais, liens = {}, contactFacultatif = false } = contexte
  const erreurs: ErreursCompteRendu = {}
  const contact = brouillon.contact
  if (contact === null && !contactFacultatif) erreurs.contact = 'Choisissez le contact.'

  const activite = preparerActivite(
    {
      ...brouillonActiviteVide(brouillon.type, { date: aujourdhui, heure }, { ...liens, contact }),
      resultat: brouillon.resultat,
      compteRendu: brouillon.compteRendu,
      visite: brouillon.visite,
    },
    aujourdhui,
  )
  if (!activite.ok && activite.erreurs.compteRendu !== undefined) {
    erreurs.compteRendu = activite.erreurs.compteRendu
  }

  const prochaine = verifierProchaine(
    // Sans contact, rien n'est prévu ensuite : il n'y a personne à relancer.
    contact === null ? prochaineVide('aucune') : brouillon.prochaine,
    prochaineProposeeCompteRendu(brouillon, aujourdhui, delais),
    aujourdhui,
  )
  if (!prochaine.ok) Object.assign(erreurs, prochaine.erreurs)

  if (Object.keys(erreurs).length > 0 || !activite.ok || !prochaine.ok) {
    return { ok: false, erreurs }
  }

  let tache: ValeursTache | null = null
  if (prochaine.tache !== null) {
    const categorie: CategorieTache = 'relance'
    const preparee = preparerTache({
      ...brouillonTacheVide(prochaine.tache.echeance, { ...liens, contact }),
      titre: prochaine.tache.titre,
      categorie,
    })
    if (!preparee.ok) return { ok: false, erreurs: preparee.erreurs }
    tache = preparee.valeurs
  }
  return { ok: true, valeurs: { activite: activite.valeurs, tache } }
}

/**
 * Enregistre le compte rendu au journal, puis la prochaine action. `activiteDejaCreee` :
 * le compte rendu a été enregistré lors d'un premier essai, seule la tâche reste à créer.
 */
export async function enregistrerCompteRendu(
  client: SupabaseClient,
  valeurs: CompteRenduPrepare,
  activiteDejaCreee: boolean,
): Promise<
  { ok: true; tache: Tache | null } | { ok: false; message: string; activiteCreee: boolean }
> {
  if (!activiteDejaCreee) {
    const activite = await creerActivite(client, valeurs.activite)
    if (!activite.ok) {
      return {
        ok: false,
        message: `L'enregistrement a échoué. ${activite.erreur.message}`,
        activiteCreee: false,
      }
    }
  }
  if (valeurs.tache === null) return { ok: true, tache: null }
  const tache: Resultat<Tache> = await creer(client, 'taches', valeurs.tache)
  if (!tache.ok) {
    return {
      ok: false,
      message: `Le compte rendu est enregistré, mais la prochaine action n'a pas pu l'être. ${tache.erreur.message}`,
      activiteCreee: true,
    }
  }
  return { ok: true, tache: tache.donnees }
}
