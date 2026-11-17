import type { GenreEtiquette } from '../../components/Etiquette'
import { estDateValide, formaterDate } from '../../lib/dates'
import type { Ligne, Modification } from '../../lib/donnees'
import { formaterNombre, formaterPrix, lireNombre } from '../../lib/nombres'
import { libelleType, TYPES_BIEN, type TypeBien } from '../biens/biens'
import { dateRecontacter, lireMontant } from '../projets/pipeline-vendeur'

/**
 * Pipeline acquéreur : les étapes d'un projet acquéreur (une recherche), leurs critères de
 * sortie et les sorties possibles à toute étape (à recontacter, perdu), plus l'offre
 * acceptée qui gagne le projet. Règles pures, testées ; la base vérifie les mêmes critères
 * (migration 0013). Voir docs/donnees.md, « Projets acquéreurs ».
 */

export type ProjetAcquereur = Ligne<'projets_acquereurs'>

export type EtapeAcquereur = 'demande' | 'qualification' | 'selection' | 'visites'
export type EtatProjetAcquereur = 'actif' | 'a_recontacter' | 'perdu' | 'gagne'
export type MotifPerteAcquereur =
  'achat_confrere' | 'achat_particuliers' | 'abandon' | 'financement' | 'autre'
export type OrigineDemande = 'appel' | 'portail' | 'courriel' | 'site' | 'recommandation' | 'autre'
export type Urgence = 'moins_3_mois' | 'trois_six_mois' | 'plus_6_mois' | 'sans_date'
export type Financement = 'comptant' | 'pret'

type Option<V extends string> = { valeur: V; libelle: string }

/** Les étapes, dans l'ordre, avec le critère qui permet d'en sortir (cadrage). */
export const ETAPES_ACQUEREUR: readonly (Option<EtapeAcquereur> & { critere: string })[] = [
  { valeur: 'demande', libelle: 'Demande', critere: 'Appel ou portail' },
  { valeur: 'qualification', libelle: 'Qualification', critere: 'Budget, critères' },
  { valeur: 'selection', libelle: 'Sélection', critere: 'Biens proposés' },
  { valeur: 'visites', libelle: 'Visites', critere: 'Comptes rendus' },
]

export const ETATS_PROJET_ACQUEREUR: readonly (Option<EtatProjetAcquereur> & {
  genre: GenreEtiquette
})[] = [
  { valeur: 'actif', libelle: 'En cours', genre: 'info' },
  { valeur: 'a_recontacter', libelle: 'À recontacter', genre: 'alerte' },
  { valeur: 'perdu', libelle: 'Perdu', genre: 'neutre' },
  { valeur: 'gagne', libelle: 'Offre acceptée', genre: 'succes' },
]

export const MOTIFS_PERTE_ACQUEREUR: readonly Option<MotifPerteAcquereur>[] = [
  { valeur: 'achat_confrere', libelle: 'Achat par un confrère' },
  { valeur: 'achat_particuliers', libelle: 'Achat entre particuliers' },
  { valeur: 'abandon', libelle: 'Projet abandonné' },
  { valeur: 'financement', libelle: 'Financement refusé' },
  { valeur: 'autre', libelle: 'Autre' },
]

export const ORIGINES_DEMANDE: readonly Option<OrigineDemande>[] = [
  { valeur: 'portail', libelle: 'Portail' },
  { valeur: 'appel', libelle: 'Appel' },
  { valeur: 'courriel', libelle: 'Courriel' },
  { valeur: 'site', libelle: 'Site ou réseaux' },
  { valeur: 'recommandation', libelle: 'Recommandation' },
  { valeur: 'autre', libelle: 'Autre' },
]

/** Portails proposés d'un toucher (le champ reste libre). */
export const PORTAILS_COURANTS = [
  'Leboncoin',
  'SeLoger',
  'Bien’ici',
  'Logic-Immo',
  'Site du réseau',
] as const

