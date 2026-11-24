import { formaterJourCourt } from '../../lib/dates'
import { communeBien, type Bien } from '../biens/biens'
import { nomComplet, type Contact } from '../contacts/contacts'
import { pastilleRetard } from '../taches/retards'
import type { Tache } from '../taches/taches'

/**
 * Ce que dit une carte de pipeline, communes aux pipelines vendeur et acquéreur : un titre
 * qui distingue deux projets d'un même contact, et une prochaine action qui dit clairement
 * qu'elle est en retard.
 */

/** Une ligne de la carte, et si elle doit attirer l'œil (en rouge). */
export type LigneCarte = { texte: string; alerte: boolean }

/**
 * La prochaine action d'un projet, sur une ligne. D'abord la plus proche des tâches liées au
 * projet (« ven. 20 nov. · Envoyer l'avis de valeur », ou « Envoyer l'avis de valeur · en
 * retard · 2 j ») ; à défaut, la prochaine action du contact (« Relance · ven. 20 nov. », ou
 * « Relance en retard · 1 j ») ; sinon « Aucune action prévue », en rouge. Rien pour un
 * projet gagné.
 */
export function actionPipeline(
  affiche: {
    prochaine: Pick<Tache, 'echeance' | 'titre'> | null
    contact: Pick<Contact, 'prochaine_action_le'> | null
    projet: { etat: string }
  },
  aujourdhui: string,
): LigneCarte {
  const { prochaine, contact, projet } = affiche
  if (prochaine !== null) {
    const retard = pastilleRetard(prochaine.echeance, aujourdhui)
    return retard === null
      ? {
          texte: `${formaterJourCourt(prochaine.echeance, aujourdhui)} · ${prochaine.titre}`,
          alerte: false,
        }
      : { texte: `${prochaine.titre} · en retard · ${retard.texte}`, alerte: true }
  }
  if (projet.etat === 'gagne') return { texte: '', alerte: false }
  // Pas de tâche liée au projet : la prochaine action du contact, s'il en a une.
  const echeance = contact?.prochaine_action_le ?? null
  if (echeance !== null) {
    const retard = pastilleRetard(echeance, aujourdhui)
    return retard === null
      ? { texte: `Relance · ${formaterJourCourt(echeance, aujourdhui)}`, alerte: false }
      : { texte: `Relance en retard · ${retard.texte}`, alerte: true }
  }
  return { texte: 'Aucune action prévue', alerte: true }
}

/** L'adresse courte d'un bien : la voie seule, sinon la commune. */
export function adresseCourte(bien: Pick<Bien, 'adresse' | 'code_postal' | 'ville'>): string {
  return bien.adresse.trim() !== '' ? bien.adresse.trim() : communeBien(bien)
}

/**
 * Carte d'un projet de vente : le bien (adresse courte) en titre, le vendeur dessous. Deux
 * projets du même vendeur se distinguent ainsi par leur adresse.
 */
export function titresCarteVendeur(
  contact: Parameters<typeof nomComplet>[0] | null,
  bien: Pick<Bien, 'adresse' | 'code_postal' | 'ville'> | null,
): { titre: string; sousTitre: string } {
  const adresse = bien === null ? '' : adresseCourte(bien)
  return {
    titre: adresse === '' ? 'Bien introuvable' : adresse,
    sousTitre: contact === null ? 'Contact introuvable' : nomComplet(contact),
  }
}
