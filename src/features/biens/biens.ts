import type { SupabaseClient } from '@supabase/supabase-js'
import type { GenreEtiquette } from '../../components/Etiquette'
import {
  archiver,
  creer,
  lire,
  listerPage,
  modifier,
  restaurer,
  type Creation,
  type Filtre,
  type Ligne,
  type PageLignes,
  type Resultat,
} from '../../lib/donnees'
import { dateDuJour, estDateValide } from '../../lib/dates'
import { formaterDecimal, formaterPrix, formaterSurface, lireNombre } from '../../lib/nombres'

/**
 * Biens : un logement, un local ou un terrain, qu'il soit en mandat, en veille ou simplement
 * repéré. Toutes les transactions, ni location ni gestion. Le type du bien décide des champs
 * utilisés : voir `CHAMPS_PAR_TYPE`.
 */

/** Un bien tel qu'il est lu dans la base. */
export type Bien = Ligne<'biens'>

/** Un prix de l'historique d'un bien : `created_at` est la date du changement. */
export type PrixBien = Ligne<'biens_prix'>

/** Valeurs envoyées à la base. La colonne `recherche` est calculée par la base. */
export type ValeursBien = Omit<Creation<'biens'>, 'recherche'>

export type TypeBien = 'ancien' | 'neuf' | 'viager' | 'commerce' | 'terrain'
export type StatutBien =
  'repere' | 'en_veille' | 'en_estimation' | 'en_mandat' | 'sous_offre' | 'vendu' | 'retire'
export type EtatBien = 'neuf' | 'tres_bon' | 'bon' | 'a_rafraichir' | 'a_renover'
export type ClasseEnergie = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type OccupationViager = 'occupe' | 'libre'
export type NatureCommerce = 'murs' | 'fonds' | 'murs_et_fonds'
/** Réponse à une question par oui ou non, quand on peut ne pas savoir. */
export type OuiNon = 'oui' | 'non'

type Option<V extends string> = { valeur: V; libelle: string }

export const TYPES_BIEN: readonly Option<TypeBien>[] = [
  { valeur: 'ancien', libelle: 'Ancien' },
  { valeur: 'neuf', libelle: 'Neuf' },
  { valeur: 'viager', libelle: 'Viager' },
  { valeur: 'commerce', libelle: 'Commerce ou local' },
  { valeur: 'terrain', libelle: 'Terrain' },
]

export const STATUTS_BIEN: readonly (Option<StatutBien> & { genre: GenreEtiquette })[] = [
  { valeur: 'repere', libelle: 'Repéré', genre: 'neutre' },
  { valeur: 'en_veille', libelle: 'En veille', genre: 'neutre' },
  { valeur: 'en_estimation', libelle: 'En estimation', genre: 'info' },
  { valeur: 'en_mandat', libelle: 'En mandat', genre: 'succes' },
  { valeur: 'sous_offre', libelle: 'Sous offre', genre: 'alerte' },
  { valeur: 'vendu', libelle: 'Vendu', genre: 'succes' },
  { valeur: 'retire', libelle: 'Retiré', genre: 'neutre' },
]

export const ETATS_BIEN: readonly Option<EtatBien>[] = [
  { valeur: 'neuf', libelle: 'Neuf ou refait à neuf' },
  { valeur: 'tres_bon', libelle: 'Très bon état' },
  { valeur: 'bon', libelle: 'Bon état' },
  { valeur: 'a_rafraichir', libelle: 'À rafraîchir' },
  { valeur: 'a_renover', libelle: 'À rénover' },
]

export const CLASSES_ENERGIE: readonly Option<ClasseEnergie>[] = (
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
).map((classe) => ({ valeur: classe, libelle: classe }))

export const OCCUPATIONS_VIAGER: readonly Option<OccupationViager>[] = [
  { valeur: 'occupe', libelle: 'Occupé' },
  { valeur: 'libre', libelle: 'Libre' },
]

export const NATURES_COMMERCE: readonly Option<NatureCommerce>[] = [
  { valeur: 'murs', libelle: 'Murs' },
  { valeur: 'fonds', libelle: 'Fonds de commerce' },
  { valeur: 'murs_et_fonds', libelle: 'Murs et fonds' },
]

export const OUI_NON: readonly Option<OuiNon>[] = [
  { valeur: 'oui', libelle: 'Oui' },
  { valeur: 'non', libelle: 'Non' },
]

