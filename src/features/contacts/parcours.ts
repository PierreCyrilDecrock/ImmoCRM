/**
 * Parcours de la liste des contacts depuis une fiche : « 12 sur 48 », contact précédent ou
 * suivant, dans l'ordre et avec la recherche et les filtres où la liste a été laissée.
 *
 * La liste garde, pour l'onglet du navigateur, la recherche en cours (`cle`, celle de
 * `useListeContacts`), son nombre de fiches et les identifiants déjà lus, rang par rang. Un
 * lien de la liste vers une fiche porte cette `cle` dans l'historique du navigateur (`state`) :
 * une fiche ouverte d'ailleurs (recherche, Aujourd'hui, lien gardé) n'en a pas, et n'affiche
 * donc pas les flèches. La liste lue n'est jamais complète au-delà des pages chargées : la
 * fiche lit la suite quand elle en a besoin.
 */

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

const CLE_MEMOIRE = 'immocrm.parcours-contacts'

/** Le parcours gardé pour cette recherche, ou `null` (autre recherche, rien de gardé). */
export function parcoursMemorise(cle: string): Parcours | null {
  try {
    const parcours = lireParcours(window.sessionStorage.getItem(CLE_MEMOIRE))
    return parcours !== null && parcours.cle === cle ? parcours : null
  } catch {
    // Mémoire du navigateur indisponible : pas de flèches, la fiche reste utilisable.
    return null
  }
}

/** Garde le parcours jusqu'à la fermeture de l'onglet. */
export function memoriserParcours(parcours: Parcours): void {
  try {
    const ancien = lireParcours(window.sessionStorage.getItem(CLE_MEMOIRE))
    window.sessionStorage.setItem(CLE_MEMOIRE, JSON.stringify(fusionnerParcours(ancien, parcours)))
  } catch {
    // Sans mémoire, les flèches n'apparaissent simplement pas.
  }
}

/** Remplace le parcours gardé (après une lecture faite depuis la fiche). */
export function remplacerParcours(parcours: Parcours): void {
  try {
    window.sessionStorage.setItem(CLE_MEMOIRE, JSON.stringify(parcours))
  } catch {
    // Sans mémoire, la fiche suivante n'aura pas de flèches.
  }
}
