import type { SupabaseClient } from '@supabase/supabase-js'
import { creer, listerPage, type Ligne, type Resultat } from '../../lib/donnees'
import { formaterDate } from '../../lib/dates'
import type { Contact } from './contacts'

/**
 * Consentement téléphonique. Règle du cadrage : sans accord enregistré pour être appelé,
 * l'appel direct est bloqué ; on peut passer outre en indiquant un motif, qui est enregistré.
 * Ces règles résument le cadrage (section Conformité) : elles sont à faire valider par un juriste.
 */

/** Un appel passé sans accord enregistré, avec son motif. */
export type AppelSansAccord = Ligne<'appels_sans_accord'>

export type MotifAppel = 'client_existant' | 'appel_entrant' | 'professionnel' | 'autre'

export const MOTIFS_APPEL: readonly { valeur: MotifAppel; libelle: string }[] = [
  { valeur: 'client_existant', libelle: 'Client existant : appel lié à un contrat en cours' },
  { valeur: 'appel_entrant', libelle: 'Appel entrant : la personne a appelé ou demandé un rappel' },
  { valeur: 'professionnel', libelle: 'Contact professionnel (notaire, artisan, confrère…)' },
  { valeur: 'autre', libelle: 'Autre motif (à préciser)' },
]

export const LONGUEUR_MAX_DETAIL_APPEL = 300

/** Libellé court d'un motif enregistré, pour l'historique et l'export. */
export function libelleMotifAppel(motif: string): string {
  const libelle = MOTIFS_APPEL.find((option) => option.valeur === motif)?.libelle
  return libelle === undefined ? motif : (libelle.split(/ : | \(/)[0] ?? libelle)
}

/** Pourquoi l'appel direct est bloqué. `opposition` l'emporte sur tout le reste. */
export type RaisonBlocage = 'opposition' | 'refus' | 'inconnu'

export type DroitAppel = { autorise: true } | { autorise: false; raison: RaisonBlocage }

type Consentement = Pick<Contact, 'accord_appel' | 'opposition_demarchage'>

/**
 * Peut-on appeler ce contact directement ? Oui seulement si son accord est enregistré et
 * qu'il ne s'est pas opposé au démarchage. « Client existant » ne lève pas le blocage :
 * c'est un motif à confirmer à chaque appel, proposé d'office dans la fenêtre.
 */
export function droitAppel(contact: Consentement): DroitAppel {
  if (contact.opposition_demarchage) return { autorise: false, raison: 'opposition' }
  if (contact.accord_appel === 'oui') return { autorise: true }
  return { autorise: false, raison: contact.accord_appel === 'non' ? 'refus' : 'inconnu' }
}

/** L'avertissement affiché à la place du bouton Appeler : un titre et une explication. */
export function avertissementAppel(
  raison: RaisonBlocage,
  contact: Pick<Contact, 'accord_appel_date' | 'opposition_demarchage_date'>,
): { titre: string; explication: string } {
  if (raison === 'opposition') {
    const date = formaterDate(contact.opposition_demarchage_date)
    return {
      titre: 'Appel bloqué : cette personne s’oppose au démarchage',
      explication: `Opposition notée${date === '' ? '' : ` le ${date}`}. Ne l'appelez que pour un dossier en cours ou à sa demande, et jamais pour prospecter.`,
    }
  }
  if (raison === 'refus') {
    const date = formaterDate(contact.accord_appel_date)
    return {
      titre: 'Appel bloqué : cette personne a refusé d’être appelée',
      explication: `Refus noté${date === '' ? '' : ` le ${date}`}. Ne l'appelez que pour un dossier en cours ou à sa demande.`,
    }
  }
  return {
    titre: 'Appel bloqué : aucun accord enregistré',
    explication:
      "Vous n'avez pas noté l'accord de cette personne pour être appelée. Le démarchage téléphonique sans accord préalable est interdit.",
  }
}

/** Résumé de l'accord pour la fiche et l'export : « Oui, depuis le 2 mars 2026 ». */
export function resumeAccord(contact: Pick<Contact, 'accord_appel' | 'accord_appel_date'>): string {
  const date = formaterDate(contact.accord_appel_date)
  if (contact.accord_appel === 'oui') return date === '' ? 'Oui' : `Oui, depuis le ${date}`
  if (contact.accord_appel === 'non') return date === '' ? 'Non' : `Non, depuis le ${date}`
  return 'Inconnu'
}

export type SaisieMotif = { motif: MotifAppel | ''; detail: string }

export type PreparationMotif =
  | { ok: true; motif: MotifAppel; detail: string }
  | { ok: false; erreurs: { motif?: string; detail?: string } }

/** Vérifie le motif d'un appel sans accord : un motif est obligatoire, « autre » s'explique. */
export function preparerMotif(saisie: SaisieMotif): PreparationMotif {
  const detail = saisie.detail.trim().slice(0, LONGUEUR_MAX_DETAIL_APPEL)
  if (saisie.motif === '') return { ok: false, erreurs: { motif: 'Choisissez un motif.' } }
  if (saisie.motif === 'autre' && detail === '') {
    return { ok: false, erreurs: { detail: 'Précisez le motif de cet appel.' } }
  }
  return { ok: true, motif: saisie.motif, detail }
}

/** Enregistre le motif d'un appel passé sans accord. À faire avant de proposer le numéro. */
export function enregistrerAppelSansAccord(
  client: SupabaseClient,
  appel: { contactId: string; telephone: string; motif: MotifAppel; detail: string },
): Promise<Resultat<AppelSansAccord>> {
  return creer(client, 'appels_sans_accord', {
    contact_id: appel.contactId,
    telephone: appel.telephone,
    motif: appel.motif,
    detail: appel.detail,
  })
}

/** Les appels sans accord d'un contact, les plus récents d'abord (200 au plus). */
export async function listerAppelsSansAccord(
  client: SupabaseClient,
  contactId: string,
): Promise<Resultat<AppelSansAccord[]>> {
  const resultat = await listerPage(client, 'appels_sans_accord', {
    archives: 'avec',
    filtres: [{ colonne: 'contact_id', genre: 'egal', valeur: contactId }],
    tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
    debut: 0,
    taille: 200,
  })
  if (!resultat.ok) return resultat
  return { ok: true, donnees: resultat.donnees.lignes }
}