export const LONGUEURS_MAX_BIEN = {
  adresse: 200,
  complement: 200,
  code_postal: 10,
  ville: 80,
  description: 5000,
  programme: 120,
  lot: 60,
  commerce_bail: 200,
  commerce_activite: 120,
} as const

export const MAX_CREDIRENTIERS = 4

function libelleDe<V extends string>(options: readonly Option<V>[], valeur: string | null) {
  return options.find((option) => option.valeur === valeur)?.libelle ?? null
}

function parmi<V extends string>(options: readonly Option<V>[], valeur: string | null): V | '' {
  return options.find((option) => option.valeur === valeur)?.valeur ?? ''
}

/** Libellés français des valeurs enregistrées ; `null` si la valeur est vide ou inconnue. */
export const libelleType = (type: string) => libelleDe(TYPES_BIEN, type) ?? type
export const libelleStatut = (statut: string) => libelleDe(STATUTS_BIEN, statut) ?? statut
export const libelleEtat = (etat: string | null) => libelleDe(ETATS_BIEN, etat)
export const libelleOccupation = (valeur: string | null) => libelleDe(OCCUPATIONS_VIAGER, valeur)
export const libelleNatureCommerce = (valeur: string | null) => libelleDe(NATURES_COMMERCE, valeur)

/** Couleur de la pastille d'un statut. */
export function genreStatut(statut: string): GenreEtiquette {
  return STATUTS_BIEN.find((option) => option.valeur === statut)?.genre ?? 'neutre'
}

/** Les champs qui n'existent que pour certains types de bien. */
export type ChampSelonType =
  | 'etage'
  | 'surface'
  | 'pieces'
  | 'chambres'
  | 'annee_construction'
  | 'etat'
  | 'dpe_classe'
  | 'dpe_valeur'
  | 'dpe_date'
  | 'ges_classe'
  | 'ges_valeur'
  | 'ges_date'
  | 'copropriete'
  | 'charges_annuelles'
  | 'taxe_fonciere'
  | 'programme'
  | 'lot'
  | 'date_livraison'
  | 'viager_bouquet'
  | 'viager_rente'
  | 'viager_occupation'
  | 'viager_ages'
  | 'commerce_nature'
  | 'commerce_bail'
  | 'commerce_loyer'
  | 'commerce_activite'
  | 'surface_terrain'
  | 'constructible'
  | 'viabilise'

/** Ce qui décrit un bâtiment : tout sauf un terrain. */
const BATI: readonly ChampSelonType[] = [
  'etage',
  'surface',
  'pieces',
  'annee_construction',
  'etat',
  'dpe_classe',
  'dpe_valeur',
  'dpe_date',
  'ges_classe',
  'ges_valeur',
  'ges_date',
]

/**
 * Les champs utilisés par chaque type de bien. Le formulaire et la fiche n'affichent que
 * ceux-là ; à l'enregistrement, les autres sont vidés. L'adresse, le type, le statut, le
 * prix et la description valent pour tous les types.
 */
export const CHAMPS_PAR_TYPE: Record<TypeBien, readonly ChampSelonType[]> = {
  ancien: [...BATI, 'chambres', 'copropriete', 'charges_annuelles', 'taxe_fonciere'],
  neuf: [...BATI, 'chambres', 'programme', 'lot', 'date_livraison'],
  viager: [
    ...BATI,
    'chambres',
    'viager_bouquet',
    'viager_rente',
    'viager_occupation',
    'viager_ages',
  ],
  commerce: [...BATI, 'commerce_nature', 'commerce_bail', 'commerce_loyer', 'commerce_activite'],
  terrain: ['surface_terrain', 'constructible', 'viabilise'],
}

/** Ce champ a-t-il un sens pour ce type de bien ? Un type inconnu ne montre rien de propre. */
export function champUtilise(type: string, champ: ChampSelonType): boolean {
  const champs: readonly ChampSelonType[] | undefined = CHAMPS_PAR_TYPE[type as TypeBien]
  return champs?.includes(champ) ?? false
}

function assembler(...morceaux: (string | null)[]): string {
  return morceaux.filter((morceau) => morceau !== null && morceau !== '').join(' ')
}

/** Code postal et ville : « 00000 Villefictive » ; vide si rien n'est renseigné. */
export function communeBien(bien: Pick<Bien, 'code_postal' | 'ville'>): string {
  return assembler(bien.code_postal, bien.ville)
}

