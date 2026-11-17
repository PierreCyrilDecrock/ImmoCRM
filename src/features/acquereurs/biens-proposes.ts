import type { SupabaseClient } from '@supabase/supabase-js'
import type { GenreEtiquette } from '../../components/Etiquette'
import {
  appeler,
  archiver,
  creer,
  listerPage,
  modifier,
  type Ligne,
  type Resultat,
} from '../../lib/donnees'
import { estDateValide, estHeureValide } from '../../lib/dates'
import { adresseBien, type Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import type { CompteRenduVisite } from '../activites/activites'
import { LONGUEURS_MAX_TACHE, type Tache } from '../taches/taches'
import type { ProjetAcquereur } from './pipeline-acquereur'

/**
 * Biens proposés à un acquéreur (sa sélection), avec sa réaction, et planification des
 * visites. Voir docs/donnees.md, « Projets acquéreurs ».
 */

export type BienPropose = Ligne<'biens_proposes'>
export type Reaction = 'interesse' | 'a_visiter' | 'refuse'

export const REACTIONS: readonly { valeur: Reaction; libelle: string; genre: GenreEtiquette }[] = [
  { valeur: 'interesse', libelle: 'Intéressé', genre: 'succes' },
  { valeur: 'a_visiter', libelle: 'À visiter', genre: 'info' },
  { valeur: 'refuse', libelle: 'Refusé', genre: 'neutre' },
]

export const LONGUEUR_MAX_RAISON_REFUS = 500

/** « Intéressé », « À visiter », « Refusé », ou « Sans réponse ». */
export function libelleReaction(reaction: string | null): string {
  return REACTIONS.find((option) => option.valeur === reaction)?.libelle ?? 'Sans réponse'
}

export function genreReaction(reaction: string | null): GenreEtiquette {
  return REACTIONS.find((option) => option.valeur === reaction)?.genre ?? 'alerte'
}

/** La réaction au bien après une visite : une réaction, ou `null` pour ne rien changer. */
export type ReactionApresVisite = Reaction | null

/**
 * La réaction que suggère le compte rendu d'une visite (décision du 17/11/2026). D'abord la
 * suite envisagée : offre, contre-visite ou réflexion → intéressé ; ne donne pas suite →
 * refusé ; voir d'autres biens → inchangée. Sans suite renseignée, l'intérêt : fort ou
 * moyen → intéressé ; aucun → refusé ; faible ou non renseigné → inchangée.
 */
export function reactionApresVisite(visite: CompteRenduVisite): ReactionApresVisite {
  if (
    visite.suite === 'offre' ||
    visite.suite === 'contre_visite' ||
    visite.suite === 'reflexion'
  ) {
    return 'interesse'
  }
  if (visite.suite === 'abandon') return 'refuse'
  if (visite.suite === 'autres_biens') return null
  if (visite.interet === 'fort' || visite.interet === 'moyen') return 'interesse'
  if (visite.interet === 'aucun') return 'refuse'
  return null
}

/** La raison d'un refus après visite : les points négatifs, raccourcis s'il le faut. */
export function raisonRefusApresVisite(visite: CompteRenduVisite): string {
  return visite.pointsNegatifs.trim().slice(0, LONGUEUR_MAX_RAISON_REFUS)
}

/** Un bien proposé avec sa fiche, pour la rubrique du projet. */
export type BienProposeAffiche = { id: string; propose: BienPropose; bien: Bien | null }

/** Une proposition vue depuis le bien : à quel projet, et à qui. */
export type PropositionDuBien = {
  id: string
  propose: BienPropose
  projet: ProjetAcquereur | null
  contact: Contact | null
}

/**
 * Vérifie une réaction avant de l'enregistrer : la raison ne vaut que pour un refus (la
 * base le vérifie aussi), et reste courte.
 */
export function preparerReaction(
  reaction: Reaction | null,
  raison: string,
):
  | { ok: true; valeurs: { reaction: Reaction | null; raison_refus: string } }
  | { ok: false; erreur: string } {
  const texte = reaction === 'refuse' ? raison.trim() : ''
  if (texte.length > LONGUEUR_MAX_RAISON_REFUS) {
    return { ok: false, erreur: `${LONGUEUR_MAX_RAISON_REFUS} caractères au plus.` }
  }
  return { ok: true, valeurs: { reaction, raison_refus: texte } }
}

/** Ordre de la sélection : les plus récemment proposés d'abord. */
const TRI_PROPOSES = [
  { colonne: 'propose_le', croissant: false },
  { colonne: 'created_at', croissant: false },
  { colonne: 'id' },
] as const

/** La sélection d'un projet, avec la fiche de chaque bien. */
export async function listerBiensProposes(
  client: SupabaseClient,
  projetId: string,
): Promise<Resultat<BienProposeAffiche[]>> {
  const page = await listerPage(client, 'biens_proposes', {
    filtres: [{ colonne: 'projet_acquereur_id', genre: 'egal', valeur: projetId }],
    tri: TRI_PROPOSES,
    debut: 0,
    taille: 500,
  })
  if (!page.ok) return page
  const ids = [...new Set(page.donnees.lignes.map((propose) => propose.bien_id))]
  const biens = new Map<string, Bien>()
  if (ids.length > 0) {
    const lus = await listerPage(client, 'biens', {
      archives: 'avec',
      filtres: [{ colonne: 'id', genre: 'parmi', valeur: ids }],
      tri: [{ colonne: 'id' }],
      debut: 0,
      taille: ids.length,
    })
    if (!lus.ok) return lus
    for (const bien of lus.donnees.lignes) biens.set(bien.id, bien)
  }
  return {
    ok: true,
    donnees: page.donnees.lignes.map((propose) => ({
      id: propose.id,
      propose,
      bien: biens.get(propose.bien_id) ?? null,
    })),
  }
}

/** Les acquéreurs à qui un bien a été proposé, avec leur réaction. */
export async function listerPropositionsDuBien(
  client: SupabaseClient,
  bienId: string,
): Promise<Resultat<PropositionDuBien[]>> {
  const page = await listerPage(client, 'biens_proposes', {
    filtres: [{ colonne: 'bien_id', genre: 'egal', valeur: bienId }],
    tri: TRI_PROPOSES,
    debut: 0,
    taille: 500,
  })
  if (!page.ok) return page
  const idsProjets = [...new Set(page.donnees.lignes.map((p) => p.projet_acquereur_id))]
  const projets = new Map<string, ProjetAcquereur>()
  const contacts = new Map<string, Contact>()
  if (idsProjets.length > 0) {
    const lus = await listerPage(client, 'projets_acquereurs', {
      archives: 'avec',
      filtres: [{ colonne: 'id', genre: 'parmi', valeur: idsProjets }],
      tri: [{ colonne: 'id' }],
      debut: 0,
      taille: idsProjets.length,
    })
    if (!lus.ok) return lus
    for (const projet of lus.donnees.lignes) projets.set(projet.id, projet)
    const idsContacts = [...new Set(lus.donnees.lignes.map((p) => p.contact_id))]
    if (idsContacts.length > 0) {
      const personnes = await listerPage(client, 'contacts', {
        archives: 'avec',
        filtres: [{ colonne: 'id', genre: 'parmi', valeur: idsContacts }],
        tri: [{ colonne: 'id' }],
        debut: 0,
        taille: idsContacts.length,
      })
      if (!personnes.ok) return personnes
      for (const contact of personnes.donnees.lignes) contacts.set(contact.id, contact)
    }
  }
  return {
    ok: true,
    donnees: page.donnees.lignes
      // Un projet archivé (saisi par erreur) n'a rien à faire sur la fiche du bien.
      .filter((propose) => projets.get(propose.projet_acquereur_id)?.archived_at === null)
      .map((propose) => {
        const projet = projets.get(propose.projet_acquereur_id) ?? null
        return {
          id: propose.id,
          propose,
          projet,
          contact: projet === null ? null : (contacts.get(projet.contact_id) ?? null),
        }
      }),
  }
}

/** Ajoute un bien à la sélection d'un projet, daté d'aujourd'hui, sans réaction encore. */
export async function proposerBien(
  client: SupabaseClient,
  projetId: string,
  bienId: string,
): Promise<Resultat<BienPropose>> {
  const resultat = await creer(client, 'biens_proposes', {
    projet_acquereur_id: projetId,
    bien_id: bienId,
  })
  if (!resultat.ok && resultat.erreur.genre === 'doublon') {
    return {
      ok: false,
      erreur: { genre: 'doublon', message: 'Ce bien est déjà dans la sélection de ce projet.' },
    }
  }
  return resultat
}

export function changerReaction(
  client: SupabaseClient,
  id: string,
  valeurs: { reaction: Reaction | null; raison_refus: string },
): Promise<Resultat<BienPropose>> {
  return modifier(client, 'biens_proposes', id, valeurs)
}

/** Retire un bien de la sélection (proposé par erreur) : la ligne est archivée. */
export function retirerBienPropose(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<BienPropose>> {
  return archiver(client, 'biens_proposes', id)
}

// ---------------------------------------------------------------------------
// Visites
// ---------------------------------------------------------------------------

/** Durées proposées pour une visite, en minutes. */
export const DUREES_VISITE = [30, 45, 60, 90] as const
export const DUREE_VISITE_PAR_DEFAUT = 45

export type BrouillonVisite = {
  bien: Bien | null
  date: string
  /** `HH:MM`. */
  heure: string
  /** Minutes, ou vide. */
  duree: string
  motif: string
}

export type ErreursVisite = Partial<Record<'bien' | 'date' | 'heure' | 'duree', string>>

/** Paramètres de la fonction `planifier_visite` de la base. */
export type ParametresVisite = {
  p_projet: string
  p_bien: string
  p_echeance: string
  p_heure: string
  p_duree?: number
  p_lieu: string
  p_titre: string
  p_motif: string
}

/** Titre du rendez-vous : « Visite : 12 rue de l'Exemple ». */
export function titreVisite(bien: Pick<Bien, 'adresse'>): string {
  return `Visite : ${bien.adresse}`.slice(0, LONGUEURS_MAX_TACHE.titre)
}

/**
 * Vérifie une visite à planifier : un bien, un jour à partir d'aujourd'hui et une heure
 * (une visite est un rendez-vous). Le lieu est l'adresse du bien.
 */
export function preparerVisite(
  brouillon: BrouillonVisite,
  contexte: { projetId: string; aujourdhui: string },
): { ok: true; parametres: ParametresVisite } | { ok: false; erreurs: ErreursVisite } {
  const erreurs: ErreursVisite = {}
  if (brouillon.bien === null) erreurs.bien = 'Choisissez le bien à visiter.'
  if (!estDateValide(brouillon.date)) erreurs.date = 'Choisissez le jour de la visite.'
  else if (brouillon.date < contexte.aujourdhui) {
    erreurs.date =
      'Une visite se planifie à partir d’aujourd’hui. Pour une visite passée, consignez-la au journal.'
  }
  if (!estHeureValide(brouillon.heure.trim())) erreurs.heure = 'Indiquez l’heure. Exemple : 14:30.'
  const duree = brouillon.duree === '' ? null : Number(brouillon.duree)
  if (duree !== null && (!Number.isInteger(duree) || duree < 1 || duree > 1440)) {
    erreurs.duree = 'Durée illisible.'
  }
  if (Object.keys(erreurs).length > 0 || brouillon.bien === null) return { ok: false, erreurs }
  return {
    ok: true,
    parametres: {
      p_projet: contexte.projetId,
      p_bien: brouillon.bien.id,
      p_echeance: brouillon.date,
      p_heure: brouillon.heure.trim(),
      ...(duree === null ? {} : { p_duree: duree }),
      p_lieu: adresseBien(brouillon.bien).slice(0, LONGUEURS_MAX_TACHE.lieu),
      p_titre: titreVisite(brouillon.bien),
      p_motif: brouillon.motif.trim().slice(0, LONGUEURS_MAX_TACHE.motif),
    },
  }
}

/**
 * Planifie une visite en une seule opération : le rendez-vous (lié à l'acquéreur, au bien et
 * au projet) et le bien noté « à visiter » dans la sélection.
 */
export async function planifierVisite(
  client: SupabaseClient,
  parametres: ParametresVisite,
): Promise<Resultat<Tache>> {
  const resultat = await appeler(client, 'planifier_visite', parametres)
  if (!resultat.ok) return resultat
  const tache = resultat.donnees[0]
  return tache === undefined
    ? { ok: false, erreur: { genre: 'inconnue', message: 'La visite n’a pas été créée.' } }
    : { ok: true, donnees: tache }
}

/** Les visites consignées au journal d'un projet (critère de l'offre acceptée). */
export async function compterVisitesProjet(
  client: SupabaseClient,
  projetId: string,
): Promise<Resultat<number>> {
  const page = await listerPage(client, 'activites', {
    filtres: [
      { colonne: 'projet_acquereur_id', genre: 'egal', valeur: projetId },
      { colonne: 'type', genre: 'egal', valeur: 'visite' },
    ],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: 1,
    compter: true,
  })
  if (!page.ok) return page
  return { ok: true, donnees: page.donnees.total ?? page.donnees.lignes.length }
}
