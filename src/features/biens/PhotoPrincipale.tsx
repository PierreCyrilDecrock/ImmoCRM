import { useEffect, useState } from 'react'
import Bouton from '../../components/Bouton'
import FenetreModale from '../../components/FenetreModale'
import Icone from '../../components/Icone'
import { exigerSupabase } from '../../lib/supabase'
import { avecPhoto } from './fiche-bien'
import { listerPhotosBien, rangSuivant, signerPhotos, type PhotoBien } from './photos'

type Props = {
  bienId: string
  /** Change quand les photos ont pu changer (onglet Détails) : elles se relisent. */
  version: number
  /**
   * `grande` : en tête du profil, sur toute sa largeur (ordinateur). `compacte` : un carré
   * à gauche de l'en-tête (téléphone, tablette), à la place des initiales d'un contact.
   */
  taille: 'grande' | 'compacte'
  /** Texte de remplacement (« Photo du 12 rue de l'Exemple »). */
  description: string
}

type Etat = { photos: PhotoBien[]; apercu: string | null } | null

/**
 * La photo principale d'un bien, en tête de sa fiche (étape D.7). Un toucher ouvre la
 * galerie : les photos en grand, une à une, avec « Précédente » et « Suivante » (flèches
 * du clavier). Sans photo (ou tant qu'elles se lisent), rien ne s'affiche : le statut et le
 * type passent au-dessus de l'adresse. Les photos s'ajoutent dans l'onglet Détails.
 */
export default function PhotoPrincipale({ bienId, version, taille, description }: Props) {
  const [etat, setEtat] = useState<Etat>(null)
  const [ouverte, setOuverte] = useState<number | null>(null)
  /** Adresses des grandes photos déjà demandées, par chemin. */
  const [grandes, setGrandes] = useState<ReadonlyMap<string, string>>(new Map())
  const grande = taille === 'grande'

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      const client = exigerSupabase()
      const photos = await listerPhotosBien(client, bienId)
      if (!photos.ok) return null
      const premiere = photos.donnees[0]
      if (premiere === undefined) return { photos: [], apercu: null }
      // En grand, la photo elle-même ; en petit, sa vignette suffit.
      const chemin = grande ? premiere.chemin : premiere.chemin_vignette
      const adresses = await signerPhotos(client, [chemin])
      return {
        photos: photos.donnees,
        apercu: adresses.ok ? (adresses.donnees.get(chemin) ?? null) : null,
      }
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
    }
  }, [bienId, version, grande])

  const photos = etat?.photos ?? []
  const photoOuverte = ouverte === null ? undefined : photos[ouverte]
  const adresseOuverte = photoOuverte === undefined ? undefined : grandes.get(photoOuverte.chemin)

  // La grande photo affichée dans la galerie est demandée au moment où on l'ouvre.
  useEffect(() => {
    if (photoOuverte === undefined || grandes.has(photoOuverte.chemin)) return
    let actif = true
    void signerPhotos(exigerSupabase(), [photoOuverte.chemin]).then((resultat) => {
      const adresse = resultat.ok ? resultat.donnees.get(photoOuverte.chemin) : undefined
      if (actif && adresse !== undefined) {
        setGrandes((actuelles) => new Map(actuelles).set(photoOuverte.chemin, adresse))
      }
    })
    return () => {
      actif = false
    }
  }, [photoOuverte, grandes])

  // Dans la galerie, les flèches du clavier passent d'une photo à l'autre.
  const nombre = photos.length
  useEffect(() => {
    if (ouverte === null) return
    function surTouche(evenement: globalThis.KeyboardEvent) {
      if (evenement.key !== 'ArrowRight' && evenement.key !== 'ArrowLeft') return
      evenement.preventDefault()
      const sens = evenement.key === 'ArrowRight' ? 1 : -1
      setOuverte((rang) => (rang === null ? null : rangSuivant(rang, nombre, sens)))
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [ouverte, nombre])

  const cadre = grande
    ? 'aspect-[4/3] w-full shrink-0 rounded-2xl'
    : 'size-16 shrink-0 rounded-xl md:size-20'

  // Sans photo, rien : pas de carré gris qui serait le même pour tous les biens (revue n° 2,
  // proposition 11). Les photos s'ajoutent dans l'onglet Détails.
  if (etat === null || !avecPhoto(photos.length)) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverte(0)}
        aria-label={`Voir les photos (${photos.length})`}
        className={`${cadre} relative block overflow-hidden bg-creux ring-1 ring-bord focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      >
        {etat.apercu !== null && (
          <img src={etat.apercu} alt="" className="size-full object-cover" />
        )}
        {photos.length > 1 && (
          <span
            className={`absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full bg-inverse/80 px-2 py-0.5 text-xs font-semibold text-sur-inverse ${
              grande ? '' : 'max-md:hidden'
            }`}
            aria-hidden="true"
          >
            <Icone nom="galerie" className="size-3.5" />
            {photos.length}
          </span>
        )}
      </button>

      {photoOuverte !== undefined && ouverte !== null && (
        <FenetreModale
          ouverte
          titre={`Photo ${ouverte + 1} sur ${photos.length}`}
          onFermer={() => setOuverte(null)}
          pied={
            photos.length > 1 ? (
              <div className="grid w-full grid-cols-2 gap-2">
                <Bouton
                  variante="secondaire"
                  icone="retour"
                  pleineLargeur
                  onClick={() => setOuverte(rangSuivant(ouverte, photos.length, -1))}
                >
                  Précédente
                </Bouton>
                <Bouton
                  variante="secondaire"
                  pleineLargeur
                  onClick={() => setOuverte(rangSuivant(ouverte, photos.length, 1))}
                >
                  Suivante
                </Bouton>
              </div>
            ) : undefined
          }
        >
          <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg bg-creux">
            {adresseOuverte !== undefined && (
              <img
                src={adresseOuverte}
                alt={`${description}, photo ${ouverte + 1} sur ${photos.length}`}
                className="max-h-[65dvh] w-full object-contain"
              />
            )}
          </div>
        </FenetreModale>
      )}
    </>
  )
}
