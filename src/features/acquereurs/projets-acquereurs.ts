import type { SupabaseClient } from '@supabase/supabase-js'
import {
  appeler,
  archiver,
  creer,
  lire,
  listerPage,
  modifier,
  type Creation,
  type PageLignes,
  type Resultat,
} from '../../lib/donnees'
import { ajouterJours, formaterJourCourt } from '../../lib/dates'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import type { Tache } from '../taches/taches'
import {
  type EtatProjetAcquereur,
  type ParametresSortieAcquereur,
  type PassageAcquereur,
  type ProjetAcquereur,
  type ValeursRecherche,
} from './pipeline-acquereur'

/**
 * Projets acquéreurs : lecture et écriture. Les règles du pipeline (étapes, critères,
 * sorties, offre) sont dans `pipeline-acquereur.ts`.
 */

/** Un projet avec ses fiches liées, sa prochaine tâche et sa sélection, pour l'affichage. */
export type ProjetAcquereurAffiche = {
  id: string
  projet: ProjetAcquereur
  contact: Contact | null
  coAcquereur: Contact | null
  /** Le bien concerné par la demande, s'il y en a un. */
  bienOrigine: Bien | null
  /** La plus proche des tâches à faire liées au projet, s'il y en a. */
  prochaine: Tache | null
  /** Nombre de biens proposés (sélection en cours). */
  nbProposes: number
}

/** Au plus autant de projets dans le tableau du pipeline (en cours et gagnés récents). */
export const MAX_PROJETS_ACQUEREURS_PIPELINE = 200
export const TAILLE_PAGE_PROJETS_ACQUEREURS = 50
/** Une offre acceptée reste visible dans la colonne « Visites » pendant ces jours. */
export const JOURS_OFFRES_VISIBLES = 30