export const URGENCES: readonly Option<Urgence>[] = [
  { valeur: 'moins_3_mois', libelle: 'Moins de 3 mois' },
  { valeur: 'trois_six_mois', libelle: '3 à 6 mois' },
  { valeur: 'plus_6_mois', libelle: 'Plus de 6 mois' },
  { valeur: 'sans_date', libelle: 'Pas de date' },
]

export const FINANCEMENTS: readonly Option<Financement>[] = [
  { valeur: 'comptant', libelle: 'Comptant' },
  { valeur: 'pret', libelle: 'Prêt' },
]

/** Au plus autant de secteurs par recherche (la base le vérifie aussi). */
export const MAX_SECTEURS = 20
export const LONGUEUR_MAX_SECTEUR = 80

export const LONGUEURS_MAX_PROJET_ACQUEREUR = {
  portail: 100,
  criteres_indispensables: 2000,
  criteres_souhaites: 2000,
  motif_perte_detail: 500,
  notes: 5000,
} as const

function libelleDe<V extends string>(options: readonly Option<V>[], valeur: string | null) {
  return options.find((option) => option.valeur === valeur)?.libelle ?? valeur ?? ''
}

export const libelleEtapeAcquereur = (etape: string) => libelleDe(ETAPES_ACQUEREUR, etape)
export const libelleEtatAcquereur = (etat: string) => libelleDe(ETATS_PROJET_ACQUEREUR, etat)
export const libelleMotifPerteAcquereur = (motif: string | null) =>
  libelleDe(MOTIFS_PERTE_ACQUEREUR, motif)
export const libelleOrigine = (origine: string | null) => libelleDe(ORIGINES_DEMANDE, origine)
export const libelleUrgence = (urgence: string | null) => libelleDe(URGENCES, urgence)
export const libelleFinancement = (financement: string | null) =>
  libelleDe(FINANCEMENTS, financement)
export const genreEtatAcquereur = (etat: string): GenreEtiquette =>
  ETATS_PROJET_ACQUEREUR.find((option) => option.valeur === etat)?.genre ?? 'neutre'

export function estEtapeAcquereur(valeur: string): valeur is EtapeAcquereur {
  return ETAPES_ACQUEREUR.some((option) => option.valeur === valeur)
}

/** Rang d'une étape : 0 pour « Demande »… 3 pour « Visites ». */
export function rangEtapeAcquereur(etape: string): number {
  return ETAPES_ACQUEREUR.findIndex((option) => option.valeur === etape)
}

/** L'étape qui suit, ou `null` après « Visites ». */
export function etapeSuivanteAcquereur(etape: string): EtapeAcquereur | null {
  return ETAPES_ACQUEREUR[rangEtapeAcquereur(etape) + 1]?.valeur ?? null
}

/** « jusqu'à 280 000 € », « de 200 000 € à 280 000 € », « dès 200 000 € », ou vide. */
export function libelleBudget(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `de ${formaterPrix(min)} à ${formaterPrix(max)}`
  if (max !== null) return `jusqu’à ${formaterPrix(max)}`
  if (min !== null) return `dès ${formaterPrix(min)}`
  return ''
}

/** Ce qu'il cherche, sur une ligne : « Ancien · Villefictive · jusqu'à 280 000 € · 3 p. ». */
export function resumeRecherche(
  projet: Pick<
    ProjetAcquereur,
    'types_biens' | 'secteurs' | 'budget_min' | 'budget_max' | 'surface_min' | 'pieces_min'
  >,
): string {
  const types = projet.types_biens.map(libelleType).join(', ')
  const morceaux = [
    types,
    projet.secteurs.join(', '),
    libelleBudget(projet.budget_min, projet.budget_max),
    projet.surface_min === null ? '' : `${formaterNombre(projet.surface_min)} m² min.`,
    projet.pieces_min === null ? '' : `${projet.pieces_min} p. min.`,
  ]
  return morceaux.filter((morceau) => morceau !== '').join(' · ')
}

