import type { GenreEtiquette } from '../../components/Etiquette'
import { depuisQuand, ecartJours, estDateValide, formaterJourLong } from '../../lib/dates'
import { estTypeActivite, TYPES_ACTIVITE, type Activite, type TypeActivite } from './activites'

/**
 * L'historique d'une fiche (étape D.6) : les activités groupées par jour, chacune en carte,
 * avec son résultat en pastille.
 */

/**
 * Le titre d'une journée : « Aujourd'hui », « Hier », sinon « Jeudi 13 novembre · il y a
 * 8 jours » (l'année s'ajoute quand elle n'est pas celle d'aujourd'hui).
 */
export function titreJourHistorique(date: string, aujourdhui: string): string {
  if (!estDateValide(date)) return date
  const ecart = ecartJours(date, aujourdhui)
  if (ecart === 0) return "Aujourd'hui"
  if (ecart === 1) return 'Hier'
  const annee = date.slice(0, 4) === aujourdhui.slice(0, 4) ? '' : ` ${date.slice(0, 4)}`
  const jour = `${formaterJourLong(date)}${annee}`
  // Une date à venir (activité mal datée) n'a pas de « il y a ».
  return ecart < 0 ? jour : `${jour} · ${depuisQuand(ecart)}`
}

export type PastilleResultat = { libelle: string; genre: GenreEtiquette }

const RESULTATS: Record<string, PastilleResultat> = {
  joint: { libelle: 'Joint', genre: 'succes' },
  messagerie: { libelle: 'Messagerie', genre: 'neutre' },
  pas_de_reponse: { libelle: 'Pas de réponse', genre: 'alerte' },
  rappeler: { libelle: 'À rappeler', genre: 'info' },
}

const INTERETS: Record<string, PastilleResultat> = {
  fort: { libelle: 'Intéressé', genre: 'succes' },
  moyen: { libelle: 'Intérêt moyen', genre: 'info' },
  faible: { libelle: 'Peu intéressé', genre: 'alerte' },
  aucun: { libelle: 'Pas intéressé', genre: 'neutre' },
}

/**
 * Le résultat d'une activité en pastille : celui d'un appel (« Pas de réponse »), l'intérêt
 * après une visite (« Intéressé »). `null` quand il n'y a rien à dire.
 */
export function pastilleResultat(
  activite: Pick<Activite, 'type' | 'resultat' | 'visite_interet'>,
): PastilleResultat | null {
  if (activite.type === 'appel' && activite.resultat !== null) {
    return RESULTATS[activite.resultat] ?? null
  }
  if (activite.type === 'visite' && activite.visite_interet !== null) {
    return INTERETS[activite.visite_interet] ?? null
  }
  return null
}

// ---------------------------------------------------------------------------
// Filtre par type, en pastilles (revue de design n° 2, proposition 13)
// ---------------------------------------------------------------------------

/** Sous ce nombre d'échanges, l'historique se lit d'un coup d'œil : pas de filtre. */
export const SEUIL_FILTRE_TYPES = 4

/**
 * Combien d'activités de chaque type. `complet` : tous les types ont été lus ; faux quand la
 * lecture a atteint sa borne (les plus anciennes n'ont pas été vues : les nombres seraient
 * faux, et un type ancien manquerait).
 */
export type ComptesTypes = {
  parType: Partial<Record<TypeActivite, number>>
  total: number
  complet: boolean
}

/** Les comptes d'une liste de types (lue en entier si `complet`). Un type inconnu est ignoré. */
export function compterTypes(types: readonly string[], complet: boolean): ComptesTypes {
  const parType: Partial<Record<TypeActivite, number>> = {}
  let total = 0
  for (const type of types) {
    if (!estTypeActivite(type)) continue
    parType[type] = (parType[type] ?? 0) + 1
    total += 1
  }
  return { parType, total, complet }
}

/** Le nom d'un type au pluriel, court, pour une pastille (« Appels », « Documents »). */
const PLURIELS: Record<TypeActivite, string> = {
  appel: 'Appels',
  sms: 'SMS',
  courriel: 'Courriels',
  note: 'Notes',
  rendez_vous: 'Rendez-vous',
  visite: 'Visites',
  estimation: 'Estimations',
  porte_a_porte: 'Porte-à-porte',
  document: 'Documents',
  autre: 'Autres',
}

/** Le nom d'un type au singulier, court : celui d'une pastille qui compte « 1 ». */
const SINGULIERS: Record<TypeActivite, string> = {
  ...PLURIELS,
  appel: 'Appel',
  courriel: 'Courriel',
  note: 'Note',
  visite: 'Visite',
  estimation: 'Estimation',
  document: 'Document',
  autre: 'Autre',
}

export type PastilleType = {
  /** Vide : tous les types. */
  valeur: TypeActivite | ''
  /** « Appels », « Tout ». */
  libelle: string
  /** « 3 », ou `null` quand le nombre n'est pas sûr. */
  nombre: string | null
  /** Ce qu'entend un lecteur d'écran : « Appels, 3 », « Tous les types, 12 ». */
  annonce: string
}

function pastille(valeur: TypeActivite | '', nombre: number | null): PastilleType {
  const libelle = valeur === '' ? 'Tout' : nombre === 1 ? SINGULIERS[valeur] : PLURIELS[valeur]
  const texte = nombre === null ? null : nombre.toLocaleString('fr-FR')
  const nom = valeur === '' ? 'Tous les types' : libelle
  return { valeur, libelle, nombre: texte, annonce: texte === null ? nom : `${nom}, ${texte}` }
}

/**
 * Les pastilles du filtre : « Tout », puis seulement les types présents, avec leur nombre
 * (« Appels 3 »), dans l'ordre habituel des types (les plus fréquents d'abord). Le type
 * choisi reste, même s'il n'en reste plus (« Visites 0 ») : on peut toujours revenir à
 * « Tout ». Comptes incomplets (lecture bornée atteinte) ou illisibles : tous les types,
 * sans nombre.
 */
export function pastillesTypes(
  comptes: ComptesTypes | null,
  choisi: TypeActivite | '',
): PastilleType[] {
  if (comptes === null || !comptes.complet) {
    return [pastille('', null), ...TYPES_ACTIVITE.map((option) => pastille(option.valeur, null))]
  }
  const presents = TYPES_ACTIVITE.map((option) => option.valeur).filter(
    (type) => (comptes.parType[type] ?? 0) > 0 || type === choisi,
  )
  return [
    pastille('', comptes.total),
    ...presents.map((type) => pastille(type, comptes.parType[type] ?? 0)),
  ]
}

/**
 * La rangée de pastilles s'affiche-t-elle ? Pas sous `SEUIL_FILTRE_TYPES` échanges, ni tant
 * que les comptes ne sont pas connus ; toujours quand un type est choisi (pour revenir à
 * « Tout »).
 */
export function filtreTypesVisible(
  comptes: ComptesTypes | null,
  choisi: TypeActivite | '',
): boolean {
  if (choisi !== '') return true
  if (comptes === null) return false
  return !comptes.complet || comptes.total >= SEUIL_FILTRE_TYPES
}

/** Les pastilles à montrer, ou `null` quand la rangée est masquée (`filtreTypesVisible`). */
export function filtreTypes(
  comptes: ComptesTypes | null,
  choisi: TypeActivite | '',
): PastilleType[] | null {
  return filtreTypesVisible(comptes, choisi) ? pastillesTypes(comptes, choisi) : null
}
