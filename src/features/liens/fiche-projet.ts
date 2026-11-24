import type { GenreEtiquette } from '../../components/Etiquette'
import { formaterDate } from '../../lib/dates'
import type { GenreProjet } from './lien-projet'

/**
 * Fiches Projet de vente et Projet d'achat (étape D.7) : leurs onglets, sur le modèle de la
 * fiche Contact. La deuxième place revient, comme sur les fiches Contact et Bien, à ce qui
 * est lié au projet : les biens proposés d'un projet d'achat.
 */

export type OngletProjet = 'activite' | 'biens' | 'taches' | 'details'

export const LIBELLES_ONGLETS_PROJET: Record<OngletProjet, string> = {
  activite: 'Activité',
  biens: 'Biens proposés',
  taches: 'Tâches',
  details: 'Détails',
}

/** Les mêmes onglets sur tous les écrans ; « Biens proposés » pour un projet d'achat. */
export function ongletsProjet(genre: GenreProjet): readonly OngletProjet[] {
  return genre === 'acquereur'
    ? ['activite', 'biens', 'taches', 'details']
    : ['activite', 'taches', 'details']
}

/** Le haut d'une fiche projet : une ligne au-dessus du titre (type et contact), et le titre. */
export type EnTeteProjet = { surtitre: string; titre: string }

/**
 * Projet de vente : le bien en titre, « Projet de vente · Camille Fictif » au-dessus. Sans
 * bien, le vendeur passe en titre (il n'est pas écrit deux fois).
 */
export function enTeteProjetVendeur(bien: string | null, vendeur: string | null): EnTeteProjet {
  if (bien === null) {
    return { surtitre: 'Projet de vente', titre: vendeur ?? 'Projet de vente' }
  }
  return {
    surtitre: vendeur === null ? 'Projet de vente' : `Projet de vente · ${vendeur}`,
    titre: bien,
  }
}

/**
 * Projet d'achat : l'acquéreur en titre, « Projet d'achat » au-dessus, avec le co-acquéreur
 * s'il y en a un (« Projet d'achat · avec Dominique Essai »).
 */
export function enTeteProjetAcquereur(
  acquereur: string | null,
  coAcquereur: string | null,
): EnTeteProjet {
  return {
    surtitre: coAcquereur === null ? 'Projet d’achat' : `Projet d’achat · avec ${coAcquereur}`,
    titre: acquereur ?? 'Projet d’achat',
  }
}

/**
 * La pastille d'état, à côté du type de projet. Rien pour un projet en cours : son étape est
 * dans la frise, et nulle part ailleurs. Un projet hors du pipeline garde son état visible
 * (« À recontacter le … », « Perdu ») ; un projet gagné dit quand (`gagne` : « Mandat exclusif
 * signé le … », « Offre acceptée le … »).
 */
export function pastilleEtatProjet(projet: {
  etat: string
  archive: boolean
  recontacterLe: string | null
  gagne: string
}): { genre: GenreEtiquette; texte: string } | null {
  if (projet.archive) return { genre: 'neutre', texte: 'Archivé' }
  switch (projet.etat) {
    case 'a_recontacter':
      return {
        genre: 'alerte',
        texte:
          projet.recontacterLe === null
            ? 'À recontacter'
            : `À recontacter le ${formaterDate(projet.recontacterLe)}`,
      }
    case 'perdu':
      return { genre: 'neutre', texte: 'Perdu' }
    case 'gagne':
      return { genre: 'succes', texte: projet.gagne }
    default:
      return null
  }
}

/**
 * Sous « Aucune action prévue pour ce projet » : la prochaine action du contact, ailleurs.
 * « Prochaine action du vendeur, hors de ce projet : jeu. 26 nov. » (un seul point final,
 * même quand le mois abrégé en porte déjà un).
 */
export function repliProchaineAction(qui: string, jour: string): string {
  return `Prochaine action ${qui}, hors de ce projet : ${jour}${jour.endsWith('.') ? '' : '.'}`
}
