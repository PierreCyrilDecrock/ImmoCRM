import type { SupabaseClient } from '@supabase/supabase-js'
import type { NomIcone } from '../../components/Icone'
import { phraseProchaineAction } from '../../lib/dates'
import {
  COMPTE_RENDU_VISITE_VIDE,
  INTERETS_VISITE,
  RESULTATS_APPEL,
  SUITES_VISITE,
  TYPES_ACTIVITE,
  type CompteRenduVisite,
  type ResultatAppel,
  type TypeActivite,
} from '../activites/activites'
import { deNom, nomComplet, type Contact } from '../contacts/contacts'
import {
  bouclerTache,
  brouillonBoucle,
  preparerBoucle,
  suitePrevue,
  type ParametresBoucle,
  type SuitePrevue,
} from '../relances/boucle'
import type { DelaisRelance } from '../relances/delais'
import { libelleJour } from '../taches/echeances'
import type { CategorieTache, Tache } from '../taches/taches'
import type { LienFiche } from '../liens/fiches-liees'
import {
  enregistrerCompteRendu,
  preparerCompteRendu,
  prochaineProposeeCompteRendu,
  type BrouillonCompteRendu,
  type CompteRenduPrepare,
  type ErreursCompteRendu,
  type LiensEchange,
} from './compte-rendu-express'
import { prochaineAffichee, prochaineVide, type BrouillonProchaine } from './prochaine-action'

/**
 * « Consigner un échange », en tête de l'onglet Activité d'une fiche (étape D.6 pour la fiche
 * Contact, D.7 pour les fiches Bien et Projet, où l'échange est aussi lié au bien ou au
 * projet) : le rituel « après chaque échange » sans ouvrir de fenêtre. La saisie est celle du compte rendu
 * express (`compte-rendu-express.ts`), le contact déjà choisi ; quand l'échange répond à une
 * relance ou à un rendez-vous du jour (ou en retard), il la clôt comme la boucle de relance
 * (`boucle.ts`, fonction `boucler_tache`) : tâche faite, activité au journal, prochaine action.
 */

type OptionType = { valeur: TypeActivite; libelle: string; icone: NomIcone }

function optionType(valeur: TypeActivite, libelle?: string): OptionType {
  const option = TYPES_ACTIVITE.find((type) => type.valeur === valeur)
  return {
    valeur,
    libelle: libelle ?? option?.libelle ?? valeur,
    icone: option?.icone ?? 'journal',
  }
}

/** Les cinq types proposés d'emblée, dans l'ordre de la maquette ; un SMS s'y dit « Message ». */
export const TYPES_ECHANGE: readonly OptionType[] = [
  optionType('appel'),
  optionType('rendez_vous'),
  optionType('visite'),
  optionType('sms', 'Message'),
  optionType('note'),
]

/** Les autres types, dépliés à la demande (« Autre »). */
export const AUTRES_TYPES_ECHANGE: readonly OptionType[] = TYPES_ACTIVITE.filter(
  (type) => !TYPES_ECHANGE.some((principal) => principal.valeur === type.valeur),
)

/** Le brouillon de départ : un appel, sans texte, la prochaine action laissée à la fiche. */
export function brouillonEchange(contact: Contact | null): BrouillonCompteRendu {
  // `deja_prevue` est un choix « par défaut » : sans rien de prévu, il vaut `planifier`
  // (voir `prochaineEffective`), et suit ainsi les tâches lues après coup.
  return {
    contact,
    type: 'appel',
    resultat: '',
    compteRendu: '',
    visite: COMPTE_RENDU_VISITE_VIDE,
    prochaine: prochaineVide('deja_prevue'),
  }
}

// ---------------------------------------------------------------------------
// La tâche que l'échange clôt
// ---------------------------------------------------------------------------

/** Les tâches auxquelles un échange de ce type répond (une relance se fait par un appel…). */
const CATEGORIES_CLOSES: Partial<Record<TypeActivite, readonly CategorieTache[]>> = {
  appel: ['relance', 'prospection'],
  sms: ['relance', 'prospection'],
  courriel: ['relance', 'prospection'],
  porte_a_porte: ['prospection', 'relance'],
  rendez_vous: ['rendez_vous', 'estimation', 'relance', 'prospection'],
  estimation: ['estimation', 'rendez_vous'],
  visite: ['visite'],
}

/**
 * La tâche que l'échange clôt par défaut : la plus ancienne des tâches à faire du contact,
 * prévue aujourd'hui ou en retard, à laquelle ce type d'échange répond. `null` s'il n'y en a
 * pas (une note ne clôt rien).
 */