/** Résumé de l'état, pour une ligne : « À recontacter le 17 mai 2027 », « Perdu : … ». */
export function resumeEtatAcquereur(
  projet: Pick<ProjetAcquereur, 'etat' | 'etape' | 'recontacter_le' | 'motif_perte' | 'offre_le'>,
): string {
  if (projet.etat === 'a_recontacter') {
    return `À recontacter le ${formaterDate(projet.recontacter_le)}`
  }
  if (projet.etat === 'perdu') return `Perdu : ${libelleMotifPerteAcquereur(projet.motif_perte)}`
  if (projet.etat === 'gagne') return `Offre acceptée le ${formaterDate(projet.offre_le)}`
  return libelleEtapeAcquereur(projet.etape)
}

/** Origine de la demande : « Portail Leboncoin », « Appel ». */
export function resumeOrigine(projet: Pick<ProjetAcquereur, 'origine' | 'portail'>): string {
  const origine = libelleOrigine(projet.origine)
  if (projet.portail === '') return origine
  return origine === '' ? projet.portail : `${origine} ${projet.portail}`
}

// ---------------------------------------------------------------------------
// Passage d'étape et critères de sortie
// ---------------------------------------------------------------------------

/** Les informations qu'un passage d'étape peut demander. */
export type InfoPassageAcquereur =
  'origine' | 'budget_max' | 'types_biens' | 'secteurs' | 'financement' | 'biens_proposes'

/**
 * Ce qu'il faut savoir pour avoir franchi chaque étape. Quitter « Demande » demande
 * l'origine de la demande et le budget : on ne qualifie pas une recherche sans budget.
 * Quitter « Qualification » demande les critères (types, secteurs) et le financement.
 * Quitter « Sélection » demande au moins un bien proposé. Les comptes rendus des visites
 * mènent à l'offre acceptée, qui demande au moins une visite consignée.
 */
const CRITERES: Record<EtapeAcquereur, readonly InfoPassageAcquereur[]> = {
  demande: ['origine', 'budget_max'],
  qualification: ['types_biens', 'secteurs', 'financement'],
  selection: ['biens_proposes'],
  visites: [],
}

/** Ce que demande l'arrivée à une étape : les critères de toutes les étapes d'avant. */
export function exigencesEtapeAcquereur(cible: EtapeAcquereur): InfoPassageAcquereur[] {
  return ETAPES_ACQUEREUR.slice(0, rangEtapeAcquereur(cible)).flatMap(
    ({ valeur }) => CRITERES[valeur],
  )
}

type Connu = Pick<
  ProjetAcquereur,
  'etape' | 'origine' | 'budget_max' | 'types_biens' | 'secteurs' | 'financement'
>

function estConnu(info: InfoPassageAcquereur, projet: Connu, nbProposes: number): boolean {
  if (info === 'biens_proposes') return nbProposes > 0
  if (info === 'types_biens' || info === 'secteurs') return projet[info].length > 0
  return projet[info] !== null
}

/**
 * Les informations qui manquent pour passer à l'étape `cible`. Revenir en arrière ne
 * demande rien. `nbProposes` : le nombre de biens proposés au projet.
 */
export function informationsManquantesAcquereur(
  projet: Connu,
  nbProposes: number,
  cible: EtapeAcquereur,
): InfoPassageAcquereur[] {
  if (rangEtapeAcquereur(cible) <= rangEtapeAcquereur(projet.etape)) return []
  return exigencesEtapeAcquereur(cible).filter((info) => !estConnu(info, projet, nbProposes))
}

/** La saisie de la fenêtre de passage d'étape. */
export type BrouillonPassageAcquereur = {
  origine: OrigineDemande | ''
  portail: string
  budgetMin: string
  budgetMax: string
  typesBiens: TypeBien[]
  secteurs: string[]
  financement: Financement | ''
  accordPrincipe: boolean
  apport: string
}

export type ErreursPassageAcquereur = Partial<
  Record<keyof BrouillonPassageAcquereur | 'biensProposes', string>
>

const parmi = <V extends string>(options: readonly Option<V>[], valeur: string | null): V | '' =>
  options.find((option) => option.valeur === valeur)?.valeur ?? ''

