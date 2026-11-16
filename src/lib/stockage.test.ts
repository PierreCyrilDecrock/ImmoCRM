import { describe, expect, it } from 'vitest'
import { fauxClient } from './faux-client'
import { envoyerFichier, signerAdresses, supprimerFichiers } from './stockage'

describe('envoyerFichier', () => {
  it('envoie le fichier sans jamais remplacer un fichier existant', async () => {
    const { client, appels } = fauxClient({ data: { path: 'a/b.jpg' }, error: null })
    const fichier = new Blob(['x'], { type: 'image/jpeg' })
    expect(await envoyerFichier(client, 'photos-biens', 'a/b.jpg', fichier)).toEqual({
      ok: true,
      donnees: null,
    })
    expect(appels[0]).toEqual(['from', 'photos-biens'])
    expect(appels[1]).toEqual([
      'upload',
      'a/b.jpg',
      fichier,
      { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false },
    ])
  })

  it('traduit un refus des règles d’accès', async () => {
    const { client } = fauxClient({
      data: null,
      error: { message: 'new row violates row-level security policy', statusCode: '403' } as never,
    })
    const resultat = await envoyerFichier(client, 'photos-biens', 'a/b.jpg', new Blob(['x']))
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.erreur.genre).toBe('droits')
  })

  it('traduit une coupure de réseau', async () => {
    const { client } = fauxClient('panne')
    const resultat = await envoyerFichier(client, 'photos-biens', 'a/b.jpg', new Blob(['x']))
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.erreur.genre).toBe('reseau')
  })
})

describe('supprimerFichiers', () => {
  it('supprime les fichiers demandés', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    expect((await supprimerFichiers(client, 'photos-biens', ['a/b.jpg', 'a/c.jpg'])).ok).toBe(true)
    expect(appels[1]).toEqual(['remove', ['a/b.jpg', 'a/c.jpg']])
  })
})

describe('signerAdresses', () => {
  it('range les adresses signées par chemin et écarte les fichiers introuvables', async () => {
    const { client, appels } = fauxClient({
      data: [
        { path: 'a/b.jpg', signedUrl: 'https://exemple.invalid/b?token=1', error: null },
        { path: 'a/c.jpg', signedUrl: '', error: 'Object not found' },
      ],
      error: null,
    })
    const resultat = await signerAdresses(client, 'photos-biens', ['a/b.jpg', 'a/c.jpg'], 900)
    expect(resultat.ok).toBe(true)
    if (resultat.ok) {
      expect([...resultat.donnees]).toEqual([['a/b.jpg', 'https://exemple.invalid/b?token=1']])
    }
    expect(appels[1]).toEqual(['createSignedUrls', ['a/b.jpg', 'a/c.jpg'], 900])
  })

  it('ne demande rien quand il n’y a aucun fichier', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    expect((await signerAdresses(client, 'photos-biens', [], 900)).ok).toBe(true)
    expect(appels).toEqual([])
  })
})
