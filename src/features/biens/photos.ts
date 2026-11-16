import type { SupabaseClient } from '@supabase/supabase-js'
import { appeler, creer, listerPage, supprimer, type Ligne, type Resultat } from '../../lib/donnees'
import { erreurDonnees } from '../../lib/erreurs-donnees'
import type { PhotoCompressee } from '../../lib/image'
import { envoyerFichier, signerAdresses, supprimerFichiers } from '../../lib/stockage'

/**
 * Photos d'un bien. Les fichiers vivent dans un espace de stockage privé ; la table
 * `biens_photos` en garde la liste et l'ordre. La première photo (rang 0) est la photo
 * principale. Voir docs/donnees.md, « Photos des biens ».
 */

/** Une photo d'un bien, telle que la base la décrit. */
export type PhotoBien = Ligne<'biens_photos'>

/** Nom de l'espace de stockage privé des photos. */
export const ESPACE_PHOTOS = 'photos-biens'

/** Nombre maximal de photos par bien (la base le vérifie aussi). */
export const PLAFOND_PHOTOS = 20

/** Durée de validité d'une adresse d'image, en secondes (15 minutes). */
export const DUREE_ADRESSE_PHOTO = 15 * 60

/**
 * Place offerte par l'offre gratuite de Supabase pour les fichiers : 1 Go.
 * Chiffre à vérifier sur le site de Supabase (voir le cadrage, Architecture technique).
 */
export const ESPACE_GRATUIT = 1_000_000_000

/** Emplacements des deux fichiers d'une photo : `<compte>/<bien>/<nom>.jpg`. */
export function cheminsPhoto(
  userId: string,
  bienId: string,
  nom: string,
): { chemin: string; cheminVignette: string } {
  const dossier = `${userId}/${bienId}`
  return { chemin: `${dossier}/${nom}.jpg`, cheminVignette: `${dossier}/${nom}-vignette.jpg` }
}

/** Nombre de photos que l'on peut encore ajouter à un bien. */
export function placesRestantes(nombrePhotos: number): number {
  return Math.max(0, PLAFOND_PHOTOS - nombrePhotos)
}

/**
 * Nouvel ordre après avoir déplacé une photo d'un cran (`-1` : vers le début, `1` : vers la
 * fin). Renvoie la liste telle quelle si le déplacement est impossible.
 */
export function deplacerPhoto(ids: readonly string[], id: string, decalage: -1 | 1): string[] {
  const rang = ids.indexOf(id)
  const cible = rang + decalage
  if (rang === -1 || cible < 0 || cible >= ids.length) return [...ids]
  const suite = [...ids]
  ;[suite[rang], suite[cible]] = [ids[cible] ?? id, id]
  return suite
}

/** Nouvel ordre après avoir choisi une photo comme photo principale : elle passe en tête. */
export function mettreEnTete(ids: readonly string[], id: string): string[] {
  if (!ids.includes(id)) return [...ids]
  return [id, ...ids.filter((autre) => autre !== id)]
}

export type NiveauEspace = 'normal' | 'alerte' | 'danger'

/** Part de l'espace gratuit occupée, en pourcentage, et niveau d'alerte correspondant. */
export function usageEspace(
  octets: number,
  limite: number = ESPACE_GRATUIT,
): { pourcentage: number; niveau: NiveauEspace } {
  const pourcentage = limite <= 0 ? 100 : Math.min(100, Math.max(0, (octets / limite) * 100))
  return {
    pourcentage,
    niveau: pourcentage >= 90 ? 'danger' : pourcentage >= 70 ? 'alerte' : 'normal',
  }
}

/** Les photos d'un bien, dans l'ordre choisi (la principale d'abord). */
export async function listerPhotosBien(
  client: SupabaseClient,
  bienId: string,
): Promise<Resultat<PhotoBien[]>> {
  const resultat = await listerPage(client, 'biens_photos', {
    filtres: [{ colonne: 'bien_id', genre: 'egal', valeur: bienId }],
    tri: [{ colonne: 'rang' }, { colonne: 'id' }],
    debut: 0,
    taille: PLAFOND_PHOTOS * 2,
  })
  if (!resultat.ok) return resultat
  return { ok: true, donnees: resultat.donnees.lignes }
}

