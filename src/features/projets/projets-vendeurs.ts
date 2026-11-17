import type { SupabaseClient } from '@supabase/supabase-js'
import {
  appeler,
  archiver,
  creer,
  lire,
  listerPage,
  modifier,
  type Filtre,
  type Modification,
  type PageLignes,
  type Resultat,
} from '../../lib/donnees'
import { estDateValide, formaterJourCourt } from '../../lib/dates'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import { lireFichesLiees } from '../liens/fiches-liees'
import type { Tache } from '../taches/taches'
import {
  debutGagnesVisibles,
  lireMontant,
  LONGUEURS_MAX_PROJET,
  rangEtape,
  type EtatProjet,
  type ParametresSortie,
  type Passage,
  type ProjetVendeur,
  type TypeMandat,
} from './pipeline-vendeur'

/**
 * Projets vendeurs : saisie, lecture et écriture. Les règles du pipeline (étapes, critères,
 * sorties) sont dans `pipeline-vendeur.ts`.
 */

/** Un projet avec son contact, son bien et sa prochaine tâche, pour l'affichage. */
export type ProjetVendeurAffiche = {
  id: string
  projet: ProjetVendeur
  contact: Contact | null
  bien: Bien | null
  /** La plus proche des tâches à faire liées au projet, s'il y en a. */
  prochaine: Tache | null
}

/** La prochaine action d'un projet, sur une ligne, et si elle est en retard. */
export function prochaineActionProjet(
  affiche: ProjetVendeurAffiche,
  aujourdhui: string,
): { texte: string; alerte: boolean } {
  const { prochaine, contact, projet } = affiche
  if (prochaine !== null) {
    return {
      texte: `${formaterJourCourt(prochaine.echeance, aujourdhui)} · ${prochaine.titre}`,
      alerte: prochaine.echeance < aujourdhui,
    }
  }
  if (projet.etat === 'gagne') return { texte: '', alerte: false }
  // Pas de tâche liée au projet : la prochaine action du contact, s'il en a une.
  if (contact?.prochaine_action_le !== null && contact?.prochaine_action_le !== undefined) {
    return {
      texte: `Contact : ${formaterJourCourt(contact.prochaine_action_le, aujourdhui)}`,
      alerte: contact.prochaine_action_le < aujourdhui,
    }
  }
  return { texte: 'Aucune action prévue', alerte: true }
}

// ---------------------------------------------------------------------------
// Formulaire « Modifier le projet »
// ---------------------------------------------------------------------------

export type BrouillonProjet = {
  motifVente: string
  echeanceSouhaitee: string
  prixEspere: string
  estimationBasse: string
  estimationHaute: string
  estimationLe: string
  avisRemisLe: string
  agencesConsultees: string
  mandatAilleurs: boolean
  mandatAilleursFin: string
  mandatType: TypeMandat | ''
  mandatLe: string
  notes: string
}

export type ErreursProjet = Partial<Record<keyof BrouillonProjet, string>>

const texteMontant = (montant: number | null) => (montant === null ? '' : String(montant))

export function brouillonProjetDepuis(projet: ProjetVendeur): BrouillonProjet {
  return {
    motifVente: projet.motif_vente,
    echeanceSouhaitee: projet.echeance_souhaitee ?? '',
    prixEspere: texteMontant(projet.prix_espere),
    estimationBasse: texteMontant(projet.estimation_basse),
    estimationHaute: texteMontant(projet.estimation_haute),
    estimationLe: projet.estimation_le ?? '',
    avisRemisLe: projet.avis_remis_le ?? '',
    agencesConsultees: projet.agences_consultees,
    mandatAilleurs: projet.mandat_ailleurs,
    mandatAilleursFin: projet.mandat_ailleurs_fin ?? '',
    mandatType:
      projet.mandat_type === 'simple' || projet.mandat_type === 'exclusif'
        ? projet.mandat_type
        : '',
    mandatLe: projet.mandat_le ?? '',
    notes: projet.notes,
  }
}

