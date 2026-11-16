import type { SupabaseClient } from '@supabase/supabase-js'
import {
  archiver,
  creer,
  lire,
  lister,
  modifier,
  restaurer,
  type Creation,
  type Ligne,
  type Resultat,
} from '../../lib/donnees'
import { analyserTelephone, formaterTelephone } from './telephone'

/**
 * Contacts : une personne ou une société. Règle du cadrage : une personne et son projet
 * sont deux choses distinctes, la fiche ne porte donc aucune étape de pipeline.
 */

/** Un contact tel qu'il est lu dans la base. */
export type Contact = Ligne<'contacts'>

/** Valeurs envoyées à la base pour créer ou modifier un contact. */
export type ValeursContact = Creation<'contacts'>

export type TypeContact = 'personne' | 'societe'
export type Civilite = 'm' | 'mme'
export type Role = 'vendeur' | 'acquereur' | 'notaire' | 'prescripteur' | 'autre'
export type Source =
  | 'pige'
  | 'porte_a_porte'
  | 'boitage'
  | 'recommandation'
  | 'demande_entrante'
  | 'reseaux_sociaux_site'
  | 'sphere_personnelle'
export type Temperature = 'chaud' | 'tiede' | 'froid' | 'veille'

type Option<V extends string> = { valeur: V; libelle: string }

export const TYPES_CONTACT: readonly Option<TypeContact>[] = [
  { valeur: 'personne', libelle: 'Personne' },
  { valeur: 'societe', libelle: 'Société' },
]

export const CIVILITES: readonly Option<Civilite>[] = [
  { valeur: 'mme', libelle: 'Mme' },
  { valeur: 'm', libelle: 'M.' },
]

export const ROLES: readonly Option<Role>[] = [
  { valeur: 'vendeur', libelle: 'Vendeur' },
  { valeur: 'acquereur', libelle: 'Acquéreur' },
  { valeur: 'notaire', libelle: 'Notaire' },
  { valeur: 'prescripteur', libelle: 'Prescripteur' },
  { valeur: 'autre', libelle: 'Autre' },
]

/** Les sept sources du cadrage, avec ce qu'on attend dans « détail de la source ». */
export const SOURCES: readonly (Option<Source> & { aideDetail: string })[] = [
  { valeur: 'pige', libelle: 'Pige', aideDetail: "L'annonce, son prix, le site où elle a paru." },
  { valeur: 'porte_a_porte', libelle: 'Porte-à-porte', aideDetail: 'La rue et le numéro.' },
  { valeur: 'boitage', libelle: 'Boitage', aideDetail: 'La zone et le support distribué.' },
  {
    valeur: 'recommandation',
    libelle: 'Recommandation',
    aideDetail: 'Le contexte de la recommandation.',
  },
  {
    valeur: 'demande_entrante',
    libelle: 'Demande entrante',
    aideDetail: "Le portail d'origine et le bien concerné.",
  },
  {
    valeur: 'reseaux_sociaux_site',
    libelle: 'Réseaux sociaux et site',
    aideDetail: "La publication ou le formulaire d'origine.",
  },
  {
    valeur: 'sphere_personnelle',
    libelle: 'Sphère personnelle',
    aideDetail: 'Le lien : famille, ami, ancien client…',
  },
]

export const TEMPERATURES: readonly (Option<Temperature> & { detail: string })[] = [
  { valeur: 'chaud', libelle: 'Chaud', detail: 'projet dans les 3 mois' },
  { valeur: 'tiede', libelle: 'Tiède', detail: 'projet dans les 3 à 12 mois' },
  { valeur: 'froid', libelle: 'Froid', detail: 'projet lointain ou incertain' },
  { valeur: 'veille', libelle: 'Veille', detail: 'pas de projet déclaré' },
]

export const MAX_TELEPHONES = 5
export const MAX_COURRIELS = 5
export const MAX_ETIQUETTES = 20
export const LONGUEUR_MAX_ETIQUETTE = 30
export const LONGUEURS_MAX = {
  prenom: 80,
  nom: 80,
  raison_sociale: 120,
  adresse: 200,
  code_postal: 10,
  ville: 80,
  source_detail: 200,
  notes: 5000,
} as const

