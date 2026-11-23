import type { GenreEtiquette } from '../../components/Etiquette'
import { depuisQuand, ecartJours, estDateValide, formaterJourLong } from '../../lib/dates'
import type { Activite } from './activites'

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
