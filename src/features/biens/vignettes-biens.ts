import { useEffect, useRef, useState } from 'react'
import { exigerSupabase } from '../../lib/supabase'
import { listerPhotosPrincipales, signerPhotos } from './photos'

/**
 * Vignette de la photo principale de chaque bien d'une liste : renvoie, par identifiant de
 * bien, une adresse d'image temporaire. Un bien sans photo est absent du résultat.
 * Seuls les biens pas encore demandés sont lus : la liste peut s'allonger page après page.
 * Si la lecture échoue, la liste s'affiche simplement sans photo.
 */
export function useVignettesBiens(bienIds: readonly string[]): ReadonlyMap<string, string> {
  const [vignettes, setVignettes] = useState<ReadonlyMap<string, string>>(new Map())
  const demandes = useRef(new Set<string>())
  // Une clé de texte : l'effet ne repart que si la liste des biens change vraiment.
  const cle = bienIds.join(',')

  useEffect(() => {
    const nouveaux = (cle === '' ? [] : cle.split(',')).filter((id) => !demandes.current.has(id))
    if (nouveaux.length === 0) return
    for (const id of nouveaux) demandes.current.add(id)
    // Pas d'annulation si la liste change entre-temps : ces biens ne seront plus redemandés.
    async function charger() {
      const client = exigerSupabase()
      const photos = await listerPhotosPrincipales(client, nouveaux)
      if (!photos.ok || photos.donnees.length === 0) return
      const adresses = await signerPhotos(
        client,
        photos.donnees.map((photo) => photo.chemin_vignette),
      )
      if (!adresses.ok) return
      setVignettes((actuelles) => {
        const suite = new Map(actuelles)
        for (const photo of photos.donnees) {
          const adresse = adresses.donnees.get(photo.chemin_vignette)
          if (adresse !== undefined) suite.set(photo.bien_id, adresse)
        }
        return suite
      })
    }
    void charger()
  }, [cle])

  return vignettes
}