export function tacheAClore(
  taches: readonly Tache[],
  type: TypeActivite,
  aujourdhui: string,
): Tache | null {
  const categories = CATEGORIES_CLOSES[type] ?? []
  return (
    [...taches]
      .filter(
        (tache) =>
          tache.etat === 'a_faire' &&
          tache.echeance <= aujourdhui &&
          (categories as readonly string[]).includes(tache.categorie),
      )
      .sort(
        (a, b) =>
          a.echeance.localeCompare(b.echeance) || (a.heure ?? '99').localeCompare(b.heure ?? '99'),
      )[0] ?? null
  )
}

/**
 * Les tâches liées à la fiche ouverte (un bien, un projet) : seules celles-là peuvent être
 * closes par un échange consigné depuis cette fiche, pour que l'activité, qui reprend les
 * liens de la tâche close, reste liée à la fiche. Depuis la fiche d'un contact, toutes.
 */
export function tachesDeLaFiche(taches: readonly Tache[], lien: LienFiche): Tache[] {
  if ('contactId' in lien) return [...taches]
  if ('bienId' in lien) return taches.filter((tache) => tache.bien_id === lien.bienId)
  if ('projetVendeurId' in lien) {
    return taches.filter((tache) => tache.projet_vendeur_id === lien.projetVendeurId)
  }
  return taches.filter((tache) => tache.projet_acquereur_id === lien.projetAcquereurId)
}

/**
 * Ce qui restera prévu pour le contact après l'enregistrement : la plus proche des autres
 * tâches à faire (et la suite d'une série, si l'échange en clôt une) ; `null` s'il n'y a rien.
 */
export function resteePrevue(
  taches: readonly Tache[],
  close: Tache | null,
  aujourdhui: string,
): SuitePrevue | null {
  if (close !== null) return suitePrevue(close, taches, aujourdhui)
  const prochaine = [...taches]
    .filter((tache) => tache.etat === 'a_faire')
    .sort((a, b) => a.echeance.localeCompare(b.echeance))[0]
  return prochaine === undefined
    ? null
    : { titre: prochaine.titre, echeance: prochaine.echeance, serie: false }
}

/**
 * La prochaine action telle qu'elle s'applique : « déjà prévu » n'a de sens que si quelque
 * chose reste prévu ; sinon, on planifie la relance proposée.
 */
export function prochaineEffective(
  prochaine: BrouillonProchaine,
  suite: SuitePrevue | null,
): BrouillonProchaine {
  return prochaine.mode === 'deja_prevue' && suite === null
    ? { ...prochaine, mode: 'planifier' }
    : prochaine
}

/** Le jour d'une tâche, entre parenthèses : « (demain) », « (hier, en retard) ». */
function quandEntreParentheses(echeance: string, aujourdhui: string, suite = ''): string {
  const jour = libelleJour(echeance, aujourdhui)
  const enMinuscules = /^(Aujourd|Demain|Hier)/.test(jour)
    ? jour.charAt(0).toLowerCase() + jour.slice(1)
    : jour
  const retard = echeance < aujourdhui ? ', en retard' : ''
  return `(${enMinuscules}${suite}${retard})`
}

/** « « Relancer Camille Fictif » (lun. 23 nov.) », pour « Déjà prévu ». */
export function texteDejaPrevu(suite: SuitePrevue, aujourdhui: string): string {
  const serie = suite.serie ? ', suite de la série' : ''
  return `« ${suite.titre} » ${quandEntreParentheses(suite.echeance, aujourdhui, serie)}`
}

/** « « Relancer Camille Fictif » (hier, en retard) » : la tâche que l'échange va cocher. */
export function texteTacheClose(tache: Tache, aujourdhui: string): string {
  return `« ${tache.titre} » ${quandEntreParentheses(tache.echeance, aujourdhui)}`
}

// ---------------------------------------------------------------------------
// Enregistrement
// ---------------------------------------------------------------------------

/** Ce qui part vers la base : la boucle (une tâche est close) ou le compte rendu express. */
export type EnvoiEchange =
  | { genre: 'boucle'; parametres: ParametresBoucle; echeance: string | null }
  | { genre: 'simple'; valeurs: CompteRenduPrepare; echeance: string | null }

export type ContexteEchange = {
  aujourdhui: string
  heure: string
  delais: DelaisRelance
  /** Les tâches à faire du contact. */
  taches: readonly Tache[]
  /** La tâche que l'échange clôt, ou `null`. */
  close: Tache | null
  /** Le bien ou le projet de la fiche ouverte, liés à l'activité et à la prochaine action. */
  liens?: LiensEchange
  /** L'échange peut rester sans contact (fiche Bien) : rien n'est alors prévu ensuite. */
  contactFacultatif?: boolean
}

/**
 * Vérifie le bloc et prépare l'envoi. Les règles sont celles du compte rendu express (texte,
 * prochaine action) ; quand une tâche est close, l'envoi passe par la boucle de relance, qui
 * fait tout en une seule opération.
 */
