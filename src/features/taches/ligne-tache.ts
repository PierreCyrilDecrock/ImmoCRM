import { adresseBien, type Bien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import { libelleJour, type Vue } from './echeances'
import { pastilleRetard } from './retards'
import { horaireTache, libelleCategorie, type Tache } from './taches'

/**
 * Ce qu'une ligne de tâche écrit sous son titre (étape E.3) : une seule ligne de détail, où
 * rien ne se répète. Règle 4 de la revue de design : une information n'est écrite qu'une
 * fois par écran.
 */

/**
 * Le jour que dit déjà l'onglet affiché : celui de la rubrique « Aujourd'hui » de l'onglet
 * « À faire ». Les autres vues couvrent plusieurs jours (« Semaine », « Plus tard »…) :
 * chaque ligne garde le sien.
 */
export function jourDeLaVue(vue: Vue | undefined, aujourdhui: string): string | null {
  return vue === 'a_faire' ? aujourdhui : null
}

/**
 * Le retard d'une tâche dit en durée, pour la rubrique « En retard » (étape F.1) : « Depuis
 * hier », « Depuis 6 j », et ce qu'entend un lecteur d'écran (« En retard de 6 jours »).
 * `null` pour une échéance du jour ou à venir.
 */
export function depuisRetard(
  echeance: string,
  aujourdhui: string,
): { texte: string; annonce: string } | null {
  const retard = pastilleRetard(echeance, aujourdhui)
  if (retard === null) return null
  return {
    texte: retard.jours === 1 ? 'Depuis hier' : `Depuis ${retard.texte}`,
    annonce: retard.annonce,
  }
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
  /**
   * Le jour, s'il diffère de l'onglet (en rouge quand la tâche est en retard) ; « Depuis
   * 6 j » avec `retardEnDuree`.
   */
  jour: string | null
  /** Ce qu'entend un lecteur d'écran à la place du jour, s'il diffère (« En retard de 6 jours »). */
  annonceJour: string | null
  enRetard: boolean
  /**
   * L'heure ouvre la ligne de détail, avant la priorité : quand le jour n'est pas écrit
   * (rubrique « Aujourd'hui ») et que la tâche a une heure.
   */
  heureEnTete: boolean
  /** Le retard en durée (« Depuis 6 j ») ouvre la ligne, avant la priorité : règle 11. */
  jourEnTete: boolean
  /** L'heure (« 14 h – 15 h »), écrite en gras ; vide sans heure. */
  horaire: string
  /**
   * Le reste, dans l'ordre : le contact (sauf s'il est déjà nommé dans le titre), l'adresse ;
   * s'il n'y a ni l'un ni l'autre, le motif, sinon la catégorie.
   */
  autres: string[]
}

/** La ligne de détail d'une tâche, morceau par morceau. */
export function detailLigneTache(
  affichee: {
    tache: Pick<
      Tache,
      'titre' | 'motif' | 'echeance' | 'heure' | 'duree' | 'lieu' | 'categorie' | 'etat'
    >
    contact: Parameters<typeof nomComplet>[0] | null
    bien: Pick<Bien, 'adresse' | 'complement' | 'code_postal' | 'ville'> | null
  },
  options: {
    aujourdhui: string
    /** Le jour que dit déjà l'onglet (`jourDeLaVue`). */
    jourMasque?: string | null
    /** Le lien que la fiche affichée montre déjà. */
    masquer?: 'contact' | 'bien'
    /** Un retard se dit en durée (« Depuis 6 j ») plutôt que par sa date : onglet « À faire ». */
    retardEnDuree?: boolean
  },
): DetailLigneTache {
  const { tache, contact, bien } = affichee
  const { aujourdhui, jourMasque = null, masquer, retardEnDuree = false } = options
  const nomContact = contact === null || masquer === 'contact' ? null : nomComplet(contact)
  // « Relancer Léa Fausse » nomme déjà le contact : la ligne ne le répète pas (règle 4).
  const contactAffiche =
    nomContact !== null && titreSansNom(tache.titre, nomContact) !== null ? null : nomContact
  const adresse = adresseUnique(tache.lieu, bien, masquer === 'bien')
  const autres = [contactAffiche, adresse].filter((morceau) => morceau !== null)
  const enRetard = tache.etat === 'a_faire' && tache.echeance < aujourdhui
  const depuis = enRetard && retardEnDuree ? depuisRetard(tache.echeance, aujourdhui) : null
  const jour = depuis?.texte ?? jourAffiche(tache.echeance, aujourdhui, jourMasque)
  const horaire = horaireTache(tache)
  return {
    jour,
    annonceJour: depuis?.annonce ?? null,
    enRetard,
    heureEnTete: jour === null && horaire !== '',
    jourEnTete: depuis !== null,
    horaire,
    autres:
      autres.length > 0
        ? autres
        : [tache.motif.trim() !== '' ? tache.motif.trim() : libelleCategorie(tache.categorie)],
  }
}

/**
 * Le titre sans le nom du contact qu'il cite déjà (« Relancer Léa Fausse » → « Relancer »,
 * « Rappeler Léa Fausse après la visite » → « Rappeler après la visite »), sans tenir compte
 * des majuscules ; `null` si le titre ne nomme pas ce contact. Règle 4 : une information
 * n'est écrite qu'une fois.
 */
export function titreSansNom(titre: string, nom: string): string | null {
  const cible = nom.trim().toLocaleLowerCase('fr')
  if (cible === '') return null
  const rang = titre.toLocaleLowerCase('fr').indexOf(cible)
  if (rang < 0) return null
  return `${titre.slice(0, rang)} ${titre.slice(rang + cible.length)}`
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()
}