/** Adresse sur une ligne : voie, complément, code postal et ville. */
export function adresseBien(
  bien: Pick<Bien, 'adresse' | 'complement' | 'code_postal' | 'ville'>,
): string {
  return [bien.adresse, bien.complement, communeBien(bien)]
    .filter((morceau) => morceau !== '')
    .join(', ')
}

/** Étage en clair : « Rez-de-chaussée », « 1er étage », « 3e étage », « Sous-sol (niveau -1) ». */
export function libelleEtage(etage: number): string {
  if (etage === 0) return 'Rez-de-chaussée'
  if (etage < 0) return `Sous-sol (niveau ${etage})`
  return etage === 1 ? '1er étage' : `${etage}e étage`
}

/**
 * Seconde ligne d'un bien dans une liste : ville, prix, type, surface, pièces. L'essentiel
 * vient d'abord : sur un téléphone, la fin de la ligne est coupée.
 */
export function resumeBien(bien: Bien): string {
  const surface = champUtilise(bien.type, 'surface_terrain') ? bien.surface_terrain : bien.surface
  const morceaux = [
    bien.ville === '' ? null : bien.ville,
    bien.prix === null ? null : formaterPrix(bien.prix),
    libelleType(bien.type),
    surface === null ? null : formaterSurface(surface),
    bien.pieces !== null && bien.pieces > 0
      ? `${bien.pieces} pièce${bien.pieces > 1 ? 's' : ''}`
      : null,
  ]
  return morceaux.filter((morceau) => morceau !== null).join(' · ')
}

/** Ce que contient le formulaire d'un bien : tout est du texte tant que rien n'est validé. */
export type BrouillonBien = {
  adresse: string
  complement: string
  etage: string
  code_postal: string
  ville: string
  type: TypeBien | ''
  statut: StatutBien
  prix: string
  surface: string
  pieces: string
  chambres: string
  annee_construction: string
  etat: EtatBien | ''
  description: string
  dpe_classe: ClasseEnergie | ''
  dpe_valeur: string
  /** Les dates sont au format des champs de date : `2026-11-16`, ou vide. */
  dpe_date: string
  ges_classe: ClasseEnergie | ''
  ges_valeur: string
  ges_date: string
  copropriete: OuiNon | ''
  charges_annuelles: string
  taxe_fonciere: string
  programme: string
  lot: string
  date_livraison: string
  viager_bouquet: string
  viager_rente: string
  viager_occupation: OccupationViager | ''
  /** Les âges, séparés par une virgule ou « et » : « 82 et 79 ». */
  viager_ages: string
  commerce_nature: NatureCommerce | ''
  commerce_bail: string
  commerce_loyer: string
  commerce_activite: string
  surface_terrain: string
  constructible: OuiNon | ''
  viabilise: OuiNon | ''
}

/** Formulaire vide, pour un nouveau bien : type à choisir, statut « Repéré ». */
export function brouillonBienVide(): BrouillonBien {
  return {
    adresse: '',
    complement: '',
    etage: '',
    code_postal: '',
    ville: '',
    type: '',
    statut: 'repere',
    prix: '',
    surface: '',
    pieces: '',
    chambres: '',
    annee_construction: '',
    etat: '',
    description: '',
    dpe_classe: '',
    dpe_valeur: '',
    dpe_date: '',
    ges_classe: '',
    ges_valeur: '',
    ges_date: '',
    copropriete: '',
    charges_annuelles: '',
    taxe_fonciere: '',
    programme: '',
    lot: '',
    date_livraison: '',
    viager_bouquet: '',
    viager_rente: '',
    viager_occupation: '',
    viager_ages: '',
    commerce_nature: '',
    commerce_bail: '',
    commerce_loyer: '',
    commerce_activite: '',
    surface_terrain: '',
    constructible: '',
    viabilise: '',
  }
}

const texteNombre = (nombre: number | null) => (nombre === null ? '' : String(nombre))
const texteDecimal = (nombre: number | null) => (nombre === null ? '' : formaterDecimal(nombre))
const texteOuiNon = (valeur: boolean | null): OuiNon | '' =>
  valeur === null ? '' : valeur ? 'oui' : 'non'