export type ValeursProjet = Pick<
  Modification<'projets_vendeurs'>,
  | 'motif_vente'
  | 'echeance_souhaitee'
  | 'prix_espere'
  | 'estimation_basse'
  | 'estimation_haute'
  | 'estimation_le'
  | 'avis_remis_le'
  | 'agences_consultees'
  | 'mandat_ailleurs'
  | 'mandat_ailleurs_fin'
  | 'mandat_type'
  | 'mandat_le'
  | 'notes'
>

/**
 * Vérifie le formulaire du projet. Les informations exigées par l'étape où se trouve le
 * projet (critères des étapes franchies) ne peuvent pas être effacées : la base le refuse
 * aussi. Les dates de l'estimation, de l'avis et du mandat sont passées.
 */
export function preparerProjet(
  brouillon: BrouillonProjet,
  projet: Pick<ProjetVendeur, 'etape'>,
  aujourdhui: string,
): { ok: true; valeurs: ValeursProjet } | { ok: false; erreurs: ErreursProjet } {
  const erreurs: ErreursProjet = {}
  const rang = rangEtape(projet.etape)
  const exigeDecouverte = rang >= rangEtape('estimation')
  const exigeEstimation = rang >= rangEtape('suivi')
  const exigeMandat = projet.etape === 'mandat_signe'
  const requis = 'Nécessaire à l’étape où se trouve le projet.'

  const motif = brouillon.motifVente.trim()
  if (motif.length > LONGUEURS_MAX_PROJET.motif_vente)
    erreurs.motifVente = `${LONGUEURS_MAX_PROJET.motif_vente} caractères au plus.`
  else if (exigeDecouverte && motif === '') erreurs.motifVente = requis

  type ChampDate =
    'echeanceSouhaitee' | 'estimationLe' | 'avisRemisLe' | 'mandatLe' | 'mandatAilleursFin'
  function date(champ: ChampDate, exigee: boolean, passee: boolean) {
    const saisie = brouillon[champ]
    if (saisie === '') {
      if (exigee) erreurs[champ] = requis
      return null
    }
    if (!estDateValide(saisie)) erreurs[champ] = 'Cette date n’est pas reconnue.'
    else if (passee && saisie > aujourdhui) erreurs[champ] = 'Cette date est dans le futur.'
    return saisie
  }
  function montant(champ: 'prixEspere' | 'estimationBasse' | 'estimationHaute', exige: boolean) {
    const valeur = lireMontant(brouillon[champ])
    if (valeur === 'invalide') {
      erreurs[champ] = 'Montant en euros, en chiffres, sans centimes.'
      return null
    }
    if (valeur === null && exige) erreurs[champ] = requis
    return valeur
  }

  const basse = montant('estimationBasse', exigeEstimation)
  const haute = montant('estimationHaute', exigeEstimation)
  if (basse !== null && haute !== null && basse > haute) {
    erreurs.estimationHaute = 'Le haut de la fourchette est plus bas que le bas.'
  }
  if (exigeMandat && brouillon.mandatType === '') erreurs.mandatType = requis
  const agences = brouillon.agencesConsultees.trim()
  if (agences.length > LONGUEURS_MAX_PROJET.agences_consultees)
    erreurs.agencesConsultees = `${LONGUEURS_MAX_PROJET.agences_consultees} caractères au plus.`
  const notes = brouillon.notes.trim()
  if (notes.length > LONGUEURS_MAX_PROJET.notes)
    erreurs.notes = `${LONGUEURS_MAX_PROJET.notes} caractères au plus.`

  const valeurs: ValeursProjet = {
    motif_vente: motif,
    echeance_souhaitee: date('echeanceSouhaitee', exigeDecouverte, false),
    prix_espere: montant('prixEspere', false),
    estimation_basse: basse,
    estimation_haute: haute,
    estimation_le: date('estimationLe', false, true),
    avis_remis_le: date('avisRemisLe', exigeEstimation, true),
    agences_consultees: agences,
    // Une date de fin suppose un mandat concurrent.
    mandat_ailleurs: brouillon.mandatAilleurs,
    mandat_ailleurs_fin: brouillon.mandatAilleurs ? date('mandatAilleursFin', false, false) : null,
    mandat_type: brouillon.mandatType === '' ? null : brouillon.mandatType,
    mandat_le: date('mandatLe', exigeMandat, true),
    notes,
  }
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return { ok: true, valeurs }
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

/** Au plus autant de projets dans le tableau du pipeline (en cours et gagnés récents). */
export const MAX_PROJETS_PIPELINE = 200

export const TAILLE_PAGE_PROJETS = 50

export function lireProjetVendeur(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<ProjetVendeur>> {
  return lire(client, 'projets_vendeurs', id)
}

/** La plus proche tâche à faire de chaque projet (une seule lecture). */
async function prochainesTaches(
  client: SupabaseClient,
  ids: string[],
): Promise<Resultat<Map<string, Tache>>> {
  const prochaines = new Map<string, Tache>()
  if (ids.length === 0) return { ok: true, donnees: prochaines }
  const page = await listerPage(client, 'taches', {
    filtres: [
      { colonne: 'projet_vendeur_id', genre: 'parmi', valeur: ids },
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
    ],
    tri: [
      { colonne: 'echeance' },
      { colonne: 'heure' },
      { colonne: 'priorite' },
      { colonne: 'id' },
    ],
    debut: 0,
    taille: 1000,
  })
  if (!page.ok) return page
  for (const tache of page.donnees.lignes) {
    const projet = tache.projet_vendeur_id
    if (projet !== null && !prochaines.has(projet)) prochaines.set(projet, tache)
  }
  return { ok: true, donnees: prochaines }
}

/** Ajoute à chaque projet son contact, son bien et sa prochaine tâche. */
export async function completerProjets(
  client: SupabaseClient,
  projets: ProjetVendeur[],
): Promise<Resultat<ProjetVendeurAffiche[]>> {
  const liees = await lireFichesLiees(client, projets)
  if (!liees.ok) return liees
  const prochaines = await prochainesTaches(
    client,
    projets.map((projet) => projet.id),
  )
  if (!prochaines.ok) return prochaines
  return {
    ok: true,
    donnees: liees.donnees.map(({ ligne, contact, bien }) => ({
      id: ligne.id,
      projet: ligne,
      contact,
      bien,
      prochaine: prochaines.donnees.get(ligne.id) ?? null,
    })),
  }
}

/**
 * Le tableau du pipeline : les projets en cours, et les mandats signés depuis moins de
 * `JOURS_GAGNES_VISIBLES` jours (colonne « Mandat signé »). `tronque` : il y en a plus que
 * `MAX_PROJETS_PIPELINE`.
 */
export async function lirePipelineVendeur(
  client: SupabaseClient,
  aujourdhui: string,
): Promise<Resultat<{ projets: ProjetVendeurAffiche[]; tronque: boolean }>> {
  const tri = [{ colonne: 'etape_le' }, { colonne: 'created_at' }, { colonne: 'id' }] as const
  const actifs = await listerPage(client, 'projets_vendeurs', {
    filtres: [{ colonne: 'etat', genre: 'egal', valeur: 'actif' }],
    tri,
    debut: 0,
    taille: MAX_PROJETS_PIPELINE,
    compter: true,
  })
  if (!actifs.ok) return actifs
  const gagnes = await listerPage(client, 'projets_vendeurs', {
    filtres: [
      { colonne: 'etat', genre: 'egal', valeur: 'gagne' },
      { colonne: 'mandat_le', genre: 'min', valeur: debutGagnesVisibles(aujourdhui) },
    ],
    tri,
    debut: 0,
    taille: 50,
  })
  if (!gagnes.ok) return gagnes
  const projets = await completerProjets(client, [
    ...actifs.donnees.lignes,
    ...gagnes.donnees.lignes,
  ])
  if (!projets.ok) return projets
  const total = actifs.donnees.total ?? actifs.donnees.lignes.length
  return { ok: true, donnees: { projets: projets.donnees, tronque: total > MAX_PROJETS_PIPELINE } }
}

/** Ordre des listes hors pipeline : la prochaine relance d'abord, ou le plus récent. */
const TRI_PAR_ETAT: Record<
  Exclude<EtatProjet, 'actif'>,
  readonly { colonne: keyof ProjetVendeur & string; croissant?: boolean }[]
> = {
  a_recontacter: [{ colonne: 'recontacter_le' }, { colonne: 'id' }],
  perdu: [{ colonne: 'updated_at', croissant: false }, { colonne: 'id' }],
  gagne: [{ colonne: 'mandat_le', croissant: false }, { colonne: 'id' }],
}

/** Une page des projets d'un état hors du pipeline (à recontacter, perdus, gagnés). */
export async function lirePageProjetsParEtat(
  client: SupabaseClient,
  options: { etat: Exclude<EtatProjet, 'actif'>; debut: number; compter: boolean },
): Promise<Resultat<PageLignes<ProjetVendeurAffiche>>> {
  const page = await listerPage(client, 'projets_vendeurs', {
    filtres: [{ colonne: 'etat', genre: 'egal', valeur: options.etat }],
    tri: TRI_PAR_ETAT[options.etat],
    debut: options.debut,
    taille: TAILLE_PAGE_PROJETS,
    compter: options.compter,
  })
  if (!page.ok) return page
  const lignes = await completerProjets(client, page.donnees.lignes)
  if (!lignes.ok) return lignes
  return { ok: true, donnees: { lignes: lignes.donnees, total: page.donnees.total } }
}

/** Nombre de projets de chaque état (onglets de la page Pipelines). `null` : inconnu. */
export async function compterProjetsParEtat(
  client: SupabaseClient,
): Promise<Record<EtatProjet, number | null>> {
  const etats = ['actif', 'a_recontacter', 'perdu', 'gagne'] as const
  const comptes = await Promise.all(
    etats.map((etat) =>
      listerPage(client, 'projets_vendeurs', {
        filtres: [{ colonne: 'etat', genre: 'egal', valeur: etat }],
        tri: [{ colonne: 'id' }],
        debut: 0,
        taille: 1,
        compter: true,
      }),
    ),
  )
  const nombre = (rang: number) => {
    const compte = comptes[rang]
    return compte !== undefined && compte.ok ? compte.donnees.total : null
  }
  return { actif: nombre(0), a_recontacter: nombre(1), perdu: nombre(2), gagne: nombre(3) }
}

/**
 * Les projets vendeurs d'un contact ou d'un bien, les plus récents d'abord. `archives` :
 * `'avec'` pour l'export (projets archivés compris).
 */
export async function listerProjetsVendeursLies(
  client: SupabaseClient,
  lien: { contactId: string } | { bienId: string },
  archives: 'sans' | 'avec' = 'sans',
): Promise<Resultat<ProjetVendeurAffiche[]>> {
  const filtre: Filtre<'projets_vendeurs'> =
    'contactId' in lien
      ? { colonne: 'contact_id', genre: 'egal', valeur: lien.contactId }
      : { colonne: 'bien_id', genre: 'egal', valeur: lien.bienId }
  const page = await listerPage(client, 'projets_vendeurs', {
    archives,
    filtres: [filtre],
    tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
    debut: 0,
    taille: 200,
  })
  if (!page.ok) return page
  return completerProjets(client, page.donnees.lignes)
}

/** Le projet en cours (ou à recontacter) d'un bien, s'il en a un. */
export async function projetEnCoursDuBien(
  client: SupabaseClient,
  bienId: string,
): Promise<Resultat<ProjetVendeur | null>> {
  const page = await listerPage(client, 'projets_vendeurs', {
    filtres: [
      { colonne: 'bien_id', genre: 'egal', valeur: bienId },
      { colonne: 'etat', genre: 'parmi', valeur: ['actif', 'a_recontacter'] },
    ],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: 1,
  })
  if (!page.ok) return page
  return { ok: true, donnees: page.donnees.lignes[0] ?? null }
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------

const MESSAGE_DOUBLON =
  'Ce bien a déjà un projet vendeur en cours ou à recontacter : ouvrez-le plutôt que d’en créer un second.'

/** Un nouveau projet, à l'étape « Premier contact ». */
export async function creerProjetVendeur(
  client: SupabaseClient,
  liens: { contactId: string; bienId: string },
): Promise<Resultat<ProjetVendeur>> {
  const resultat = await creer(client, 'projets_vendeurs', {
    contact_id: liens.contactId,
    bien_id: liens.bienId,
  })
  if (!resultat.ok && resultat.erreur.genre === 'doublon') {
    return { ok: false, erreur: { genre: 'doublon', message: MESSAGE_DOUBLON } }
  }
  return resultat
}

export function modifierProjetVendeur(
  client: SupabaseClient,
  id: string,
  valeurs: ValeursProjet,
): Promise<Resultat<ProjetVendeur>> {
  return modifier(client, 'projets_vendeurs', id, valeurs)
}

/**
 * Change l'étape d'un projet, avec les informations que demandait le passage. La source du
 * contact est enregistrée d'abord s'il le faut. Arriver à « Mandat signé » fait passer le
 * bien « En mandat », s'il n'était pas déjà plus loin.
 */
export async function changerEtapeProjet(
  client: SupabaseClient,
  projet: ProjetVendeur,
  passage: Passage,
  bien: Bien | null,
): Promise<Resultat<ProjetVendeur>> {
  if (passage.source !== null) {
    const source = await modifier(client, 'contacts', projet.contact_id, passage.source)
    if (!source.ok) return source
  }
  const resultat = await modifier(client, 'projets_vendeurs', projet.id, passage.projet)
  if (!resultat.ok) return resultat
  if (
    passage.projet.etape === 'mandat_signe' &&
    bien !== null &&
    ['repere', 'en_veille', 'en_estimation'].includes(bien.statut)
  ) {
    // Sans conséquence si cela échoue : le statut du bien se corrige sur sa fiche.
    await modifier(client, 'biens', bien.id, { statut: 'en_mandat' })
  }
  return resultat
}

/** Sort le projet du pipeline (à recontacter, perdu), avec sa relance s'il y a lieu. */
export async function sortirProjetVendeur(
  client: SupabaseClient,
  id: string,
  parametres: ParametresSortie,
): Promise<Resultat<Tache | null>> {
  const resultat = await appeler(client, 'sortir_projet_vendeur', { p_id: id, ...parametres })
  if (!resultat.ok) {
    if (resultat.erreur.genre === 'invalide') {
      return {
        ok: false,
        erreur: {
          genre: 'invalide',
          message:
            'Ce projet a déjà quitté le pipeline, peut-être depuis un autre appareil. Rechargez la page.',
        },
      }
    }
    return resultat
  }
  return { ok: true, donnees: resultat.donnees[0] ?? null }
}

/** Remet dans le pipeline un projet à recontacter ou perdu, à l'étape où il était. */
export async function reprendreProjetVendeur(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<ProjetVendeur>> {
  const resultat = await modifier(client, 'projets_vendeurs', id, {
    etat: 'actif',
    recontacter_le: null,
    motif_perte: null,
    motif_perte_detail: '',
  })
  if (!resultat.ok && resultat.erreur.genre === 'doublon') {
    return { ok: false, erreur: { genre: 'doublon', message: MESSAGE_DOUBLON } }
  }
  return resultat
}

/** Archive un projet saisi par erreur : il disparaît du pipeline et des fiches. */
export function archiverProjetVendeur(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<ProjetVendeur>> {
  return archiver(client, 'projets_vendeurs', id)
}