export function preparerEchange(
  brouillon: BrouillonCompteRendu,
  contexte: ContexteEchange,
): { ok: true; envoi: EnvoiEchange } | { ok: false; erreurs: ErreursCompteRendu } {
  const { aujourdhui, heure, delais, taches, close, liens, contactFacultatif } = contexte
  const contact = brouillon.contact
  const suite = resteePrevue(taches, close, aujourdhui)
  const effectif = { ...brouillon, prochaine: prochaineEffective(brouillon.prochaine, suite) }
  const preparation = preparerCompteRendu(effectif, {
    aujourdhui,
    heure,
    delais,
    liens,
    contactFacultatif,
  })
  if (!preparation.ok) return preparation
  const echeance = preparation.valeurs.tache?.echeance ?? null
  if (close === null || contact === null) {
    return { ok: true, envoi: { genre: 'simple', valeurs: preparation.valeurs, echeance } }
  }

  const proposee = prochaineAffichee(
    effectif.prochaine,
    prochaineProposeeCompteRendu(effectif, aujourdhui, delais),
  )
  const depart = brouillonBoucle(close, contact, { aujourdhui, delais, suite })
  const boucle = preparerBoucle(
    {
      ...depart,
      type: effectif.type,
      resultat: effectif.type === 'appel' ? effectif.resultat : '',
      compteRendu: effectif.compteRendu,
      visite: effectif.visite,
      mode: effectif.prochaine.mode,
      titre: proposee.titre,
      echeance: proposee.echeance,
    },
    { tache: close, contact, aujourdhui, suite },
  )
  if (!boucle.ok) {
    // Les vérifications sont les mêmes que plus haut : ce cas ne devrait pas se produire.
    const { compteRendu, titre, echeance: erreurDate, mode } = boucle.erreurs
    return {
      ok: false,
      erreurs: {
        ...(compteRendu === undefined ? {} : { compteRendu }),
        ...(titre === undefined && mode === undefined ? {} : { titre: titre ?? mode }),
        ...(erreurDate === undefined ? {} : { echeance: erreurDate }),
      },
    }
  }
  return { ok: true, envoi: { genre: 'boucle', parametres: boucle.parametres, echeance } }
}

/**
 * Enregistre l'échange. `activiteDejaCreee` : un premier essai du compte rendu express a
 * déjà mis l'activité au journal ; seule la tâche reste à créer.
 */
export async function enregistrerEchange(
  client: SupabaseClient,
  envoi: EnvoiEchange,
  activiteDejaCreee: boolean,
): Promise<{ ok: true } | { ok: false; message: string; activiteCreee: boolean }> {
  if (envoi.genre === 'simple') {
    const resultat = await enregistrerCompteRendu(client, envoi.valeurs, activiteDejaCreee)
    return resultat.ok ? { ok: true } : resultat
  }
  const resultat = await bouclerTache(client, envoi.parametres)
  if (resultat.ok) return { ok: true }
  return {
    ok: false,
    message: `L'enregistrement a échoué. ${resultat.erreur.message}`,
    activiteCreee: false,
  }
}

/** Le message qui confirme l'enregistrement. */
export function messageEchange(
  contact: Contact | null,
  echeance: string | null,
  aujourdhui: string,
): string {
  const debut =
    contact === null ? 'Ajouté au journal.' : `Ajouté au journal ${deNom(nomComplet(contact))}.`
  if (echeance === null) return debut
  return `${debut} ${phraseProchaineAction(echeance, aujourdhui)}`
}

// ---------------------------------------------------------------------------
// Brouillon gardé sur l'appareil
// ---------------------------------------------------------------------------

/** Ce qui est gardé d'un texte non enregistré : la saisie, sans la prochaine action. */
export type BrouillonGarde = {
  type: TypeActivite
  resultat: ResultatAppel | ''
  compteRendu: string
  visite: CompteRenduVisite
  /** Moment où il a été gardé (ISO). */
  le: string
}

/** Un brouillon plus vieux que cela n'est plus proposé. */
export const JOURS_GARDE_BROUILLON = 14

const PREFIXE_CLE = 'immocrm.echange.'

/** La clé du brouillon gardé : l'identifiant de la fiche (`fiche`, voir `ficheEchange`). */
export function cleBrouillonEchange(fiche: string): string {
  return `${PREFIXE_CLE}${fiche}`
}

/**
 * Ce qui distingue le brouillon d'une fiche : l'identifiant du contact (comme à l'étape D.6),
 * « bien. », « vendeur. » ou « acquereur. » suivi de l'identifiant pour les autres fiches.
 */
export function ficheEchange(lien: LienFiche): string {
  if ('contactId' in lien) return lien.contactId
  if ('bienId' in lien) return `bien.${lien.bienId}`
  if ('projetVendeurId' in lien) return `vendeur.${lien.projetVendeurId}`
  return `acquereur.${lien.projetAcquereurId}`
}