/** Remplit le formulaire à partir d'une fiche existante. */
export function brouillonBienDepuis(bien: Bien): BrouillonBien {
  return {
    adresse: bien.adresse,
    complement: bien.complement,
    etage: texteNombre(bien.etage),
    code_postal: bien.code_postal,
    ville: bien.ville,
    type: parmi(TYPES_BIEN, bien.type),
    statut: parmi(STATUTS_BIEN, bien.statut) || 'repere',
    prix: texteNombre(bien.prix),
    // Sans espace entre les milliers : le champ reste facile à corriger.
    surface: texteDecimal(bien.surface).replace(/\s/g, ''),
    pieces: texteNombre(bien.pieces),
    chambres: texteNombre(bien.chambres),
    annee_construction: texteNombre(bien.annee_construction),
    etat: parmi(ETATS_BIEN, bien.etat),
    description: bien.description,
    dpe_classe: parmi(CLASSES_ENERGIE, bien.dpe_classe),
    dpe_valeur: texteNombre(bien.dpe_valeur),
    dpe_date: bien.dpe_date ?? '',
    ges_classe: parmi(CLASSES_ENERGIE, bien.ges_classe),
    ges_valeur: texteNombre(bien.ges_valeur),
    ges_date: bien.ges_date ?? '',
    copropriete: texteOuiNon(bien.copropriete),
    charges_annuelles: texteNombre(bien.charges_annuelles),
    taxe_fonciere: texteNombre(bien.taxe_fonciere),
    programme: bien.programme,
    lot: bien.lot,
    date_livraison: bien.date_livraison ?? '',
    viager_bouquet: texteNombre(bien.viager_bouquet),
    viager_rente: texteNombre(bien.viager_rente),
    viager_occupation: parmi(OCCUPATIONS_VIAGER, bien.viager_occupation),
    viager_ages: bien.viager_ages.join(', '),
    commerce_nature: parmi(NATURES_COMMERCE, bien.commerce_nature),
    commerce_bail: bien.commerce_bail,
    commerce_loyer: texteNombre(bien.commerce_loyer),
    commerce_activite: bien.commerce_activite,
    surface_terrain: texteDecimal(bien.surface_terrain).replace(/\s/g, ''),
    constructible: texteOuiNon(bien.constructible),
    viabilise: texteOuiNon(bien.viabilise),
  }
}

/** Messages d'erreur du formulaire, champ par champ. */
export type ErreursBien = Partial<Record<keyof BrouillonBien, string>>

export type PreparationBien =
  { ok: true; valeurs: ValeursBien } | { ok: false; erreurs: ErreursBien }

/** Plus grand montant accepté par la base (colonne de type entier). */
const MONTANT_MAX = 2_000_000_000

/** Lit un étage : un nombre entier, « RDC » pour le rez-de-chaussée, négatif pour un sous-sol. */
export function lireEtage(saisie: string): number | null | 'invalide' {
  const texte = saisie.trim().toLowerCase()
  if (texte === '') return null
  if (texte === 'rdc' || texte === 'rez-de-chaussée' || texte === 'rez-de-chaussee') return 0
  if (!/^-?\d{1,3}$/.test(texte)) return 'invalide'
  const etage = Number(texte)
  return etage < -5 || etage > 200 ? 'invalide' : etage
}

/** Lit les âges des crédirentiers : « 82 et 79 », « 82, 79 ans ». */
export function lireAges(saisie: string): number[] | 'invalide' {
  if (saisie.trim() === '') return []
  if (!/^[\d\s,;/.]*(?:(?:et|ans?)[\d\s,;/.]*)*$/i.test(saisie.trim())) return 'invalide'
  const ages = (saisie.match(/\d+/g) ?? []).map(Number)
  const plausibles = ages.every((age) => age >= 18 && age <= 130)
  return ages.length === 0 || ages.length > MAX_CREDIRENTIERS || !plausibles ? 'invalide' : ages
}

/**
 * Vérifie le formulaire et prépare les valeurs à enregistrer. Seuls l'adresse et le type
 * sont obligatoires : tout le reste se complète plus tard. Les champs qui ne concernent pas
 * le type choisi sont vidés, même s'ils avaient été remplis avant un changement de type.
 */
