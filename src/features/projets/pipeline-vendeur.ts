import type { GenreEtiquette } from '../../components/Etiquette'
import { ajouterJours, ajouterMois, ecartJours, estDateValide, formaterDate } from '../../lib/dates'
import type { Ligne } from '../../lib/donnees'
import { lireNombre } from '../../lib/nombres'

/**
 * Pipeline vendeur : les étapes d'un projet vendeur, leurs critères de sortie, et les
 * sorties possibles à toute étape (à recontacter, perdu). Règles pures, testées ; la base
 * vérifie les mêmes critères (migration 0012). Voir docs/donnees.md, « Projets vendeurs ».
 */

export type ProjetVendeur = Ligne<'projets_vendeurs'>

export type EtapeVendeur =
  'premier_contact' | 'decouverte' | 'estimation' | 'suivi' | 'mandat_signe'
export type EtatProjet = 'actif' | 'a_recontacter' | 'perdu' | 'gagne'
export type MotifPerte =
  'mandat_ailleurs' | 'vente_particuliers' | 'abandon' | 'achat_confrere' | 'autre'
export type TypeMandat = 'simple' | 'exclusif'

type Option<V extends string> = { valeur: V; libelle: string }

/** Les étapes, dans l'ordre, avec le critère qui permet d'en sortir. */
export const ETAPES_VENDEUR: readonly (Option<EtapeVendeur> & { critere: string })[] = [
  { valeur: 'premier_contact', libelle: 'Premier contact', critere: 'Source identifiée' },
  { valeur: 'decouverte', libelle: 'Découverte', critere: 'Projet, délai, motif' },
  { valeur: 'estimation', libelle: 'Estimation', critere: 'Avis de valeur remis' },
  { valeur: 'suivi', libelle: 'Suivi', critere: 'Relances, objections' },
  { valeur: 'mandat_signe', libelle: 'Mandat signé', critere: 'Simple ou exclusif' },
]

export const ETATS_PROJET: readonly (Option<EtatProjet> & { genre: GenreEtiquette })[] = [
  { valeur: 'actif', libelle: 'En cours', genre: 'info' },
  { valeur: 'a_recontacter', libelle: 'À recontacter', genre: 'alerte' },
  { valeur: 'perdu', libelle: 'Perdu', genre: 'neutre' },
  { valeur: 'gagne', libelle: 'Mandat signé', genre: 'succes' },
]

export const MOTIFS_PERTE: readonly Option<MotifPerte>[] = [
  { valeur: 'mandat_ailleurs', libelle: 'Mandat signé ailleurs' },
  { valeur: 'vente_particuliers', libelle: 'Vente entre particuliers' },
  { valeur: 'abandon', libelle: 'Projet abandonné' },
  { valeur: 'achat_confrere', libelle: 'Achat par un confrère' },
  { valeur: 'autre', libelle: 'Autre' },
]

export const TYPES_MANDAT: readonly Option<TypeMandat>[] = [
  { valeur: 'simple', libelle: 'Simple' },
  { valeur: 'exclusif', libelle: 'Exclusif' },
]

/** Motifs de vente fréquents, proposés d'un toucher (le champ reste libre). */
export const MOTIFS_VENTE_COURANTS = [
  'Mutation',
  'Agrandissement',
  'Achat d’un autre bien',
  'Séparation',
  'Succession',
  'Retraite',
  'Investissement',
] as const

/** Raccourcis de « À recontacter », en mois. */
export const RACCOURCIS_RECONTACTER = [
  { libelle: 'Dans 1 mois', mois: 1 },
  { libelle: 'Dans 3 mois', mois: 3 },
  { libelle: 'Dans 6 mois', mois: 6 },
  { libelle: 'Dans 1 an', mois: 12 },
] as const

/** La relance avant la fin d'un mandat concurrent tombe ce nombre de jours avant. */
export const JOURS_AVANT_FIN_MANDAT = 15

/** Un mandat signé reste visible dans la colonne « Mandat signé » pendant ces jours. */
export const JOURS_GAGNES_VISIBLES = 30

/** Au-delà, un projet stagne dans son étape : son ancienneté est signalée. */
export const JOURS_ETAPE_QUI_TRAINE = 30