function libelleDe<V extends string>(options: readonly Option<V>[], valeur: string | null) {
  return options.find((option) => option.valeur === valeur)?.libelle ?? null
}

/** Libellés français des valeurs enregistrées ; `null` si la valeur est vide ou inconnue. */
export const libelleRole = (role: string) => libelleDe(ROLES, role) ?? role
export const libelleSource = (source: string | null) => libelleDe(SOURCES, source)
export const libelleTemperature = (temperature: string | null) =>
  libelleDe(TEMPERATURES, temperature)
export const libelleCivilite = (civilite: string | null) => libelleDe(CIVILITES, civilite)

type Identite = Pick<Contact, 'type' | 'civilite' | 'prenom' | 'nom' | 'raison_sociale'>

function assembler(...morceaux: (string | null)[]): string {
  return morceaux.filter((morceau) => morceau !== null && morceau !== '').join(' ')
}

/** Nom tel qu'on le dit : « Camille Fictif », ou la raison sociale pour une société. */
export function nomComplet(contact: Identite): string {
  if (contact.type === 'societe') return contact.raison_sociale
  return assembler(contact.prenom, contact.nom)
}

/** Nom avec la civilité, pour l'en-tête de la fiche : « Mme Camille Fictif ». */
export function nomAvecCivilite(contact: Identite): string {
  if (contact.type === 'societe') return contact.raison_sociale
  return assembler(libelleCivilite(contact.civilite), contact.prenom, contact.nom)
}

/** Nom tel qu'il est classé dans la liste : « Fictif Camille » (nom de famille d'abord). */
export function nomDeListe(contact: Identite): string {
  if (contact.type === 'societe') return contact.raison_sociale
  return assembler(contact.nom, contact.prenom)
}

/** Pour une société : la personne à joindre, si elle est renseignée. */
export function interlocuteur(contact: Identite): string {
  if (contact.type !== 'societe') return ''
  return assembler(libelleCivilite(contact.civilite), contact.prenom, contact.nom)
}

const ORDRE_FRANCAIS = new Intl.Collator('fr', { sensitivity: 'base', numeric: true })

/** Trie par nom, à la française : sans tenir compte des accents ni des majuscules. */
export function trierParNom<C extends Identite>(contacts: readonly C[]): C[] {
  return [...contacts].sort((a, b) => ORDRE_FRANCAIS.compare(nomDeListe(a), nomDeListe(b)))
}

/** Seconde ligne d'un contact dans la liste : son premier téléphone, puis ses rôles. */
export function resumeContact(contact: Contact): string | undefined {
  const morceaux = [
    contact.telephones[0] !== undefined ? formaterTelephone(contact.telephones[0]) : null,
    contact.roles.length > 0 ? contact.roles.map(libelleRole).join(', ') : null,
  ]
  return morceaux.filter((morceau) => morceau !== null).join(' · ') || undefined
}

/** Adresse postale sur une ligne ; vide si rien n'est renseigné. */
export function adresseComplete(contact: Pick<Contact, 'adresse' | 'code_postal' | 'ville'>) {
  const commune = assembler(contact.code_postal, contact.ville)
  return [contact.adresse, commune].filter((morceau) => morceau !== '').join(', ')
}

/** Vérifie une adresse de courriel. Renvoie un message, ou `null` si tout va bien. */
export function validerCourriel(saisie: string): string | null {
  const courriel = saisie.trim()
  if (courriel.length > 254 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(courriel)) {
    return "Cette adresse n'est pas reconnue. Exemple : prenom.nom@exemple.fr."
  }
  return null
}

/** Nettoie une étiquette saisie : espaces en trop retirés, longueur limitée. */
export function nettoyerEtiquette(saisie: string): string {
  return saisie.trim().replace(/\s+/g, ' ').slice(0, LONGUEUR_MAX_ETIQUETTE).trim()
}

