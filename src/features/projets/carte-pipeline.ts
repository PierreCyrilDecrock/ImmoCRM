import { jourEnMots } from '../../lib/dates'
import { accorder, formaterPrix, fourchetteCourte, montantCourt } from '../../lib/nombres'
import { communeBien, type Bien } from '../biens/biens'
import { nomComplet, type Contact } from '../contacts/contacts'
import { pastilleRetard } from '../taches/retards'
import type { Tache } from '../taches/taches'
import { ancienneteEtape, etapeQuiTraine, JOURS_ETAPE_QUI_TRAINE } from './pipeline-vendeur'

/**
 * Ce que dit une carte de pipeline, communes aux pipelines vendeur et acquéreur : un titre
 * qui distingue deux projets d'un même contact, ce que vaut le projet, depuis quand il est à
 * son étape, et une prochaine action qui dit son jour en mots ou clairement qu'elle est en
 * retard. Sur ordinateur, chaque colonne totalise les montants de ses projets.
 */

/** Une ligne de la carte, et si elle doit attirer l'œil (en rouge). */
export type LigneCarte = { texte: string; alerte: boolean }

/** Le jour d'une tâche en tête de ligne : « Aujourd’hui », « Jeudi », « ven. 4 déc. ». */
function jourEnTete(date: string, aujourdhui: string): string {
  const jour = jourEnMots(date, aujourdhui)
  // Une date abrégée (« ven. 4 déc. ») reste en minuscules, comme partout.
  return /\d/.test(jour) ? jour : jour.charAt(0).toLocaleUpperCase('fr') + jour.slice(1)
}

/**
 * La prochaine action d'un projet, sur une ligne, son jour en mots (`jourEnMots`). D'abord
 * la plus proche des tâches liées au projet (« Jeudi · Envoyer l'avis de valeur », ou
 * « Envoyer l'avis de valeur · en retard · 2 j ») ; à défaut, la prochaine action du contact
 * (« Relance aujourd’hui », « Relance demain », « Relance jeudi », « Relance ven. 4 déc. »,
 * ou « Relance en retard · 1 j ») ; sinon « Aucune action prévue », en rouge. Rien pour un
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
          texte: `${jourEnTete(prochaine.echeance, aujourdhui)} · ${prochaine.titre}`,
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
      ? { texte: `Relance ${jourEnMots(echeance, aujourdhui)}`, alerte: false }
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

/**
 * L'ancienneté dans l'étape (« Depuis 40 jours »). Au-delà du seuil (`etapeQuiTraine`), elle
 * passe en orange et porte sa raison, lue par les lecteurs d'écran et en info-bulle : « Plus
 * de 30 jours à cette étape ».
 */
export function ligneAnciennete(
  etapeLe: string,
  aujourdhui: string,
): LigneCarte & { raison?: string } {
  const texte = ancienneteEtape(etapeLe, aujourdhui)
  return etapeQuiTraine(etapeLe, aujourdhui)
    ? { texte, alerte: true, raison: `Plus de ${JOURS_ETAPE_QUI_TRAINE} jours à cette étape` }
    : { texte, alerte: false }
}

/** La ligne de valeur d'une carte ; `connue` faux : en gris (« Prix à connaître »). */
export type LigneValeur = { texte: string; connue: boolean }

type MontantsVendeur = {
  prix_espere: number | null
  estimation_basse: number | null
  estimation_haute: number | null
}

/**
 * Ce que vaut un projet de vente : l'estimation dès qu'elle existe (« Estimé 410 – 440 k€ »),
 * sinon le prix espéré par le vendeur (« 300 000 € espérés »), sinon « Prix à connaître ».
 */
export function valeurVendeur(projet: MontantsVendeur): LigneValeur {
  const { estimation_basse: basse, estimation_haute: haute, prix_espere: espere } = projet
  if (basse !== null || haute !== null) {
    const estimation =
      basse !== null && haute !== null
        ? fourchetteCourte(basse, haute)
        : montantCourt(haute ?? basse ?? 0)
    return { texte: `Estimé ${estimation}`, connue: true }
  }
  if (espere !== null) return { texte: `${formaterPrix(espere)} espérés`, connue: true }
  return { texte: 'Prix à connaître', connue: false }
}

/**
 * Ce que vaut un projet d'achat : son budget (« Budget 200 – 300 k€ », « Budget jusqu’à
 * 300 k€ », « Budget dès 200 k€ »), sinon « Budget à préciser ».
 */
export function valeurAcquereur(projet: {
  budget_min: number | null
  budget_max: number | null
}): LigneValeur {
  const { budget_min: min, budget_max: max } = projet
  if (min !== null && max !== null) {
    return { texte: `Budget ${fourchetteCourte(min, max)}`, connue: true }
  }
  if (max !== null) return { texte: `Budget jusqu’à ${montantCourt(max)}`, connue: true }
  if (min !== null) return { texte: `Budget dès ${montantCourt(min)}`, connue: true }
  return { texte: 'Budget à préciser', connue: false }
}

/**
 * Le montant d'un projet de vente pour le total de sa colonne : le même que sa carte, le
 * haut de l'estimation dès qu'elle existe, sinon le prix espéré ; `null` s'il n'y en a pas.
 */
export function montantVendeur(projet: MontantsVendeur): number | null {
  return projet.estimation_haute ?? projet.estimation_basse ?? projet.prix_espere
}

/** Le montant d'un projet d'achat pour le total de sa colonne : son budget maximum. */
export function montantAcquereur(projet: { budget_max: number | null }): number | null {
  return projet.budget_max
}

/**
 * Le total d'une colonne, sous son titre sur ordinateur : le nombre de projets et la somme de
 * leurs montants (« 2 · 720 k€ »), les projets sans montant comptés à part (« 3 · 720 k€ · 1
 * sans montant ») ; « 2 · sans montant » si aucun n'en a. L'annonce dit la même chose en
 * entier, pour les lecteurs d'écran.
 */
export function totalColonne(montants: readonly (number | null)[]): {
  texte: string
  annonce: string
} {
  const nombre = montants.length
  const connus = montants.filter((montant): montant is number => montant !== null)
  const sans = nombre - connus.length
  const projets = accorder(nombre, 'projet')
  if (nombre === 0) return { texte: '0', annonce: 'Aucun projet' }
  if (connus.length === 0) {
    return { texte: `${nombre} · sans montant`, annonce: `${projets}, sans montant` }
  }
  const somme = connus.reduce((total, montant) => total + montant, 0)
  // Insécables : « 1 sans montant » passe à la ligne d'un bloc, dans une colonne étroite.
  const reste = sans === 0 ? '' : ` · ${sans}\u00a0sans\u00a0montant`
  return {
    texte: `${nombre} · ${montantCourt(somme)}${reste}`,
    annonce: `${projets}, ${formaterPrix(somme)} au total${sans === 0 ? '' : `, ${sans} sans montant`}`,
  }
}