export const LONGUEURS_MAX_PROJET = {
  motif_vente: 500,
  agences_consultees: 500,
  motif_perte_detail: 500,
  notes: 5000,
} as const

function libelleDe<V extends string>(options: readonly Option<V>[], valeur: string | null) {
  return options.find((option) => option.valeur === valeur)?.libelle ?? valeur ?? ''
}

export const libelleEtape = (etape: string) => libelleDe(ETAPES_VENDEUR, etape)
export const libelleEtatProjet = (etat: string) => libelleDe(ETATS_PROJET, etat)
export const libelleMotifPerte = (motif: string | null) => libelleDe(MOTIFS_PERTE, motif)
export const libelleTypeMandat = (type: string | null) => libelleDe(TYPES_MANDAT, type)
export const genreEtatProjet = (etat: string): GenreEtiquette =>
  ETATS_PROJET.find((option) => option.valeur === etat)?.genre ?? 'neutre'

export function estEtapeVendeur(valeur: string): valeur is EtapeVendeur {
  return ETAPES_VENDEUR.some((option) => option.valeur === valeur)
}

/** Rang d'une étape : 0 pour « Premier contact »… 4 pour « Mandat signé ». */
export function rangEtape(etape: string): number {
  return ETAPES_VENDEUR.findIndex((option) => option.valeur === etape)
}

/** L'étape qui suit, ou `null` après « Mandat signé ». */
export function etapeSuivante(etape: string): EtapeVendeur | null {
  return ETAPES_VENDEUR[rangEtape(etape) + 1]?.valeur ?? null
}

/** Résumé de l'état, pour une ligne : « À recontacter le 17 mai 2027 », « Perdu : … ». */
export function resumeEtat(projet: ProjetVendeur): string {
  if (projet.etat === 'a_recontacter') {
    return `À recontacter le ${formaterDate(projet.recontacter_le)}`
  }
  if (projet.etat === 'perdu') return `Perdu : ${libelleMotifPerte(projet.motif_perte)}`
  if (projet.etat === 'gagne') {
    const type =
      projet.mandat_type === null ? '' : ` ${libelleTypeMandat(projet.mandat_type).toLowerCase()}`
    return `Mandat${type} signé le ${formaterDate(projet.mandat_le)}`
  }
  return libelleEtape(projet.etape)
}

/** Ancienneté dans l'étape : « Depuis aujourd'hui », « Depuis 12 jours », « Depuis 3 mois ». */
export function ancienneteEtape(etapeLe: string, aujourdhui: string): string {
  const jours = Math.max(0, ecartJours(etapeLe, aujourdhui))
  if (jours === 0) return 'Depuis aujourd’hui'
  if (jours === 1) return 'Depuis hier'
  if (jours < 60) return `Depuis ${jours} jours`
  if (jours < 365) return `Depuis ${Math.floor(jours / 30)} mois`
  const ans = Math.floor(jours / 365)
  return `Depuis ${ans} an${ans > 1 ? 's' : ''}`
}

/** Le projet stagne : plus de `JOURS_ETAPE_QUI_TRAINE` jours dans la même étape. */
export function etapeQuiTraine(etapeLe: string, aujourdhui: string): boolean {
  return ecartJours(etapeLe, aujourdhui) > JOURS_ETAPE_QUI_TRAINE
}

// ---------------------------------------------------------------------------
// Passage d'étape et critères de sortie
// ---------------------------------------------------------------------------

/** Les informations qu'un passage d'étape peut demander. */
export type InfoPassage =
  | 'source'
  | 'motif_vente'
  | 'echeance_souhaitee'
  | 'estimation_basse'
  | 'estimation_haute'
  | 'avis_remis_le'
  | 'mandat_type'
  | 'mandat_le'

/**
 * Ce qu'il faut savoir pour avoir franchi chaque étape (son critère de sortie). Les
 * relances et objections du suivi ne sont pas une information à saisir : on en sort en
 * signant le mandat, qui demande son type et sa date.
 */
const CRITERES: Record<EtapeVendeur, readonly InfoPassage[]> = {
  premier_contact: ['source'],
  decouverte: ['motif_vente', 'echeance_souhaitee'],
  estimation: ['estimation_basse', 'estimation_haute', 'avis_remis_le'],
  suivi: [],
  mandat_signe: [],
}