/**
 * Ajoute une étiquette à la liste, sans doublon (« Investisseur » et « investisseur »
 * sont la même étiquette) et sans dépasser le nombre maximal.
 */
export function ajouterEtiquette(etiquettes: readonly string[], saisie: string): string[] {
  const etiquette = nettoyerEtiquette(saisie)
  const existe = etiquettes.some((e) => ORDRE_FRANCAIS.compare(e, etiquette) === 0)
  if (etiquette === '' || existe || etiquettes.length >= MAX_ETIQUETTES) return [...etiquettes]
  return [...etiquettes, etiquette]
}

/** Ce que contient le formulaire d'un contact : tout est du texte tant que rien n'est validé. */
export type BrouillonContact = {
  type: TypeContact
  civilite: Civilite | ''
  prenom: string
  nom: string
  raison_sociale: string
  telephones: string[]
  courriels: string[]
  adresse: string
  code_postal: string
  ville: string
  notes: string
  roles: Role[]
  etiquettes: string[]
  source: Source | ''
  source_detail: string
  recommande_par_id: string
  temperature: Temperature | ''
}

/** Formulaire vide, pour un nouveau contact. */
export function brouillonVide(): BrouillonContact {
  return {
    type: 'personne',
    civilite: '',
    prenom: '',
    nom: '',
    raison_sociale: '',
    telephones: [''],
    courriels: [''],
    adresse: '',
    code_postal: '',
    ville: '',
    notes: '',
    roles: [],
    etiquettes: [],
    source: '',
    source_detail: '',
    recommande_par_id: '',
    temperature: '',
  }
}

function parmi<V extends string>(options: readonly Option<V>[], valeur: string | null): V | '' {
  return options.find((option) => option.valeur === valeur)?.valeur ?? ''
}

/** Remplit le formulaire à partir d'une fiche existante. */
export function brouillonDepuis(contact: Contact): BrouillonContact {
  const telephones = contact.telephones.map(formaterTelephone)
  return {
    type: parmi(TYPES_CONTACT, contact.type) || 'personne',
    civilite: parmi(CIVILITES, contact.civilite),
    prenom: contact.prenom,
    nom: contact.nom,
    raison_sociale: contact.raison_sociale,
    telephones: telephones.length > 0 ? telephones : [''],
    courriels: contact.courriels.length > 0 ? [...contact.courriels] : [''],
    adresse: contact.adresse,
    code_postal: contact.code_postal,
    ville: contact.ville,
    notes: contact.notes,
    roles: ROLES.map((role) => role.valeur).filter((role) => contact.roles.includes(role)),
    etiquettes: [...contact.etiquettes],
    source: parmi(SOURCES, contact.source),
    source_detail: contact.source_detail,
    recommande_par_id: contact.recommande_par_id ?? '',
    temperature: parmi(TEMPERATURES, contact.temperature),
  }
}

/** Messages d'erreur du formulaire, champ par champ. */
export type ErreursContact = {
  nom?: string
  raison_sociale?: string
  /** Un message par ligne de téléphone en erreur (même rang que dans le brouillon). */
  telephones?: (string | undefined)[]
  courriels?: (string | undefined)[]
}

export type PreparationContact =
  { ok: true; valeurs: ValeursContact } | { ok: false; erreurs: ErreursContact }

/** Valide une liste de saisies, en ignorant les lignes vides et en retirant les répétitions. */
function preparerListe(
  saisies: readonly string[],
  convertir: (saisie: string) => { ok: true; valeur: string } | { ok: false; message: string },
) {
  const valeurs: string[] = []
  const erreurs: (string | undefined)[] = saisies.map(() => undefined)
  saisies.forEach((saisie, rang) => {
    if (saisie.trim() === '') return
    const resultat = convertir(saisie)
    if (!resultat.ok) erreurs[rang] = resultat.message
    else if (!valeurs.includes(resultat.valeur)) valeurs.push(resultat.valeur)
  })
  return { valeurs, erreurs: erreurs.some((e) => e !== undefined) ? erreurs : undefined }
}

