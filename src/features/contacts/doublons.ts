import type { SupabaseClient } from '@supabase/supabase-js'
import { appeler, type Resultat } from '../../lib/donnees'
import { nomDeListe, type Contact, type ValeursContact } from './contacts'

/**
 * Doublons : avant de créer une fiche, on cherche celles qui lui ressemblent (même
 * téléphone, même courriel ou nom très proche). La recherche est faite par la base
 * (fonction `doublons_contact`) ; ce fichier explique pourquoi chaque fiche est proposée.
 */

export type MotifDoublon = 'telephone' | 'courriel' | 'nom'

const LIBELLES: Record<MotifDoublon, string> = {
  telephone: 'même téléphone',
  courriel: 'même courriel',
  nom: 'nom très proche',
}

type Coordonnees = Pick<ValeursContact, 'telephones' | 'courriels'>

/**
 * Pourquoi cette fiche ressemble à celle qu'on enregistre. Si ni téléphone ni courriel
 * ne sont communs, c'est le nom qui l'a fait remonter.
 */
export function motifsDoublon(saisie: Coordonnees, existant: Contact): MotifDoublon[] {
  const motifs: MotifDoublon[] = []
  if ((saisie.telephones ?? []).some((numero) => existant.telephones.includes(numero))) {
    motifs.push('telephone')
  }
  if ((saisie.courriels ?? []).some((courriel) => existant.courriels.includes(courriel))) {
    motifs.push('courriel')
  }
  return motifs.length > 0 ? motifs : ['nom']
}

/** Les motifs en clair : « même téléphone, même courriel ». */
export function libelleMotifs(motifs: readonly MotifDoublon[]): string {
  return motifs.map((motif) => LIBELLES[motif]).join(', ')
}

/** Nom sous lequel la fiche qu'on enregistre serait classée (sert à comparer les noms). */
function nomCompare(valeurs: ValeursContact): string {
  return nomDeListe({
    type: valeurs.type ?? 'personne',
    civilite: null,
    prenom: valeurs.prenom ?? '',
    nom: valeurs.nom ?? '',
    raison_sociale: valeurs.raison_sociale ?? '',
  })
}

/**
 * Cherche les fiches qui ressemblent aux valeurs qu'on s'apprête à enregistrer (cinq au
 * plus, les plus sûres d'abord). `sauf` écarte la fiche en cours de modification.
 */
export function chercherDoublons(
  client: SupabaseClient,
  valeurs: ValeursContact,
  sauf?: string,
): Promise<Resultat<Contact[]>> {
  return appeler(client, 'doublons_contact', {
    p_telephones: valeurs.telephones ?? [],
    p_courriels: valeurs.courriels ?? [],
    p_nom: nomCompare(valeurs),
    ...(sauf === undefined ? {} : { p_sauf: sauf }),
  })
}
