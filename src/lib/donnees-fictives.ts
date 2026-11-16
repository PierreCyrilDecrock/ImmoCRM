import type { SupabaseClient } from '@supabase/supabase-js'
import type { Resultat } from './donnees'
import type { Environnement } from './environnement'

/**
 * Données fictives pour le projet de test. Tout est inventé et reconnaissable au premier
 * coup d'œil : noms de famille factices, ville et code postal inexistants, numéros de
 * téléphone pris dans les tranches réservées aux fictions, courriels en « .invalid ».
 */

export type PersonneFictive = {
  prenom: string
  nom: string
  telephone: string
  courriel: string
  adresse: string
  codePostal: string
  ville: string
}

const PRENOMS = ['Camille', 'Dominique', 'Claude', 'Sacha', 'Alix', 'Maxence', 'Lou', 'Morgan']
const NOMS = ['Fictif', 'Exemple', 'Factice', 'Inventé', 'Spécimen', 'Postiche', 'Imaginaire']
const VOIES = [
  "rue de l'Exemple",
  'avenue du Test',
  'impasse Fictive',
  'place de la Démonstration',
  'chemin des Essais',
]

/** Ville et code postal qui n'existent pas. */
export const VILLE_FICTIVE = 'Villefictive'
export const CODE_POSTAL_FICTIF = '00000'

function choisir(liste: readonly string[], rang: number): string {
  return liste[rang % liste.length] ?? ''
}

/** Retire accents et majuscules, pour fabriquer une adresse de courriel. */
function simplifier(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Numéro de portable fictif : la tranche 06 39 98 est réservée aux œuvres de fiction,
 * aucun abonné ne peut la recevoir.
 */
export function telephoneFictif(rang: number): string {
  const fin = String(rang % 10000).padStart(4, '0')
  return `06 39 98 ${fin.slice(0, 2)} ${fin.slice(2)}`
}

/** Fabrique une personne fictive. Le même rang donne toujours la même personne. */
export function personneFictive(rang: number): PersonneFictive {
  const prenom = choisir(PRENOMS, rang)
  // Décalage pour que prénoms et noms ne tournent pas au même rythme.
  const nom = choisir(NOMS, rang + Math.floor(rang / PRENOMS.length))
  return {
    prenom,
    nom,
    telephone: telephoneFictif(rang),
    // Le domaine « .invalid » est réservé : aucun courriel ne peut y arriver.
    courriel: `${simplifier(prenom)}.${simplifier(nom)}${rang}@exemple.invalid`,
    adresse: `${(rang % 98) + 1} ${choisir(VOIES, rang)}`,
    codePostal: CODE_POSTAL_FICTIF,
    ville: VILLE_FICTIVE,
  }
}

/** Fabrique `nombre` personnes fictives, toujours les mêmes. */
export function personnesFictives(nombre: number): PersonneFictive[] {
  return Array.from({ length: nombre }, (_, rang) => personneFictive(rang))
}

/** Un lot de données fictives pour un domaine (contacts, biens…), ajouté à l'étape qui le crée. */
export type JeuFictif = {
  libelle: string
  /** Insère le lot et renvoie le nombre de lignes créées. */
  inserer: (client: SupabaseClient) => Promise<Resultat<number>>
}

/** Les lots disponibles. Vide tant qu'aucune table métier n'existe (premier lot : étape 1.1). */
export const JEUX_FICTIFS: readonly JeuFictif[] = []

export type BilanFictif = { ok: true; lignes: number } | { ok: false; message: string }

/**
 * Insère les lots de données fictives. Refuse d'agir ailleurs que sur le projet de test :
 * c'est le seul passage par lequel des données fictives entrent dans la base.
 */
export async function insererDonneesFictives(
  client: SupabaseClient,
  environnement: Environnement,
  jeux: readonly JeuFictif[] = JEUX_FICTIFS,
): Promise<BilanFictif> {
  if (environnement !== 'test') {
    return {
      ok: false,
      message: 'Les données fictives ne peuvent être ajoutées que sur le projet de test.',
    }
  }
  let lignes = 0
  for (const jeu of jeux) {
    const resultat = await jeu.inserer(client)
    if (!resultat.ok) {
      return { ok: false, message: `${jeu.libelle} : ${resultat.erreur.message}` }
    }
    lignes += resultat.donnees
  }
  return { ok: true, lignes }
}