/**
 * Vérifie le formulaire et prépare les valeurs à enregistrer : textes nettoyés, téléphones
 * au format international, lignes vides retirées. Seul le nom (ou la raison sociale) est
 * obligatoire : tout le reste se complète plus tard.
 */
export function preparerContact(brouillon: BrouillonContact): PreparationContact {
  const erreurs: ErreursContact = {}
  const societe = brouillon.type === 'societe'

  if (societe && brouillon.raison_sociale.trim() === '') {
    erreurs.raison_sociale = 'Indiquez le nom de la société.'
  }
  if (!societe && brouillon.nom.trim() === '') erreurs.nom = 'Indiquez au moins le nom.'

  const telephones = preparerListe(brouillon.telephones, (saisie) => {
    const analyse = analyserTelephone(saisie)
    return analyse.ok ? { ok: true, valeur: analyse.numero } : analyse
  })
  if (telephones.erreurs !== undefined) erreurs.telephones = telephones.erreurs

  const courriels = preparerListe(brouillon.courriels, (saisie) => {
    const message = validerCourriel(saisie)
    return message === null
      ? { ok: true, valeur: saisie.trim().toLowerCase() }
      : { ok: false, message }
  })
  if (courriels.erreurs !== undefined) erreurs.courriels = courriels.erreurs

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }

  const recommandation = brouillon.source === 'recommandation'
  return {
    ok: true,
    valeurs: {
      type: brouillon.type,
      civilite: brouillon.civilite === '' ? null : brouillon.civilite,
      prenom: brouillon.prenom.trim(),
      nom: brouillon.nom.trim(),
      // Une personne n'a pas de raison sociale : on ne garde pas un reste de saisie.
      raison_sociale: societe ? brouillon.raison_sociale.trim() : '',
      telephones: telephones.valeurs,
      courriels: courriels.valeurs,
      adresse: brouillon.adresse.trim(),
      code_postal: brouillon.code_postal.trim(),
      ville: brouillon.ville.trim(),
      notes: brouillon.notes.trim(),
      roles: [...brouillon.roles],
      etiquettes: brouillon.etiquettes.reduce<string[]>(ajouterEtiquette, []),
      source: brouillon.source === '' ? null : brouillon.source,
      source_detail: brouillon.source === '' ? '' : brouillon.source_detail.trim(),
      // « Recommandé par » n'a de sens que pour une recommandation.
      recommande_par_id:
        recommandation && brouillon.recommande_par_id !== '' ? brouillon.recommande_par_id : null,
      temperature: brouillon.temperature === '' ? null : brouillon.temperature,
    },
  }
}

/** Lit les contacts, triés par nom. `archives` : les fiches archivées au lieu des actives. */
export async function listerContacts(
  client: SupabaseClient,
  options: { archives?: boolean } = {},
): Promise<Resultat<Contact[]>> {
  const resultat = await lister(client, 'contacts', {
    archives: options.archives === true ? 'seulement' : 'sans',
    tri: { colonne: 'nom', croissant: true },
  })
  if (!resultat.ok) return resultat
  return { ok: true, donnees: trierParNom(resultat.donnees) }
}

export function lireContact(client: SupabaseClient, id: string): Promise<Resultat<Contact>> {
  return lire(client, 'contacts', id)
}

export function creerContact(
  client: SupabaseClient,
  valeurs: ValeursContact,
): Promise<Resultat<Contact>> {
  return creer(client, 'contacts', valeurs)
}

export function modifierContact(
  client: SupabaseClient,
  id: string,
  valeurs: ValeursContact,
): Promise<Resultat<Contact>> {
  return modifier(client, 'contacts', id, valeurs)
}

/** Archive la fiche : elle quitte la liste, reste consultable et peut être restaurée. */
export function archiverContact(client: SupabaseClient, id: string): Promise<Resultat<Contact>> {
  return archiver(client, 'contacts', id)
}

export function restaurerContact(client: SupabaseClient, id: string): Promise<Resultat<Contact>> {
  return restaurer(client, 'contacts', id)
}
