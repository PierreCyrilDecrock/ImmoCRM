import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  cheminsPhoto,
  deplacerPhoto,
  enregistrerPhoto,
  ESPACE_GRATUIT,
  lireEspacePhotos,
  listerPhotosPrincipales,
  mettreEnTete,
  ordonnerPhotos,
  placesRestantes,
  PLAFOND_PHOTOS,
  supprimerPhoto,
  usageEspace,
} from './photos'

const COMPTE = '00000000-0000-4000-8000-0000000000aa'
const BIEN = '00000000-0000-4000-8000-0000000000b1'

describe('cheminsPhoto', () => {
  it('range la photo et sa vignette dans le dossier du compte et du bien', () => {
    expect(cheminsPhoto(COMPTE, BIEN, 'abc')).toEqual({
      chemin: `${COMPTE}/${BIEN}/abc.jpg`,
      cheminVignette: `${COMPTE}/${BIEN}/abc-vignette.jpg`,
    })
  })
})

describe('placesRestantes', () => {
  it('compte ce qui reste avant le plafond de 20 photos', () => {
    expect(placesRestantes(0)).toBe(PLAFOND_PHOTOS)
    expect(placesRestantes(17)).toBe(3)
    expect(placesRestantes(20)).toBe(0)
    expect(placesRestantes(25)).toBe(0)
  })
})

describe('deplacerPhoto', () => {
  const ids = ['a', 'b', 'c']

  it('avance ou recule une photo d’un cran', () => {
    expect(deplacerPhoto(ids, 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(deplacerPhoto(ids, 'b', 1)).toEqual(['a', 'c', 'b'])
  })

  it('ne change rien au bout de la liste ou pour une photo inconnue', () => {
    expect(deplacerPhoto(ids, 'a', -1)).toEqual(ids)
    expect(deplacerPhoto(ids, 'c', 1)).toEqual(ids)
    expect(deplacerPhoto(ids, 'z', 1)).toEqual(ids)
  })
})

describe('mettreEnTete', () => {
  it('place la photo choisie en premier, sans changer l’ordre des autres', () => {
    expect(mettreEnTete(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
    expect(mettreEnTete(['a', 'b', 'c'], 'a')).toEqual(['a', 'b', 'c'])
    expect(mettreEnTete(['a', 'b'], 'z')).toEqual(['a', 'b'])
  })
})

describe('usageEspace', () => {
  it('calcule la part occupée et le niveau d’alerte', () => {
    expect(usageEspace(0)).toEqual({ pourcentage: 0, niveau: 'normal' })
    expect(usageEspace(ESPACE_GRATUIT / 2)).toEqual({ pourcentage: 50, niveau: 'normal' })
    expect(usageEspace(ESPACE_GRATUIT * 0.75).niveau).toBe('alerte')
    expect(usageEspace(ESPACE_GRATUIT * 0.95).niveau).toBe('danger')
  })

  it('ne dépasse jamais 100 %', () => {
    expect(usageEspace(ESPACE_GRATUIT * 2)).toEqual({ pourcentage: 100, niveau: 'danger' })
  })
})

describe('listerPhotosPrincipales', () => {
  it('ne lit que les photos de rang 0 des biens demandés', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerPhotosPrincipales(client, [BIEN])
    expect(appels).toContainEqual(['in', 'bien_id', [BIEN]])
    expect(appels).toContainEqual(['eq', 'rang', '0'])
  })

  it('ne demande rien sans bien', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    expect(await listerPhotosPrincipales(client, [])).toEqual({ ok: true, donnees: [] })
    expect(appels).toEqual([])
  })
})

describe('enregistrerPhoto', () => {
  const image = {
    photo: new Blob(['photo'], { type: 'image/jpeg' }),
    vignette: new Blob(['v'], { type: 'image/jpeg' }),
  }
  const valeurs = { userId: COMPTE, bienId: BIEN, nom: 'abc', image }

  it('envoie les deux fichiers puis inscrit la photo, sans choisir son rang', async () => {
    const { client, appels } = fauxClient({ data: { id: 'p1' }, error: null })
    expect((await enregistrerPhoto(client, valeurs)).ok).toBe(true)
    expect(appels.filter(([nom]) => nom === 'upload').map(([, chemin]) => chemin)).toEqual([
      `${COMPTE}/${BIEN}/abc.jpg`,
      `${COMPTE}/${BIEN}/abc-vignette.jpg`,
    ])
    expect(appels).toContainEqual([
      'insert',
      {
        bien_id: BIEN,
        chemin: `${COMPTE}/${BIEN}/abc.jpg`,
        chemin_vignette: `${COMPTE}/${BIEN}/abc-vignette.jpg`,
        taille: 5,
      },
    ])
    expect(appels.some(([nom]) => nom === 'remove')).toBe(false)
  })

  it('s’arrête au premier envoi refusé', async () => {
    const { client, appels } = fauxClient({ data: null, error: { message: 'refus' }, status: 403 })
    expect((await enregistrerPhoto(client, valeurs)).ok).toBe(false)
    expect(appels.filter(([nom]) => nom === 'upload')).toHaveLength(1)
    expect(appels.some(([nom]) => nom === 'insert')).toBe(false)
  })
})

describe('supprimerPhoto', () => {
  const photo = { id: 'p1', chemin: 'a/b.jpg', chemin_vignette: 'a/b-vignette.jpg' }

  it('retire les deux fichiers, puis la ligne', async () => {
    const { client, appels } = fauxClient({ data: { id: 'p1' }, error: null })
    expect(await supprimerPhoto(client, photo)).toEqual({ ok: true, donnees: null })
    const noms = appels.map(([nom]) => nom)
    expect(appels).toContainEqual(['remove', ['a/b.jpg', 'a/b-vignette.jpg']])
    expect(noms.indexOf('remove')).toBeLessThan(noms.indexOf('delete'))
    expect(appels).toContainEqual(['eq', 'id', 'p1'])
  })

  it('considère une photo déjà supprimée comme supprimée', async () => {
    const { client } = fauxClient({ data: null, error: null })
    expect((await supprimerPhoto(client, photo)).ok).toBe(true)
  })

  it('ne touche pas à la ligne si les fichiers n’ont pas pu être retirés', async () => {
    const { client, appels } = fauxClient('panne')
    expect((await supprimerPhoto(client, photo)).ok).toBe(false)
    expect(appels.some(([nom]) => nom === 'delete')).toBe(false)
  })
})

describe('ordonnerPhotos', () => {
  it('confie le nouvel ordre à la base', async () => {
    const { client, appels } = fauxClient({ data: null, error: null })
    expect((await ordonnerPhotos(client, BIEN, ['b', 'a'])).ok).toBe(true)
    expect(appels).toEqual([
      ['rpc', 'ordonner_photos_bien', { p_bien_id: BIEN, p_ids: ['b', 'a'] }],
    ])
  })
})

describe('lireEspacePhotos', () => {
  it('lit le nombre de photos et la place occupée', async () => {
    const { client } = fauxClient({ data: [{ photos: 12, octets: 3_400_000 }], error: null })
    expect(await lireEspacePhotos(client)).toEqual({
      ok: true,
      donnees: { photos: 12, octets: 3_400_000 },
    })
  })
})
