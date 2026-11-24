import { adresseBien, type Bien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import { libelleJour, type Vue } from './echeances'
import { horaireTache, libelleCategorie, type Tache } from './taches'

/**
 * Ce qu'une ligne de tâche écrit sous son titre (étape E.3) : une seule ligne de détail, où
 * rien ne se répète. Règle 4 de la revue de design : une information n'est écrite qu'une
 * fois par écran.
 */

/**
 * Le jour que dit déjà l'onglet affiché : celui d'« Aujourd'hui ». Les autres vues couvrent
 * plusieurs jours (« En retard », « Cette semaine »…) : chaque ligne garde le sien.
 */
export function jourDeLaVue(vue: Vue | undefined, aujourdhui: string): string | null {
  return vue === 'aujourdhui' ? aujourdhui : null
}

/**
 * Le jour à écrire sur la ligne (« Hier », « Demain », « mer. 18 nov. »), ou rien quand
 * c'est celui de l'onglet affiché (`jourMasque`).
 */
export function jourAffiche(
  echeance: string,
  aujourdhui: string,
  jourMasque: string | null,
): string | null {
  return echeance === jourMasque ? null : libelleJour(echeance, aujourdhui)
}

/**
 * Une seule adresse : le lieu de la tâche s'il est rempli, sinon celle du bien lié (sauf sur
 * la fiche de ce bien, qui l'affiche déjà). Rien si aucune des deux.
 */
export function adresseUnique(
  lieu: string,
  bien: Pick<Bien, 'adresse' | 'complement' | 'code_postal' | 'ville'> | null,
  masquerBien: boolean,
): string | null {
  const propre = lieu.trim()
  if (propre !== '') return propre
  if (bien === null || masquerBien) return null
  const adresse = adresseBien(bien)
  return adresse === '' ? null : adresse
}

export type DetailLigneTache = {
  /** Le jour, s'il diffère de l'onglet (en rouge quand la tâche est en retard). */
  jour: string | null
  enRetard: boolean
  /** L'heure (« 14 h – 15 h »), écrite en gras ; vide sans heure. */
  horaire: string
  /** Le reste, dans l'ordre : le contact, l'adresse ; la catégorie s'il n'y a ni l'un ni l'autre. */
  autres: string[]
}

/** La ligne de détail d'une tâche, morceau par morceau. */
export function detailLigneTache(
  affichee: {
    tache: Pick<Tache, 'echeance' | 'heure' | 'duree' | 'lieu' | 'categorie' | 'etat'>
    contact: Parameters<typeof nomComplet>[0] | null
    bien: Pick<Bien, 'adresse' | 'complement' | 'code_postal' | 'ville'> | null
  },
  options: {
    aujourdhui: string
    /** Le jour que dit déjà l'onglet (`jourDeLaVue`). */
    jourMasque?: string | null
    /** Le lien que la fiche affichée montre déjà. */
    masquer?: 'contact' | 'bien'
  },
): DetailLigneTache {
  const { tache, contact, bien } = affichee
  const { aujourdhui, jourMasque = null, masquer } = options
  const contactAffiche = contact === null || masquer === 'contact' ? null : nomComplet(contact)
  const adresse = adresseUnique(tache.lieu, bien, masquer === 'bien')
  const autres = [contactAffiche, adresse].filter((morceau) => morceau !== null)
  return {
    jour: jourAffiche(tache.echeance, aujourdhui, jourMasque),
    enRetard: tache.etat === 'a_faire' && tache.echeance < aujourdhui,
    horaire: horaireTache(tache),
    autres: autres.length > 0 ? autres : [libelleCategorie(tache.categorie)],
  }
}
