import type { SupabaseClient } from '@supabase/supabase-js'
import { appeler, type Resultat } from '../../lib/donnees'
import { formaterDate } from '../../lib/dates'
import {
  adresseComplete,
  libelleSource,
  libelleTemperature,
  LONGUEURS_MAX,
  MAX_COURRIELS,
  MAX_ETIQUETTES,
  MAX_TELEPHONES,
  nomAvecCivilite,
  nomComplet,
  ROLES,
  type Contact,
  type ValeursContact,
} from './contacts'
import { formaterTelephone } from './telephone'

/**
 * Fusion de deux fiches qui désignent la même personne. Une fiche est gardée, l'autre est
 * absorbée puis archivée. Règle : aucune information ne se perd.
 *   - Téléphones, courriels, rôles et étiquettes sont réunis.
 *   - Là où les deux fiches se contredisent (nom, adresse, source, température),
 *     l'utilisateur choisit ; la valeur écartée est recopiée dans les notes.
 *   - Les notes des deux fiches sont mises bout à bout.
 */

/** Les rubriques sur lesquelles deux fiches peuvent se contredire. */
export type BlocFusion = 'identite' | 'adresse' | 'source' | 'temperature'

export const BLOCS_FUSION: readonly { bloc: BlocFusion; libelle: string }[] = [
  { bloc: 'identite', libelle: 'Nom' },
  { bloc: 'adresse', libelle: 'Adresse' },
  { bloc: 'source', libelle: 'Source' },
  { bloc: 'temperature', libelle: 'Température' },
]

/** Pour chaque rubrique en conflit : la fiche dont on garde la valeur. */
export type ChoixFusion = Partial<Record<BlocFusion, 'garde' | 'absorbe'>>

/** Ce que vaut une rubrique sur une fiche, en clair ; vide si elle n'est pas renseignée. */
export function valeurBloc(contact: Contact, bloc: BlocFusion): string {
  if (bloc === 'identite') return nomAvecCivilite(contact)
  if (bloc === 'adresse') return adresseComplete(contact)
  if (bloc === 'temperature') return libelleTemperature(contact.temperature) ?? ''
  const source = libelleSource(contact.source)
  if (source === null) return ''
  return contact.source_detail === '' ? source : `${source} (${contact.source_detail})`
}

/** Les rubriques renseignées différemment sur les deux fiches : il faut choisir. */
export function conflitsFusion(garde: Contact, absorbe: Contact): BlocFusion[] {
  return BLOCS_FUSION.map(({ bloc }) => bloc).filter((bloc) => {
    const a = valeurBloc(garde, bloc)
    const b = valeurBloc(absorbe, bloc)
    return a !== '' && b !== '' && a !== b
  })
}

const MEME_TEXTE = new Intl.Collator('fr', { sensitivity: 'base' })

function reunir(a: readonly string[], b: readonly string[]): string[] {
  return [...a, ...b.filter((valeur) => !a.includes(valeur))]
}

export type PreparationFusion =
  { ok: true; valeurs: ValeursContact } | { ok: false; message: string }

/**
 * Calcule la fiche qui résulte de la fusion. `choix` tranche les rubriques en conflit
 * (par défaut : la fiche gardée l'emporte). `date` est inscrite dans les notes.
 */
