/**
 * Parcours d'une liste depuis une fiche : « 12 sur 48 », fiche précédente ou suivante, dans
 * l'ordre et avec la recherche et les filtres où la liste a été laissée. Commun aux contacts
 * (étape D.5), aux biens et aux colonnes des pipelines (étape D.7).
 *
 * La liste garde, pour l'onglet du navigateur, la recherche en cours (`cle`, celle de
 * `useListeContacts` ou `useListeBiens` ; l'étape pour une colonne de pipeline), son nombre
 * de fiches et les identifiants déjà lus, rang par rang. Un lien de la liste vers une fiche
 * porte cette `cle` dans l'historique du navigateur (`state`) : une fiche ouverte d'ailleurs
 * (recherche, Aujourd'hui, lien gardé) n'en a pas, et n'affiche donc pas les flèches. Une
 * liste lue page par page n'est jamais complète au-delà des pages chargées : la fiche lit la
 * suite quand elle en a besoin.
 */

/** Les listes qu'on parcourt ; chacune a sa mémoire. */
export type DomaineParcours = 'contacts' | 'biens' | 'projets-vendeurs' | 'projets-acquereurs'

export type Parcours = {
  /** La recherche et les filtres de la liste (`JSON` des conditions et des archives). */
  cle: string
  /** Nombre de fiches de la liste. */
  total: number
  /** Les identifiants connus, à leur rang ; `null` : pas encore lu. */
  ids: (string | null)[]
}

/** Ce qu'un lien de la liste vers une fiche range dans l'historique du navigateur. */
export type EtatParcours = { parcours: string }

/** La `cle` portée par l'historique (`location.state`), ou `null` pour une fiche ouverte d'ailleurs. */
export function cleDeLEtat(etat: unknown): string | null {
  if (typeof etat !== 'object' || etat === null || !('parcours' in etat)) return null
  const cle = (etat as { parcours: unknown }).parcours
  return typeof cle === 'string' && cle !== '' ? cle : null
}

/** Le rang de la fiche dans la liste (0 pour la première), ou `null` si elle n'y est pas. */
export function rangDans(parcours: Parcours, id: string): number | null {
  const rang = parcours.ids.indexOf(id)
  return rang === -1 || rang >= parcours.total ? null : rang
}

/** « 12 sur 48 ». */
export function libellePosition(rang: number, total: number): string {
  return `${rang + 1} sur ${total}`
}

/** Le rang voisin dans ce sens, ou `null` au bout de la liste. */
export function rangVoisin(parcours: Parcours, rang: number, sens: 1 | -1): number | null {
  const voisin = rang + sens
  return voisin < 0 || voisin >= parcours.total ? null : voisin
}

/** Ajoute des identifiants lus à partir du rang `debut` (une page lue depuis la fiche). */
export function noterIds(parcours: Parcours, debut: number, ids: readonly string[]): Parcours {
  const suivants = [...parcours.ids]
  ids.forEach((id, decalage) => {
    suivants[debut + decalage] = id
  })
  // Un rang sauté reste « pas encore lu ».
  return { ...parcours, ids: Array.from(suivants, (id) => id ?? null) }
}

/**
 * La liste relue (retour sur la page Contacts) : ses premières fiches remplacent les
 * anciennes. Pour la même recherche et le même nombre de fiches, les rangs lus plus loin
 * depuis une fiche sont gardés.
 */
export function fusionnerParcours(ancien: Parcours | null, nouveau: Parcours): Parcours {
  if (ancien === null || ancien.cle !== nouveau.cle || ancien.total !== nouveau.total) {
    return nouveau
  }
  return noterIds(
    ancien,
    0,
    nouveau.ids.filter((id): id is string => id !== null),
  )
}

/** Relit un parcours gardé. Tout ce qui est illisible donne `null`. */
export function lireParcours(brut: string | null): Parcours | null {
  if (brut === null) return null
  let lu: unknown
  try {
    lu = JSON.parse(brut)
  } catch {
    return null
  }
  if (typeof lu !== 'object' || lu === null) return null
  const { cle, total, ids } = lu as Record<string, unknown>
  if (typeof cle !== 'string' || typeof total !== 'number' || !Number.isInteger(total)) {
    return null
  }
  if (total < 0 || !Array.isArray(ids)) return null
  if (!ids.every((id) => id === null || typeof id === 'string')) return null
  return { cle, total, ids: ids as (string | null)[] }
}

/** Nombre de parcours gardés par liste (les colonnes d'un pipeline en font plusieurs). */
export const PARCOURS_GARDES = 10

/** Relit les parcours gardés pour une liste. Ce qui est illisible est écarté. */
export function lireListeParcours(brut: string | null): Parcours[] {
  if (brut === null) return []
  let lu: unknown
  try {
    lu = JSON.parse(brut)
  } catch {
    return []
  }
  if (!Array.isArray(lu)) return []
  return lu.flatMap((element) => {
    const parcours = lireParcours(JSON.stringify(element))
    return parcours === null ? [] : [parcours]
  })
}

/**
 * Range un parcours en tête des parcours gardés : il remplace celui de la même recherche
 * (fusionné avec lui si `fusionner`), et les plus anciens au-delà de `PARCOURS_GARDES`
 * sont oubliés.
 */
export function rangerParcours(
  liste: readonly Parcours[],
  parcours: Parcours,
  fusionner: boolean,
): Parcours[] {
  const ancien = liste.find((garde) => garde.cle === parcours.cle) ?? null
  const range = fusionner ? fusionnerParcours(ancien, parcours) : parcours
  return [range, ...liste.filter((garde) => garde.cle !== parcours.cle)].slice(0, PARCOURS_GARDES)
}

const cleMemoire = (domaine: DomaineParcours) => `immocrm.parcours.${domaine}`

function lireMemoire(domaine: DomaineParcours): Parcours[] {
  return lireListeParcours(window.sessionStorage.getItem(cleMemoire(domaine)))
}

function ecrireMemoire(domaine: DomaineParcours, liste: Parcours[]): void {
  window.sessionStorage.setItem(cleMemoire(domaine), JSON.stringify(liste))
}

/** Le parcours gardé pour cette recherche, ou `null` (autre recherche, rien de gardé). */
export function parcoursMemorise(domaine: DomaineParcours, cle: string): Parcours | null {
  try {
    return lireMemoire(domaine).find((parcours) => parcours.cle === cle) ?? null
  } catch {
    // Mémoire du navigateur indisponible : pas de flèches, la fiche reste utilisable.
    return null
  }
}

/** Garde le parcours jusqu'à la fermeture de l'onglet (la liste vient d'être lue). */
export function memoriserParcours(domaine: DomaineParcours, parcours: Parcours): void {
  try {
    ecrireMemoire(domaine, rangerParcours(lireMemoire(domaine), parcours, true))
  } catch {
    // Sans mémoire, les flèches n'apparaissent simplement pas.
  }
}

/** Remplace le parcours gardé (après une lecture faite depuis la fiche). */
export function remplacerParcours(domaine: DomaineParcours, parcours: Parcours): void {
  try {
    ecrireMemoire(domaine, rangerParcours(lireMemoire(domaine), parcours, false))
  } catch {
    // Sans mémoire, la fiche suivante n'aura pas de flèches.
  }
}