const texteMontant = (montant: number | null) => (montant === null ? '' : String(montant))

/** Les types de bien connus, dans l'ordre de la liste. */
export function typesConnus(types: readonly string[]): TypeBien[] {
  return TYPES_BIEN.map((type) => type.valeur).filter((type) => types.includes(type))
}

export function brouillonPassageAcquereur(projet: ProjetAcquereur): BrouillonPassageAcquereur {
  return {
    origine: parmi(ORIGINES_DEMANDE, projet.origine),
    portail: projet.portail,
    budgetMin: texteMontant(projet.budget_min),
    budgetMax: texteMontant(projet.budget_max),
    typesBiens: typesConnus(projet.types_biens),
    secteurs: [...projet.secteurs],
    financement: parmi(FINANCEMENTS, projet.financement),
    accordPrincipe: projet.accord_principe,
    apport: texteMontant(projet.apport),
  }
}

/** Ce qu'un passage d'étape enregistre sur le projet. */
export type PassageAcquereur = Pick<
  Modification<'projets_acquereurs'>,
  | 'origine'
  | 'portail'
  | 'budget_min'
  | 'budget_max'
  | 'types_biens'
  | 'secteurs'
  | 'financement'
  | 'accord_principe'
  | 'apport'
> & { etape: EtapeAcquereur }

/**
 * Ajoute un secteur à la liste (sans doublon, majuscules et accents comparés tels quels
 * après nettoyage des espaces). Renvoie la liste inchangée si la saisie est vide ou si la
 * liste est pleine.
 */
export function ajouterSecteur(secteurs: readonly string[], saisie: string): string[] {
  const secteur = saisie.trim().replace(/\s+/g, ' ').slice(0, LONGUEUR_MAX_SECTEUR)
  const deja = secteurs.some((existant) => existant.toLowerCase() === secteur.toLowerCase())
  if (secteur === '' || deja || secteurs.length >= MAX_SECTEURS) return [...secteurs]
  return [...secteurs, secteur]
}

/** Vérifie un budget saisi (bas et haut) ; renvoie les montants ou les erreurs. */
function lireBudget(
  saisie: { budgetMin: string; budgetMax: string },
  exigerMax: boolean,
): { min: number | null; max: number | null; erreurs: ErreursPassageAcquereur } {
  const erreurs: ErreursPassageAcquereur = {}
  const min = lireMontant(saisie.budgetMin)
  const max = lireMontant(saisie.budgetMax)
  if (min === 'invalide') erreurs.budgetMin = 'Montant en euros, en chiffres.'
  if (max === 'invalide') erreurs.budgetMax = 'Montant en euros, en chiffres.'
  else if (max === null && exigerMax) erreurs.budgetMax = 'Indiquez le budget maximum.'
  const bas = min === 'invalide' ? null : min
  const haut = max === 'invalide' ? null : max
  if (bas !== null && haut !== null && bas > haut) {
    erreurs.budgetMax = 'Le maximum est plus bas que le minimum.'
  }
  return { min: bas, max: haut, erreurs }
}

/**
 * Vérifie les informations demandées par le passage à `cible` et prépare l'enregistrement.
 * Seules les informations manquantes sont exigées ; ce qui est saisi en plus dans la même
 * rubrique (budget minimum, accord de principe, apport) est enregistré avec.
 */