export function preparerFusion(
  garde: Contact,
  absorbe: Contact,
  choix: ChoixFusion = {},
  date: Date = new Date(),
): PreparationFusion {
  const ecartes: string[] = []

  /** La fiche qui fournit une rubrique ; note la valeur de l'autre si elle est écartée. */
  function retenir(bloc: BlocFusion, libelle: string): Contact {
    const a = valeurBloc(garde, bloc)
    const b = valeurBloc(absorbe, bloc)
    if (a === '' || b === '' || a === b) return a === '' && b !== '' ? absorbe : garde
    const retenue = choix[bloc] === 'absorbe' ? absorbe : garde
    ecartes.push(`${libelle} : ${retenue === garde ? b : a}`)
    return retenue
  }

  const identite = retenir('identite', 'Autre nom')
  const autreIdentite = identite === garde ? absorbe : garde
  const adresse = retenir('adresse', 'Autre adresse')
  const source = retenir('source', 'Autre source')
  const temperature = retenir('temperature', 'Autre température')

  const telephones = reunir(garde.telephones, absorbe.telephones)
  const courriels = reunir(garde.courriels, absorbe.courriels)
  if (telephones.length > MAX_TELEPHONES) {
    const enTrop = telephones.slice(MAX_TELEPHONES).map(formaterTelephone)
    ecartes.push(`Autres téléphones : ${enTrop.join(', ')}`)
  }
  if (courriels.length > MAX_COURRIELS) {
    ecartes.push(`Autres courriels : ${courriels.slice(MAX_COURRIELS).join(', ')}`)
  }
  // « Investisseur » et « investisseur » sont la même étiquette.
  const toutesEtiquettes = [...garde.etiquettes, ...absorbe.etiquettes].reduce<string[]>(
    (liste, etiquette) =>
      liste.some((connue) => MEME_TEXTE.compare(connue, etiquette) === 0)
        ? liste
        : [...liste, etiquette],
    [],
  )
  if (toutesEtiquettes.length > MAX_ETIQUETTES) {
    ecartes.push(`Autres étiquettes : ${toutesEtiquettes.slice(MAX_ETIQUETTES).join(', ')}`)
  }

  const tousRoles = reunir(garde.roles, absorbe.roles)
  const roles = [
    ...ROLES.map((role) => role.valeur).filter((role) => tousRoles.includes(role)),
    ...tousRoles.filter((role) => !ROLES.some((option) => option.valeur === role)),
  ]

  const morceaux = [garde.notes]
  if (absorbe.notes !== '' && absorbe.notes !== garde.notes) morceaux.push(absorbe.notes)
  if (ecartes.length > 0) {
    morceaux.push(
      [
        `Fusion du ${formaterDate(date.toISOString())} avec la fiche « ${nomComplet(absorbe)} » :`,
        ...ecartes,
      ].join('\n'),
    )
  }
  const notes = morceaux.filter((morceau) => morceau !== '').join('\n\n')
  if (notes.length > LONGUEURS_MAX.notes) {
    return {
      ok: false,
      message: `Les notes réunies dépasseraient ${LONGUEURS_MAX.notes} caractères. Raccourcissez les notes de l'une des deux fiches, puis recommencez.`,
    }
  }

  // Une fiche ne peut être recommandée ni par elle-même, ni par celle qu'elle absorbe.
  const recommandePar =
    source.recommande_par_id === garde.id || source.recommande_par_id === absorbe.id
      ? null
      : source.recommande_par_id

  return {
    ok: true,
    valeurs: {
      type: identite.type,
      // Ce que la fiche retenue ne précise pas est complété par l'autre.
      civilite:
        identite.civilite ?? (identite.type === autreIdentite.type ? autreIdentite.civilite : null),
      prenom: identite.prenom,
      nom: identite.nom,
      raison_sociale: identite.raison_sociale,
      telephones: telephones.slice(0, MAX_TELEPHONES),
      courriels: courriels.slice(0, MAX_COURRIELS),
      adresse: adresse.adresse,
      code_postal: adresse.code_postal,
      ville: adresse.ville,
      notes,
      roles,
      etiquettes: toutesEtiquettes.slice(0, MAX_ETIQUETTES),
      source: source.source,
      source_detail: source.source_detail,
      recommande_par_id: recommandePar,
      temperature: temperature.temperature,
    },
  }
}

/**
 * Fusionne deux fiches dans la base, en une seule opération : la fiche gardée reçoit les
 * valeurs réunies, l'autre est archivée et renvoie vers elle. Renvoie la fiche gardée.
 */
export function fusionnerContacts(
  client: SupabaseClient,
  gardeId: string,
  absorbeId: string,
  valeurs: ValeursContact,
): Promise<Resultat<Contact>> {
  return appeler(client, 'fusionner_contacts', {
    p_garde: gardeId,
    p_absorbe: absorbeId,
    p_valeurs: valeurs,
  })
}