/** La photo principale de chacun des biens indiqués (les biens sans photo sont absents). */
export async function listerPhotosPrincipales(
  client: SupabaseClient,
  bienIds: readonly string[],
): Promise<Resultat<PhotoBien[]>> {
  if (bienIds.length === 0) return { ok: true, donnees: [] }
  const resultat = await listerPage(client, 'biens_photos', {
    filtres: [
      { colonne: 'bien_id', genre: 'parmi', valeur: [...bienIds] },
      { colonne: 'rang', genre: 'egal', valeur: '0' },
    ],
    tri: [{ colonne: 'id' }],
    debut: 0,
    taille: bienIds.length,
  })
  if (!resultat.ok) return resultat
  return { ok: true, donnees: resultat.donnees.lignes }
}

/** Adresses signées, temporaires, des fichiers indiqués, rangées par chemin. */
export function signerPhotos(
  client: SupabaseClient,
  chemins: readonly string[],
): Promise<Resultat<Map<string, string>>> {
  return signerAdresses(client, ESPACE_PHOTOS, chemins, DUREE_ADRESSE_PHOTO)
}

/**
 * Enregistre une photo déjà compressée : envoie la photo et sa vignette, puis inscrit la
 * photo à la fin de la liste du bien. Si l'inscription échoue, les fichiers sont retirés.
 */
export async function enregistrerPhoto(
  client: SupabaseClient,
  valeurs: { userId: string; bienId: string; nom: string; image: PhotoCompressee },
): Promise<Resultat<PhotoBien>> {
  const { chemin, cheminVignette } = cheminsPhoto(valeurs.userId, valeurs.bienId, valeurs.nom)
  const envoiPhoto = await envoyerFichier(client, ESPACE_PHOTOS, chemin, valeurs.image.photo)
  if (!envoiPhoto.ok) return envoiPhoto
  const envoiVignette = await envoyerFichier(
    client,
    ESPACE_PHOTOS,
    cheminVignette,
    valeurs.image.vignette,
  )
  const inscription = envoiVignette.ok
    ? await creer(client, 'biens_photos', {
        bien_id: valeurs.bienId,
        chemin,
        chemin_vignette: cheminVignette,
        taille: valeurs.image.photo.size,
      })
    : envoiVignette
  // Rien ne doit rester dans le stockage sans figurer dans la liste.
  if (!inscription.ok) await supprimerFichiers(client, ESPACE_PHOTOS, [chemin, cheminVignette])
  return inscription
}

/**
 * Supprime une photo pour de bon : les fichiers d'abord, puis la ligne. Si la seconde
 * étape échoue, la photo reste dans la liste et la suppression peut être relancée.
 */
export async function supprimerPhoto(
  client: SupabaseClient,
  photo: Pick<PhotoBien, 'id' | 'chemin' | 'chemin_vignette'>,
): Promise<Resultat<null>> {
  const fichiers = await supprimerFichiers(client, ESPACE_PHOTOS, [
    photo.chemin,
    photo.chemin_vignette,
  ])
  if (!fichiers.ok) return fichiers
  const ligne = await supprimer(client, 'biens_photos', photo.id)
  // Déjà supprimée (par un autre onglet, par exemple) : le but est atteint.
  if (!ligne.ok && ligne.erreur.genre !== 'introuvable') return ligne
  return { ok: true, donnees: null }
}

/** Range les photos d'un bien dans l'ordre donné ; la première devient la principale. */
export async function ordonnerPhotos(
  client: SupabaseClient,
  bienId: string,
  ids: readonly string[],
): Promise<Resultat<null>> {
  const resultat = await appeler(client, 'ordonner_photos_bien', {
    p_bien_id: bienId,
    p_ids: [...ids],
  })
  return resultat.ok ? { ok: true, donnees: null } : resultat
}

/** Nombre de photos du compte et place occupée dans le stockage, en octets. */
export async function lireEspacePhotos(
  client: SupabaseClient,
): Promise<Resultat<{ photos: number; octets: number }>> {
  const resultat = await appeler(client, 'espace_photos')
  if (!resultat.ok) return resultat
  const ligne = resultat.donnees[0]
  if (ligne === undefined) return { ok: false, erreur: erreurDonnees('inconnue') }
  return { ok: true, donnees: { photos: Number(ligne.photos), octets: Number(ligne.octets) } }
}