export function preparerBien(
  brouillon: BrouillonBien,
  aujourdhui: string = dateDuJour(),
): PreparationBien {
  const erreurs: ErreursBien = {}
  const type = brouillon.type
  const utilise = (champ: ChampSelonType) => type !== '' && champUtilise(type, champ)

  if (brouillon.adresse.trim() === '') erreurs.adresse = "Indiquez l'adresse du bien."
  if (type === '') erreurs.type = 'Choisissez le type de bien.'

  /** Un nombre facultatif, borné ; `null` si le champ est vide ou ne concerne pas ce type. */
  function nombre(
    champ: keyof BrouillonBien & string,
    regles: { utilise?: boolean; decimales?: number; min?: number; max: number; message: string },
  ): number | null {
    if (regles.utilise === false) return null
    const saisie = brouillon[champ]
    const valeur = lireNombre(saisie, regles.decimales)
    if (valeur === null) return null
    if (valeur === 'invalide' || valeur < (regles.min ?? 0) || valeur > regles.max) {
      erreurs[champ] = regles.message
      return null
    }
    return valeur
  }
  const montant = (champ: keyof BrouillonBien & string, concerne = true) =>
    nombre(champ, {
      utilise: concerne,
      max: MONTANT_MAX,
      message: 'Indiquez un montant en euros, en chiffres, sans centimes.',
    })
  const texte = (champ: ChampSelonType & keyof typeof LONGUEURS_MAX_BIEN) =>
    utilise(champ) ? brouillon[champ].trim() : ''
  const choix = <V extends string>(champ: ChampSelonType, valeur: V | ''): V | null =>
    utilise(champ) && valeur !== '' ? valeur : null
  const ouiNon = (champ: ChampSelonType, valeur: OuiNon | '') =>
    utilise(champ) && valeur !== '' ? valeur === 'oui' : null
  function date(champ: 'dpe_date' | 'ges_date' | 'date_livraison', passee: boolean) {
    const saisie = brouillon[champ]
    if (!utilise(champ) || saisie === '') return null
    if (!estDateValide(saisie)) erreurs[champ] = "Cette date n'est pas reconnue."
    else if (passee && saisie > aujourdhui) erreurs[champ] = 'Cette date est dans le futur.'
    return saisie
  }

  let etage: number | null = null
  if (utilise('etage')) {
    const lu = lireEtage(brouillon.etage)
    if (lu === 'invalide') {
      erreurs.etage = "Indiquez l'étage en chiffres : 0 pour le rez-de-chaussée, 3 pour le 3e."
    } else etage = lu
  }

  let ages: number[] = []
  if (utilise('viager_ages')) {
    const lus = lireAges(brouillon.viager_ages)
    if (lus === 'invalide') {
      erreurs.viager_ages = `Indiquez les âges en chiffres, séparés par une virgule (${MAX_CREDIRENTIERS} au plus). Exemple : 82, 79.`
    } else ages = lus
  }

  const surface = (champ: 'surface' | 'surface_terrain', max: number) =>
    nombre(champ, {
      utilise: utilise(champ),
      decimales: 2,
      min: 0.01,
      max,
      message: 'Indiquez une surface en m², en chiffres. Exemple : 85,5.',
    })
  const compte = (champ: 'pieces' | 'chambres') =>
    nombre(champ, { utilise: utilise(champ), max: 99, message: 'Indiquez un nombre entier.' })
  const mesure = (champ: 'dpe_valeur' | 'ges_valeur') =>
    nombre(champ, {
      utilise: utilise(champ),
      max: 100000,
      message: 'Indiquez la valeur en chiffres, sans décimale.',
    })

  const valeurs: ValeursBien = {
    adresse: brouillon.adresse.trim(),
    complement: brouillon.complement.trim(),
    etage,
    code_postal: brouillon.code_postal.trim(),
    ville: brouillon.ville.trim(),
    type,
    statut: brouillon.statut,
    prix: montant('prix'),
    surface: surface('surface', 9_999_999),
    pieces: compte('pieces'),
    chambres: compte('chambres'),
    annee_construction: nombre('annee_construction', {
      utilise: utilise('annee_construction'),
      min: 1000,
      max: 2200,
      message: "Indiquez l'année sur quatre chiffres. Exemple : 1975.",
    }),
    etat: choix('etat', brouillon.etat),
    description: brouillon.description.trim(),
    dpe_classe: choix('dpe_classe', brouillon.dpe_classe),
    dpe_valeur: mesure('dpe_valeur'),
    dpe_date: date('dpe_date', true),
    ges_classe: choix('ges_classe', brouillon.ges_classe),
    ges_valeur: mesure('ges_valeur'),
    ges_date: date('ges_date', true),
    copropriete: ouiNon('copropriete', brouillon.copropriete),
    charges_annuelles: montant('charges_annuelles', utilise('charges_annuelles')),
    taxe_fonciere: montant('taxe_fonciere', utilise('taxe_fonciere')),
    programme: texte('programme'),
    lot: texte('lot'),
    date_livraison: date('date_livraison', false),
    viager_bouquet: montant('viager_bouquet', utilise('viager_bouquet')),
    viager_rente: montant('viager_rente', utilise('viager_rente')),
    viager_occupation: choix('viager_occupation', brouillon.viager_occupation),
    viager_ages: ages,
    commerce_nature: choix('commerce_nature', brouillon.commerce_nature),
    commerce_bail: texte('commerce_bail'),
    commerce_loyer: montant('commerce_loyer', utilise('commerce_loyer')),
    commerce_activite: texte('commerce_activite'),
    surface_terrain: surface('surface_terrain', 999_999_999),
    constructible: ouiNon('constructible', brouillon.constructible),
    viabilise: ouiNon('viabilise', brouillon.viabilise),
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  return { ok: true, valeurs }
}

/** Nombre de fiches lues à la fois dans la liste. */
export const TAILLE_PAGE_BIENS = 50

export type OptionsRechercheBiens = {
  /** Conditions calculées par `conditionsBiens` (recherche et filtres). */
  conditions?: readonly Filtre<'biens'>[]
  /** Les fiches archivées au lieu des actives. */
  archives?: boolean
  debut?: number
  taille?: number
  compter?: boolean
}

/**
 * Lit une page de biens, les plus récemment créés d'abord. La recherche, les filtres et le
 * tri sont faits par la base : l'application ne charge jamais toute la table.
 */
export function chercherBiens(
  client: SupabaseClient,
  options: OptionsRechercheBiens = {},
): Promise<Resultat<PageLignes<Bien>>> {
  return listerPage(client, 'biens', {
    archives: options.archives === true ? 'seulement' : 'sans',
    filtres: options.conditions,
    // `id` départage deux biens créés au même instant : l'ordre reste le même d'une page à l'autre.
    tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
    debut: options.debut ?? 0,
    taille: options.taille ?? TAILLE_PAGE_BIENS,
    compter: options.compter,
  })
}

export function lireBien(client: SupabaseClient, id: string): Promise<Resultat<Bien>> {
  return lire(client, 'biens', id)
}

export function creerBien(client: SupabaseClient, valeurs: ValeursBien): Promise<Resultat<Bien>> {
  return creer(client, 'biens', valeurs)
}

export function modifierBien(
  client: SupabaseClient,
  id: string,
  valeurs: ValeursBien,
): Promise<Resultat<Bien>> {
  return modifier(client, 'biens', id, valeurs)
}

/** Archive la fiche : elle quitte la liste, reste consultable et peut être restaurée. */
export function archiverBien(client: SupabaseClient, id: string): Promise<Resultat<Bien>> {
  return archiver(client, 'biens', id)
}

export function restaurerBien(client: SupabaseClient, id: string): Promise<Resultat<Bien>> {
  return restaurer(client, 'biens', id)
}

/**
 * L'historique des prix d'un bien, le plus récent d'abord (200 au plus). La base y ajoute
 * une ligne à chaque changement de prix : l'application n'y écrit jamais.
 */
export async function listerPrixBien(
  client: SupabaseClient,
  bienId: string,
): Promise<Resultat<PrixBien[]>> {
  const resultat = await listerPage(client, 'biens_prix', {
    filtres: [{ colonne: 'bien_id', genre: 'egal', valeur: bienId }],
    tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
    debut: 0,
    taille: 200,
  })
  if (!resultat.ok) return resultat
  return { ok: true, donnees: resultat.donnees.lignes }
}

/** Écart entre un prix et le précédent : « − 10 000 € (− 4 %) » ; vide pour le premier prix. */
export function evolutionPrix(prix: number, precedent: number | null): string {
  if (precedent === null || precedent === prix) return ''
  const ecart = prix - precedent
  const signe = ecart > 0 ? '+' : '−'
  const montant = `${signe} ${formaterPrix(Math.abs(ecart))}`
  if (precedent === 0) return montant
  const pourcent = Math.abs((ecart / precedent) * 100)
  return `${montant} (${signe} ${formaterDecimal(Math.round(pourcent * 10) / 10)} %)`
}