/** Ce que demande l'arrivée à une étape : les critères de toutes les étapes d'avant. */
export function exigencesEtape(cible: EtapeVendeur): InfoPassage[] {
  const avant = ETAPES_VENDEUR.slice(0, rangEtape(cible)).flatMap(({ valeur }) => CRITERES[valeur])
  return cible === 'mandat_signe' ? [...avant, 'mandat_type', 'mandat_le'] : avant
}

type Connu = Pick<
  ProjetVendeur,
  | 'motif_vente'
  | 'echeance_souhaitee'
  | 'estimation_basse'
  | 'estimation_haute'
  | 'avis_remis_le'
  | 'mandat_type'
  | 'mandat_le'
>

function estConnu(info: InfoPassage, projet: Connu, source: string | null): boolean {
  if (info === 'source') return source !== null && source !== ''
  if (info === 'motif_vente') return projet.motif_vente.trim() !== ''
  return projet[info] !== null
}

/**
 * Les informations qui manquent pour passer à l'étape `cible`. Revenir en arrière ne
 * demande rien. `source` : la source du contact principal (critère du premier contact).
 */
export function informationsManquantes(
  projet: Connu & Pick<ProjetVendeur, 'etape'>,
  source: string | null,
  cible: EtapeVendeur,
): InfoPassage[] {
  if (rangEtape(cible) <= rangEtape(projet.etape)) return []
  return exigencesEtape(cible).filter((info) => !estConnu(info, projet, source))
}

/** La saisie de la fenêtre de passage d'étape (tout en texte). */
export type BrouillonPassage = {
  source: string
  sourceDetail: string
  motifVente: string
  echeanceSouhaitee: string
  estimationBasse: string
  estimationHaute: string
  avisRemisLe: string
  mandatType: TypeMandat | ''
  mandatLe: string
}

export type ErreursPassage = Partial<Record<keyof BrouillonPassage, string>>

export function brouillonPassage(projet: ProjetVendeur, aujourdhui: string): BrouillonPassage {
  return {
    source: '',
    sourceDetail: '',
    motifVente: projet.motif_vente,
    echeanceSouhaitee: projet.echeance_souhaitee ?? '',
    estimationBasse: projet.estimation_basse === null ? '' : String(projet.estimation_basse),
    estimationHaute: projet.estimation_haute === null ? '' : String(projet.estimation_haute),
    // Le plus souvent, l'avis de valeur ou le mandat se notent le jour même.
    avisRemisLe: projet.avis_remis_le ?? aujourdhui,
    mandatType:
      projet.mandat_type === 'simple' || projet.mandat_type === 'exclusif'
        ? projet.mandat_type
        : '',
    mandatLe: projet.mandat_le ?? aujourdhui,
  }
}

/** Ce qu'un passage d'étape enregistre : le projet, et la source du contact s'il le faut. */
export type Passage = {
  projet: {
    etape: EtapeVendeur
    etat: 'actif' | 'gagne'
    motif_vente?: string
    echeance_souhaitee?: string
    estimation_basse?: number
    estimation_haute?: number
    avis_remis_le?: string
    mandat_type?: TypeMandat
    mandat_le?: string
  }
  source: { source: string; source_detail: string } | null
}

const MONTANT_MAX = 2_000_000_000

/** Lit un montant en euros ; `'invalide'` s'il est illisible ou hors bornes. */
export function lireMontant(saisie: string): number | null | 'invalide' {
  const valeur = lireNombre(saisie)
  if (valeur === null) return null
  return valeur === 'invalide' || valeur > MONTANT_MAX ? 'invalide' : valeur
}

/**
 * Vérifie les informations demandées par le passage à `cible` et prépare l'enregistrement.
 * Seules les informations manquantes sont lues dans la saisie ; les autres sont déjà dans
 * le projet. Arriver à « Mandat signé » gagne le projet ; toute autre étape le garde actif.
 */