/** La prochaine action d'un projet, sur une ligne, et si elle est en retard. */
export function prochaineActionAcquereur(
  affiche: Pick<ProjetAcquereurAffiche, 'prochaine' | 'contact' | 'projet'>,
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
  if (contact?.prochaine_action_le !== null && contact?.prochaine_action_le !== undefined) {
    return {
      texte: `Contact : ${formaterJourCourt(contact.prochaine_action_le, aujourdhui)}`,
      alerte: contact.prochaine_action_le < aujourdhui,
    }
  }
  return { texte: 'Aucune action prévue', alerte: true }
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

async function lireParIds<T extends 'contacts' | 'biens'>(
  client: SupabaseClient,
  table: T,
  ids: string[],
) {
  return listerPage(client, table, {
    archives: 'avec',
    filtres: [{ colonne: 'id', genre: 'parmi', valeur: ids }],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: ids.length,
  })
}

const distincts = (valeurs: (string | null)[]) => [
  ...new Set(valeurs.filter((valeur): valeur is string => valeur !== null)),
]

/**
 * Ajoute à chaque projet ses contacts (acquéreur et co-acquéreur), le bien de la demande,
 * sa prochaine tâche et le nombre de biens proposés. Quatre lectures au plus, quelle que
 * soit la longueur de la liste.
 */
export async function completerProjetsAcquereurs(
  client: SupabaseClient,
  projets: ProjetAcquereur[],
): Promise<Resultat<ProjetAcquereurAffiche[]>> {
  if (projets.length === 0) return { ok: true, donnees: [] }
  const ids = projets.map((projet) => projet.id)
  const idsContacts = distincts(projets.flatMap((p) => [p.contact_id, p.co_acquereur_id]))
  const idsBiens = distincts(projets.map((p) => p.bien_origine_id))

  const contacts = new Map<string, Contact>()
  const lusContacts = await lireParIds(client, 'contacts', idsContacts)
  if (!lusContacts.ok) return lusContacts
  for (const contact of lusContacts.donnees.lignes) contacts.set(contact.id, contact)

  const biens = new Map<string, Bien>()
  if (idsBiens.length > 0) {
    const lus = await lireParIds(client, 'biens', idsBiens)
    if (!lus.ok) return lus
    for (const bien of lus.donnees.lignes) biens.set(bien.id, bien)
  }

  const taches = await listerPage(client, 'taches', {
    filtres: [
      { colonne: 'projet_acquereur_id', genre: 'parmi', valeur: ids },
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
  if (!taches.ok) return taches
  const prochaines = new Map<string, Tache>()
  for (const tache of taches.donnees.lignes) {
    const projet = tache.projet_acquereur_id
    if (projet !== null && !prochaines.has(projet)) prochaines.set(projet, tache)
  }

  const proposes = await listerPage(client, 'biens_proposes', {
    filtres: [{ colonne: 'projet_acquereur_id', genre: 'parmi', valeur: ids }],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: 1000,
  })
  if (!proposes.ok) return proposes
  const nombres = new Map<string, number>()
  for (const propose of proposes.donnees.lignes) {
    nombres.set(propose.projet_acquereur_id, (nombres.get(propose.projet_acquereur_id) ?? 0) + 1)
  }

  return {
    ok: true,
    donnees: projets.map((projet) => ({
      id: projet.id,
      projet,
      contact: contacts.get(projet.contact_id) ?? null,
      coAcquereur:
        projet.co_acquereur_id === null ? null : (contacts.get(projet.co_acquereur_id) ?? null),
      bienOrigine:
        projet.bien_origine_id === null ? null : (biens.get(projet.bien_origine_id) ?? null),
      prochaine: prochaines.get(projet.id) ?? null,
      nbProposes: nombres.get(projet.id) ?? 0,
    })),
  }
}

export function lireProjetAcquereur(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<ProjetAcquereur>> {
  return lire(client, 'projets_acquereurs', id)
}

/** Un projet, complété de ses fiches liées. */
export async function lireProjetAcquereurAffiche(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<ProjetAcquereurAffiche>> {
  const lu = await lireProjetAcquereur(client, id)
  if (!lu.ok) return lu
  const complet = await completerProjetsAcquereurs(client, [lu.donnees])
  if (!complet.ok) return complet
  const affiche = complet.donnees[0]
  return affiche === undefined
    ? { ok: false, erreur: { genre: 'introuvable', message: 'Projet introuvable.' } }
    : { ok: true, donnees: affiche }
}

/**
 * Le tableau du pipeline : les projets en cours, et les offres acceptées depuis moins de
 * `JOURS_OFFRES_VISIBLES` jours (colonne « Visites »). `tronque` : il y en a plus que
 * `MAX_PROJETS_ACQUEREURS_PIPELINE`.
 */
export async function lirePipelineAcquereur(
  client: SupabaseClient,
  aujourdhui: string,
): Promise<Resultat<{ projets: ProjetAcquereurAffiche[]; tronque: boolean }>> {
  const tri = [{ colonne: 'etape_le' }, { colonne: 'created_at' }, { colonne: 'id' }] as const
  const actifs = await listerPage(client, 'projets_acquereurs', {
    filtres: [{ colonne: 'etat', genre: 'egal', valeur: 'actif' }],
    tri,
    debut: 0,
    taille: MAX_PROJETS_ACQUEREURS_PIPELINE,
    compter: true,
  })
  if (!actifs.ok) return actifs
  const gagnes = await listerPage(client, 'projets_acquereurs', {
    filtres: [
      { colonne: 'etat', genre: 'egal', valeur: 'gagne' },
      {
        colonne: 'offre_le',
        genre: 'min',
        valeur: ajouterJours(aujourdhui, -JOURS_OFFRES_VISIBLES),
      },
    ],
    tri,
    debut: 0,
    taille: 50,
  })
  if (!gagnes.ok) return gagnes
  const projets = await completerProjetsAcquereurs(client, [
    ...actifs.donnees.lignes,
    ...gagnes.donnees.lignes,
  ])
  if (!projets.ok) return projets
  const total = actifs.donnees.total ?? actifs.donnees.lignes.length
  return {
    ok: true,
    donnees: { projets: projets.donnees, tronque: total > MAX_PROJETS_ACQUEREURS_PIPELINE },
  }
}

/** Ordre des listes hors pipeline : la prochaine relance d'abord, ou le plus récent. */
const TRI_PAR_ETAT: Record<
  Exclude<EtatProjetAcquereur, 'actif'>,
  readonly { colonne: keyof ProjetAcquereur & string; croissant?: boolean }[]
> = {
  a_recontacter: [{ colonne: 'recontacter_le' }, { colonne: 'id' }],
  perdu: [{ colonne: 'updated_at', croissant: false }, { colonne: 'id' }],
  gagne: [{ colonne: 'offre_le', croissant: false }, { colonne: 'id' }],
}

/** Une page des projets d'un état hors du pipeline (à recontacter, perdus, gagnés). */
export async function lirePageProjetsAcquereursParEtat(
  client: SupabaseClient,
  options: { etat: Exclude<EtatProjetAcquereur, 'actif'>; debut: number; compter: boolean },
): Promise<Resultat<PageLignes<ProjetAcquereurAffiche>>> {
  const page = await listerPage(client, 'projets_acquereurs', {
    filtres: [{ colonne: 'etat', genre: 'egal', valeur: options.etat }],
    tri: TRI_PAR_ETAT[options.etat],
    debut: options.debut,
    taille: TAILLE_PAGE_PROJETS_ACQUEREURS,
    compter: options.compter,
  })
  if (!page.ok) return page
  const lignes = await completerProjetsAcquereurs(client, page.donnees.lignes)
  if (!lignes.ok) return lignes
  return { ok: true, donnees: { lignes: lignes.donnees, total: page.donnees.total } }
}

/** Nombre de projets de chaque état (onglets de la page Pipelines). `null` : inconnu. */
export async function compterProjetsAcquereursParEtat(
  client: SupabaseClient,
): Promise<Record<EtatProjetAcquereur, number | null>> {
  const etats = ['actif', 'a_recontacter', 'perdu', 'gagne'] as const
  const comptes = await Promise.all(
    etats.map((etat) =>
      listerPage(client, 'projets_acquereurs', {
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
 * Les projets acquéreurs d'un contact, comme acquéreur principal ou comme co-acquéreur,
 * les plus récents d'abord. `archives` : `'avec'` pour l'export.
 */
export async function listerProjetsAcquereursDuContact(
  client: SupabaseClient,
  contactId: string,
  archives: 'sans' | 'avec' = 'sans',
): Promise<Resultat<ProjetAcquereurAffiche[]>> {
  const lectures = await Promise.all(
    (['contact_id', 'co_acquereur_id'] as const).map((colonne) =>
      listerPage(client, 'projets_acquereurs', {
        archives,
        filtres: [{ colonne, genre: 'egal', valeur: contactId }],
        tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
        debut: 0,
        taille: 200,
      }),
    ),
  )
  const projets: ProjetAcquereur[] = []
  for (const lecture of lectures) {
    if (!lecture.ok) return lecture
    projets.push(...lecture.donnees.lignes)
  }
  projets.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return completerProjetsAcquereurs(client, projets)
}

/** Les demandes d'acquéreurs qui portaient sur ce bien (bien concerné par la demande). */
export async function listerDemandesSurBien(
  client: SupabaseClient,
  bienId: string,
): Promise<Resultat<ProjetAcquereurAffiche[]>> {
  const page = await listerPage(client, 'projets_acquereurs', {
    filtres: [{ colonne: 'bien_origine_id', genre: 'egal', valeur: bienId }],
    tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
    debut: 0,
    taille: 200,
  })
  if (!page.ok) return page
  return completerProjetsAcquereurs(client, page.donnees.lignes)
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------

/** Ce qu'enregistre la création d'un projet (demande entrante ou nouveau projet). */
export type CreationProjetAcquereur = Omit<Creation<'projets_acquereurs'>, 'contact_id'>

export function creerProjetAcquereur(
  client: SupabaseClient,
  contactId: string,
  valeurs: CreationProjetAcquereur,
): Promise<Resultat<ProjetAcquereur>> {
  return creer(client, 'projets_acquereurs', { ...valeurs, contact_id: contactId })
}

export function modifierRecherche(
  client: SupabaseClient,
  id: string,
  valeurs: ValeursRecherche,
): Promise<Resultat<ProjetAcquereur>> {
  return modifier(client, 'projets_acquereurs', id, valeurs)
}

/** Change le co-acquéreur (ou le retire avec `null`). */
export function changerCoAcquereur(
  client: SupabaseClient,
  id: string,
  coAcquereurId: string | null,
): Promise<Resultat<ProjetAcquereur>> {
  return modifier(client, 'projets_acquereurs', id, { co_acquereur_id: coAcquereurId })
}

/** Message de la base quand un critère qui porte sur une autre table n'est pas rempli. */
function messageCritere(resultat: Resultat<ProjetAcquereur>, message: string) {
  if (!resultat.ok && resultat.erreur.genre === 'invalide') {
    return { ok: false as const, erreur: { genre: 'invalide' as const, message } }
  }
  return resultat
}

/** Change l'étape d'un projet, avec les informations que demandait le passage. */
export async function changerEtapeAcquereur(
  client: SupabaseClient,
  id: string,
  passage: PassageAcquereur,
): Promise<Resultat<ProjetAcquereur>> {
  const resultat = await modifier(client, 'projets_acquereurs', id, passage)
  return messageCritere(
    resultat,
    passage.etape === 'visites'
      ? 'La base demande au moins un bien proposé avant les visites. Rechargez la page.'
      : 'La base a refusé une des informations. Vérifiez-les, puis réessayez.',
  )
}

/** L'offre est acceptée : le projet est gagné. */
export async function accepterOffre(
  client: SupabaseClient,
  id: string,
  valeurs: { etat: 'gagne'; offre_bien_id: string; offre_le: string },
): Promise<Resultat<ProjetAcquereur>> {
  const resultat = await modifier(client, 'projets_acquereurs', id, valeurs)
  return messageCritere(
    resultat,
    'La base demande au moins une visite consignée au journal de ce projet avant l’offre.',
  )
}

/** Sort le projet du pipeline (à recontacter, perdu), avec sa relance s'il y a lieu. */
export async function sortirProjetAcquereur(
  client: SupabaseClient,
  id: string,
  parametres: ParametresSortieAcquereur,
): Promise<Resultat<Tache | null>> {
  const resultat = await appeler(client, 'sortir_projet_acquereur', { p_id: id, ...parametres })
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

/** Remet dans le pipeline un projet à recontacter, perdu ou gagné, à l'étape où il était. */
export function reprendreProjetAcquereur(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<ProjetAcquereur>> {
  return modifier(client, 'projets_acquereurs', id, {
    etat: 'actif',
    recontacter_le: null,
    motif_perte: null,
    motif_perte_detail: '',
    offre_bien_id: null,
    offre_le: null,
  })
}

/** Archive un projet saisi par erreur : il disparaît du pipeline et des fiches. */
export function archiverProjetAcquereur(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<ProjetAcquereur>> {
  return archiver(client, 'projets_acquereurs', id)
}