export function preparerPassageAcquereur(
  projet: ProjetAcquereur,
  nbProposes: number,
  cible: EtapeAcquereur,
  saisie: BrouillonPassageAcquereur,
): { ok: true; passage: PassageAcquereur } | { ok: false; erreurs: ErreursPassageAcquereur } {
  const manquantes = new Set(informationsManquantesAcquereur(projet, nbProposes, cible))
  const erreurs: ErreursPassageAcquereur = {}
  const passage: PassageAcquereur = { etape: cible }

  if (manquantes.has('origine')) {
    if (saisie.origine === '') erreurs.origine = 'D’où vient la demande ?'
    else {
      passage.origine = saisie.origine
      passage.portail = saisie.portail.trim().slice(0, LONGUEURS_MAX_PROJET_ACQUEREUR.portail)
    }
  }
  if (manquantes.has('budget_max')) {
    const budget = lireBudget(saisie, true)
    Object.assign(erreurs, budget.erreurs)
    passage.budget_min = budget.min
    passage.budget_max = budget.max
  }
  if (manquantes.has('types_biens')) {
    if (saisie.typesBiens.length === 0) erreurs.typesBiens = 'Quel type de bien cherche-t-il ?'
    else passage.types_biens = [...saisie.typesBiens]
  }
  if (manquantes.has('secteurs')) {
    if (saisie.secteurs.length === 0)
      erreurs.secteurs = 'Indiquez au moins un secteur ou une commune.'
    else passage.secteurs = [...saisie.secteurs]
  }
  if (manquantes.has('financement')) {
    if (saisie.financement === '') erreurs.financement = 'Comptant ou avec un prêt ?'
    else {
      passage.financement = saisie.financement
      passage.accord_principe = saisie.financement === 'pret' && saisie.accordPrincipe
      const apport = lireMontant(saisie.apport)
      if (apport === 'invalide') erreurs.apport = 'Montant en euros, en chiffres.'
      else passage.apport = apport
    }
  }
  if (manquantes.has('biens_proposes')) {
    erreurs.biensProposes =
      'Proposez au moins un bien avant de passer aux visites (rubrique « Biens proposés »).'
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return { ok: true, passage }
}

// ---------------------------------------------------------------------------
// Sorties du pipeline et offre acceptée
// ---------------------------------------------------------------------------

export type BrouillonSortieAcquereur = {
  genre: 'a_recontacter' | 'perdu'
  recontacterLe: string
  /** Ce qu'il faudra dire ou vérifier à la relance (motif de la tâche). */
  pourquoi: string
  motifPerte: MotifPerteAcquereur | ''
  detail: string
}

export type ErreursSortieAcquereur = Partial<
  Record<'recontacterLe' | 'motifPerte' | 'detail', string>
>

export function brouillonSortieAcquereur(
  genre: BrouillonSortieAcquereur['genre'],
  aujourdhui: string,
): BrouillonSortieAcquereur {
  return {
    genre,
    recontacterLe: dateRecontacter(aujourdhui, 3),
    pourquoi: '',
    motifPerte: '',
    detail: '',
  }
}

/** Paramètres de la fonction `sortir_projet_acquereur` de la base. */
export type ParametresSortieAcquereur = {
  p_etat: 'a_recontacter' | 'perdu'
  p_recontacter_le?: string
  p_motif_perte?: MotifPerteAcquereur
  p_motif_perte_detail?: string
  p_relance_titre?: string
  p_relance_motif?: string
}

/**
 * Vérifie une sortie et prépare l'appel à la base. « À recontacter » crée toujours sa
 * relance, à la date choisie ; « Perdu » enregistre le motif.
 */
export function preparerSortieAcquereur(
  saisie: BrouillonSortieAcquereur,
  aujourdhui: string,
):
  | { ok: true; parametres: ParametresSortieAcquereur }
  | { ok: false; erreurs: ErreursSortieAcquereur } {
  const erreurs: ErreursSortieAcquereur = {}
  const detail = saisie.detail.trim()
  if (detail.length > LONGUEURS_MAX_PROJET_ACQUEREUR.motif_perte_detail) {
    erreurs.detail = `${LONGUEURS_MAX_PROJET_ACQUEREUR.motif_perte_detail} caractères au plus.`
  }

  if (saisie.genre === 'a_recontacter') {
    if (!estDateValide(saisie.recontacterLe)) erreurs.recontacterLe = 'Choisissez une date.'
    else if (saisie.recontacterLe < aujourdhui)
      erreurs.recontacterLe = 'Cette date est passée : choisissez une date à venir.'
    if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
    return {
      ok: true,
      parametres: {
        p_etat: 'a_recontacter',
        p_recontacter_le: saisie.recontacterLe,
        p_relance_titre: 'Recontacter l’acquéreur',
        p_relance_motif: saisie.pourquoi.trim(),
      },
    }
  }

  if (saisie.motifPerte === '') erreurs.motifPerte = 'Pourquoi le projet est-il perdu ?'
  if (Object.keys(erreurs).length > 0 || saisie.motifPerte === '') return { ok: false, erreurs }
  return {
    ok: true,
    parametres: { p_etat: 'perdu', p_motif_perte: saisie.motifPerte, p_motif_perte_detail: detail },
  }
}

export type BrouillonOffre = { bienId: string; offreLe: string }
export type ErreursOffre = Partial<Record<keyof BrouillonOffre | 'visites', string>>

/**
 * L'offre acceptée gagne le projet. Elle demande le bien (parmi ceux proposés) et la date,
 * passée, et au moins une visite consignée (critère de sortie des visites).
 */
export function preparerOffre(
  saisie: BrouillonOffre,
  contexte: { aujourdhui: string; nbVisites: number },
):
  | { ok: true; valeurs: { etat: 'gagne'; offre_bien_id: string; offre_le: string } }
  | { ok: false; erreurs: ErreursOffre } {
  const erreurs: ErreursOffre = {}
  if (contexte.nbVisites === 0) {
    erreurs.visites = 'Consignez d’abord au moins une visite, avec son compte rendu.'
  }
  if (saisie.bienId === '') erreurs.bienId = 'Sur quel bien l’offre a-t-elle été acceptée ?'
  if (!estDateValide(saisie.offreLe)) erreurs.offreLe = 'Choisissez une date.'
  else if (saisie.offreLe > contexte.aujourdhui)
    erreurs.offreLe = 'L’offre doit avoir été acceptée : la date est passée.'
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return {
    ok: true,
    valeurs: { etat: 'gagne', offre_bien_id: saisie.bienId, offre_le: saisie.offreLe },
  }
}

// ---------------------------------------------------------------------------
// Formulaire « Modifier la recherche »
// ---------------------------------------------------------------------------

export type BrouillonRecherche = BrouillonPassageAcquereur & {
  surfaceMin: string
  piecesMin: string
  criteresIndispensables: string
  criteresSouhaites: string
  urgence: Urgence | ''
  bienAVendre: boolean
  notes: string
}

export type ErreursRecherche = Partial<Record<keyof BrouillonRecherche, string>>

export function brouillonRechercheDepuis(projet: ProjetAcquereur): BrouillonRecherche {
  return {
    ...brouillonPassageAcquereur(projet),
    surfaceMin: projet.surface_min === null ? '' : String(projet.surface_min),
    piecesMin: projet.pieces_min === null ? '' : String(projet.pieces_min),
    criteresIndispensables: projet.criteres_indispensables,
    criteresSouhaites: projet.criteres_souhaites,
    urgence: parmi(URGENCES, projet.urgence),
    bienAVendre: projet.bien_a_vendre,
    notes: projet.notes,
  }
}

export type ValeursRecherche = Pick<
  Modification<'projets_acquereurs'>,
  | 'origine'
  | 'portail'
  | 'budget_min'
  | 'budget_max'
  | 'types_biens'
  | 'secteurs'
  | 'financement'
  | 'accord_principe'
  | 'apport'
  | 'surface_min'
  | 'pieces_min'
  | 'criteres_indispensables'
  | 'criteres_souhaites'
  | 'urgence'
  | 'bien_a_vendre'
  | 'notes'
>

/**
 * Vérifie le formulaire de la recherche. Ce qu'exige l'étape où se trouve le projet
 * (critères des étapes franchies) ne peut pas être effacé : la base le refuse aussi.
 */
export function preparerRecherche(
  brouillon: BrouillonRecherche,
  projet: Pick<ProjetAcquereur, 'etape'>,
): { ok: true; valeurs: ValeursRecherche } | { ok: false; erreurs: ErreursRecherche } {
  const rang = rangEtapeAcquereur(projet.etape)
  const exigeDemande = rang >= rangEtapeAcquereur('qualification')
  const exigeQualification = rang >= rangEtapeAcquereur('selection')
  const requis = 'Nécessaire à l’étape où se trouve le projet.'
  const erreurs: ErreursRecherche = {}

  if (exigeDemande && brouillon.origine === '') erreurs.origine = requis
  const budget = lireBudget(brouillon, false)
  Object.assign(erreurs, budget.erreurs)
  if (exigeDemande && budget.max === null && erreurs.budgetMax === undefined) {
    erreurs.budgetMax = requis
  }
  if (exigeQualification && brouillon.typesBiens.length === 0) erreurs.typesBiens = requis
  if (exigeQualification && brouillon.secteurs.length === 0) erreurs.secteurs = requis
  if (exigeQualification && brouillon.financement === '') erreurs.financement = requis

  const apport = lireMontant(brouillon.apport)
  if (apport === 'invalide') erreurs.apport = 'Montant en euros, en chiffres.'
  const surface = lireNombre(brouillon.surfaceMin)
  if (surface === 'invalide' || (surface !== null && (surface < 1 || surface > 1_000_000))) {
    erreurs.surfaceMin = 'Surface en m², en chiffres.'
  }
  const pieces = lireNombre(brouillon.piecesMin)
  if (pieces === 'invalide' || (pieces !== null && (pieces < 1 || pieces > 50))) {
    erreurs.piecesMin = 'Nombre de pièces, de 1 à 50.'
  }
  const textes = [
    ['criteresIndispensables', LONGUEURS_MAX_PROJET_ACQUEREUR.criteres_indispensables],
    ['criteresSouhaites', LONGUEURS_MAX_PROJET_ACQUEREUR.criteres_souhaites],
    ['notes', LONGUEURS_MAX_PROJET_ACQUEREUR.notes],
    ['portail', LONGUEURS_MAX_PROJET_ACQUEREUR.portail],
  ] as const
  for (const [champ, max] of textes) {
    if (brouillon[champ].trim().length > max) erreurs[champ] = `${max} caractères au plus.`
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return {
    ok: true,
    valeurs: {
      origine: brouillon.origine === '' ? null : brouillon.origine,
      portail: brouillon.portail.trim(),
      budget_min: budget.min,
      budget_max: budget.max,
      types_biens: [...brouillon.typesBiens],
      secteurs: [...brouillon.secteurs],
      financement: brouillon.financement === '' ? null : brouillon.financement,
      // L'accord de principe n'a de sens que pour un prêt.
      accord_principe: brouillon.financement === 'pret' && brouillon.accordPrincipe,
      apport: apport === 'invalide' ? null : apport,
      surface_min: surface === 'invalide' ? null : surface,
      pieces_min: pieces === 'invalide' ? null : pieces,
      criteres_indispensables: brouillon.criteresIndispensables.trim(),
      criteres_souhaites: brouillon.criteresSouhaites.trim(),
      urgence: brouillon.urgence === '' ? null : brouillon.urgence,
      bien_a_vendre: brouillon.bienAVendre,
      notes: brouillon.notes.trim(),
    },
  }
}

// ---------------------------------------------------------------------------
// Tableau du pipeline
// ---------------------------------------------------------------------------

/**
 * Range les projets par étape, dans l'ordre du pipeline ; dans une étape, ceux qui y sont
 * depuis le plus longtemps d'abord.
 */
export function grouperParEtapeAcquereur<
  P extends { projet: Pick<ProjetAcquereur, 'etape' | 'etape_le' | 'created_at'> },
>(projets: readonly P[]): { etape: EtapeAcquereur; projets: P[] }[] {
  return ETAPES_ACQUEREUR.map(({ valeur }) => ({
    etape: valeur,
    projets: projets
      .filter(({ projet }) => projet.etape === valeur)
      .sort(
        (a, b) =>
          a.projet.etape_le.localeCompare(b.projet.etape_le) ||
          a.projet.created_at.localeCompare(b.projet.created_at),
      ),
  }))
}