export function preparerPassage(
  projet: ProjetVendeur,
  source: string | null,
  cible: EtapeVendeur,
  saisie: BrouillonPassage,
  aujourdhui: string,
): { ok: true; passage: Passage } | { ok: false; erreurs: ErreursPassage } {
  const manquantes = new Set(informationsManquantes(projet, source, cible))
  const erreurs: ErreursPassage = {}
  const passage: Passage = {
    projet: { etape: cible, etat: cible === 'mandat_signe' ? 'gagne' : 'actif' },
    source: null,
  }

  if (manquantes.has('source')) {
    if (saisie.source === '') erreurs.source = 'Choisissez d’où vient ce contact.'
    else passage.source = { source: saisie.source, source_detail: saisie.sourceDetail.trim() }
  }
  if (manquantes.has('motif_vente')) {
    const motif = saisie.motifVente.trim()
    if (motif === '') erreurs.motifVente = 'Indiquez le motif de la vente.'
    else if (motif.length > LONGUEURS_MAX_PROJET.motif_vente)
      erreurs.motifVente = `${LONGUEURS_MAX_PROJET.motif_vente} caractères au plus.`
    else passage.projet.motif_vente = motif
  }
  if (manquantes.has('echeance_souhaitee')) {
    if (!estDateValide(saisie.echeanceSouhaitee))
      erreurs.echeanceSouhaitee = 'Choisissez la date avant laquelle il souhaite avoir vendu.'
    else passage.projet.echeance_souhaitee = saisie.echeanceSouhaitee
  }

  const basse = manquantes.has('estimation_basse') ? lireMontant(saisie.estimationBasse) : null
  const haute = manquantes.has('estimation_haute') ? lireMontant(saisie.estimationHaute) : null
  if (manquantes.has('estimation_basse')) {
    if (basse === null) erreurs.estimationBasse = 'Indiquez le bas de la fourchette.'
    else if (basse === 'invalide') erreurs.estimationBasse = 'Montant en euros, en chiffres.'
    else passage.projet.estimation_basse = basse
  }
  if (manquantes.has('estimation_haute')) {
    if (haute === null) erreurs.estimationHaute = 'Indiquez le haut de la fourchette.'
    else if (haute === 'invalide') erreurs.estimationHaute = 'Montant en euros, en chiffres.'
    else passage.projet.estimation_haute = haute
  }
  const bas = passage.projet.estimation_basse ?? projet.estimation_basse
  const haut = passage.projet.estimation_haute ?? projet.estimation_haute
  if (bas !== null && haut !== null && bas > haut && erreurs.estimationHaute === undefined) {
    erreurs.estimationHaute = 'Le haut de la fourchette est plus bas que le bas.'
  }
  if (manquantes.has('avis_remis_le')) {
    if (!estDateValide(saisie.avisRemisLe)) erreurs.avisRemisLe = 'Choisissez une date.'
    else if (saisie.avisRemisLe > aujourdhui)
      erreurs.avisRemisLe = 'L’avis de valeur doit avoir été remis : la date est passée.'
    else passage.projet.avis_remis_le = saisie.avisRemisLe
  }
  if (manquantes.has('mandat_type')) {
    if (saisie.mandatType === '') erreurs.mandatType = 'Simple ou exclusif ?'
    else passage.projet.mandat_type = saisie.mandatType
  }
  if (manquantes.has('mandat_le')) {
    if (!estDateValide(saisie.mandatLe)) erreurs.mandatLe = 'Choisissez une date.'
    else if (saisie.mandatLe > aujourdhui)
      erreurs.mandatLe = 'Le mandat doit être signé : la date est passée.'
    else passage.projet.mandat_le = saisie.mandatLe
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return { ok: true, passage }
}

// ---------------------------------------------------------------------------
// Sorties du pipeline : à recontacter, perdu
// ---------------------------------------------------------------------------

/** Date de la relance avant la fin d'un mandat concurrent ; jamais avant aujourd'hui. */
export function dateRelanceFinMandat(fin: string, aujourdhui: string): string {
  const relance = ajouterJours(fin, -JOURS_AVANT_FIN_MANDAT)
  return relance < aujourdhui ? aujourdhui : relance
}

/** Date d'un raccourci de « À recontacter ». */
export function dateRecontacter(aujourdhui: string, mois: number): string {
  return ajouterMois(aujourdhui, mois)
}

export type BrouillonSortie = {
  genre: 'a_recontacter' | 'perdu'
  recontacterLe: string
  /** Ce qu'il faudra dire ou vérifier à la relance (motif de la tâche). */
  pourquoi: string
  motifPerte: MotifPerte | ''
  detail: string
  /** Fin du mandat signé ailleurs (motif « mandat signé ailleurs »). */
  finMandatAilleurs: string
  /** Planifier une relance avant la fin du mandat concurrent. */
  relancer: boolean
}

export type ErreursSortie = Partial<
  Record<'recontacterLe' | 'motifPerte' | 'detail' | 'finMandatAilleurs', string>
>

export function brouillonSortie(
  genre: BrouillonSortie['genre'],
  projet: ProjetVendeur,
  aujourdhui: string,
): BrouillonSortie {
  return {
    genre,
    recontacterLe: dateRecontacter(aujourdhui, 6),
    pourquoi: '',
    motifPerte: '',
    detail: '',
    finMandatAilleurs: projet.mandat_ailleurs_fin ?? '',
    relancer: true,
  }
}

/** Paramètres de la fonction `sortir_projet_vendeur` de la base. */
export type ParametresSortie = {
  p_etat: 'a_recontacter' | 'perdu'
  p_recontacter_le?: string
  p_motif_perte?: MotifPerte
  p_motif_perte_detail?: string
  p_mandat_ailleurs_fin?: string
  p_relance_le?: string
  p_relance_titre?: string
  p_relance_motif?: string
}

/**
 * Vérifie une sortie et prépare l'appel à la base. « À recontacter » crée toujours sa
 * relance, à la date choisie. « Perdu » enregistre le motif ; si un mandat concurrent a
 * une date de fin, une relance est prévue `JOURS_AVANT_FIN_MANDAT` jours avant (sauf refus).
 */
export function preparerSortie(
  saisie: BrouillonSortie,
  aujourdhui: string,
): { ok: true; parametres: ParametresSortie } | { ok: false; erreurs: ErreursSortie } {
  const erreurs: ErreursSortie = {}
  const detail = saisie.detail.trim()
  if (detail.length > LONGUEURS_MAX_PROJET.motif_perte_detail) {
    erreurs.detail = `${LONGUEURS_MAX_PROJET.motif_perte_detail} caractères au plus.`
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
        p_relance_titre: 'Recontacter le vendeur',
        p_relance_motif: saisie.pourquoi.trim(),
      },
    }
  }

  if (saisie.motifPerte === '') erreurs.motifPerte = 'Pourquoi le projet est-il perdu ?'
  const avecFin = saisie.motifPerte === 'mandat_ailleurs' && saisie.finMandatAilleurs !== ''
  if (avecFin && !estDateValide(saisie.finMandatAilleurs)) {
    erreurs.finMandatAilleurs = 'Cette date n’est pas reconnue.'
  }
  if (Object.keys(erreurs).length > 0 || saisie.motifPerte === '') return { ok: false, erreurs }

  const parametres: ParametresSortie = {
    p_etat: 'perdu',
    p_motif_perte: saisie.motifPerte,
    p_motif_perte_detail: detail,
  }
  if (avecFin) {
    parametres.p_mandat_ailleurs_fin = saisie.finMandatAilleurs
    if (saisie.relancer) {
      parametres.p_relance_le = dateRelanceFinMandat(saisie.finMandatAilleurs, aujourdhui)
      parametres.p_relance_titre = 'Relancer : le mandat concurrent se termine'
      parametres.p_relance_motif = `Mandat signé ailleurs jusqu’au ${formaterDate(saisie.finMandatAilleurs)}. Proposer de reprendre la vente.`
    }
  }
  return { ok: true, parametres }
}

// ---------------------------------------------------------------------------
// Tableau du pipeline
// ---------------------------------------------------------------------------

/**
 * Range les projets par étape, dans l'ordre du pipeline ; dans une étape, ceux qui y sont
 * depuis le plus longtemps d'abord.
 */
export function grouperParEtape<
  P extends { projet: Pick<ProjetVendeur, 'etape' | 'etape_le' | 'created_at'> },
>(projets: readonly P[]): { etape: EtapeVendeur; projets: P[] }[] {
  return ETAPES_VENDEUR.map(({ valeur }) => ({
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

/** Premier jour depuis lequel un mandat signé reste dans la colonne « Mandat signé ». */
export function debutGagnesVisibles(aujourdhui: string): string {
  return ajouterJours(aujourdhui, -JOURS_GAGNES_VISIBLES)
}