/** Vrai s'il y a quelque chose à garder : du texte, ou un compte rendu de visite commencé. */
export function aGarder(brouillon: Pick<BrouillonCompteRendu, 'compteRendu' | 'visite'>): boolean {
  const { visite } = brouillon
  return (
    brouillon.compteRendu.trim() !== '' ||
    visite.pointsPositifs.trim() !== '' ||
    visite.pointsNegatifs.trim() !== '' ||
    visite.interet !== '' ||
    visite.suite !== ''
  )
}

/**
 * Vrai s'il y a quelque chose à enregistrer : du texte, le résultat d'un appel, ou un compte
 * rendu de visite commencé. Tant que c'est faux, « Enregistrer » reste secondaire (blanc) :
 * au repos, le seul bouton bleu de la fiche est « Appeler » (revue de design, correction 6).
 */
export function aEnregistrer(
  brouillon: Pick<BrouillonCompteRendu, 'type' | 'compteRendu' | 'resultat' | 'visite'>,
): boolean {
  if (brouillon.compteRendu.trim() !== '') return true
  if (brouillon.type === 'appel') return brouillon.resultat !== ''
  if (brouillon.type === 'visite') return aGarder({ compteRendu: '', visite: brouillon.visite })
  return false
}

export function brouillonAGarder(
  brouillon: BrouillonCompteRendu,
  maintenant: Date,
): BrouillonGarde {
  return {
    type: brouillon.type,
    resultat: brouillon.resultat,
    compteRendu: brouillon.compteRendu,
    visite: brouillon.visite,
    le: maintenant.toISOString(),
  }
}

function texte(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur : ''
}

function parmi<V extends string>(valeur: unknown, options: readonly { valeur: V }[]): V | '' {
  return options.find((option) => option.valeur === valeur)?.valeur ?? ''
}

/**
 * Relit un brouillon gardé. `null` s'il est illisible, vide, ou trop vieux
 * (`JOURS_GARDE_BROUILLON`).
 */
export function lireBrouillonGarde(
  contenu: string | null,
  maintenant: Date,
): BrouillonGarde | null {
  if (contenu === null) return null
  let lu: unknown
  try {
    lu = JSON.parse(contenu)
  } catch {
    return null
  }
  if (typeof lu !== 'object' || lu === null) return null
  const objet = lu as Record<string, unknown>
  const type = parmi(objet.type, TYPES_ACTIVITE)
  const le = new Date(texte(objet.le))
  if (type === '' || Number.isNaN(le.getTime())) return null
  if (maintenant.getTime() - le.getTime() > JOURS_GARDE_BROUILLON * 24 * 3600 * 1000) return null
  const visite =
    typeof objet.visite === 'object' && objet.visite !== null
      ? (objet.visite as Record<string, unknown>)
      : {}
  const garde: BrouillonGarde = {
    type,
    resultat: parmi(objet.resultat, RESULTATS_APPEL),
    compteRendu: texte(objet.compteRendu),
    visite: {
      pointsPositifs: texte(visite.pointsPositifs),
      pointsNegatifs: texte(visite.pointsNegatifs),
      interet: parmi(visite.interet, INTERETS_VISITE),
      suite: parmi(visite.suite, SUITES_VISITE),
    },
    le: le.toISOString(),
  }
  return aGarder(garde) ? garde : null
}

/** Le bloc rempli avec un brouillon gardé (la prochaine action repart de la proposition). */
export function brouillonDepuisGarde(
  garde: BrouillonGarde,
  contact: Contact | null,
): BrouillonCompteRendu {
  return {
    ...brouillonEchange(contact),
    type: garde.type,
    resultat: garde.type === 'appel' ? garde.resultat : '',
    compteRendu: garde.compteRendu,
    visite: garde.visite,
  }
}

/** Le brouillon gardé pour cette fiche (`ficheEchange`) sur cet appareil, ou `null`. */
export function brouillonMemorise(
  fiche: string,
  maintenant: Date = new Date(),
): BrouillonGarde | null {
  try {
    return lireBrouillonGarde(window.localStorage.getItem(cleBrouillonEchange(fiche)), maintenant)
  } catch {
    return null
  }
}

/** Garde le brouillon (ou l'efface s'il n'y a plus rien à garder). */
export function memoriserBrouillon(fiche: string, brouillon: BrouillonCompteRendu): void {
  try {
    const cle = cleBrouillonEchange(fiche)
    if (aGarder(brouillon)) {
      window.localStorage.setItem(cle, JSON.stringify(brouillonAGarder(brouillon, new Date())))
    } else {
      window.localStorage.removeItem(cle)
    }
  } catch {
    // Mémoire de l'appareil indisponible (navigation privée) : on s'en passe.
  }
}
