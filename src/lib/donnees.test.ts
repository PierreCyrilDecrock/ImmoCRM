import { describe, expect, it } from 'vitest'
import {
  appeler,
  archiver,
  creer,
  enregistrerUnique,
  lire,
  lister,
  listerPage,
  modifier,
  restaurer,
  supprimer,
  TABLES,
} from './donnees'
import { fauxClient } from './faux-client'

const LIGNE = {
  id: '00000000-0000-4000-8000-000000000001',
  user_id: '00000000-0000-4000-8000-0000000000aa',
  created_at: '2026-11-16T10:00:00Z',
  updated_at: '2026-11-16T10:00:00Z',
  nom_affiche: 'Camille Fictif',
}

// Aucune table archivable n'existe avant l'étape 1.1 : on en simule une pour ces tests.
const TABLE_ARCHIVABLE = 'table_fictive' as never

describe('lister', () => {
  it('renvoie les lignes, les plus récentes d’abord', async () => {
    const { client, appels } = fauxClient({ data: [LIGNE], error: null })
    const resultat = await lister(client, 'reglages', { limite: 1 })
    expect(resultat).toEqual({ ok: true, donnees: [LIGNE] })
    expect(appels).toEqual([
      ['from', 'reglages'],
      ['select', '*'],
      ['order', 'created_at', { ascending: false }],
      ['limit', 1],
    ])
  })

  it('ne filtre pas sur l’archivage une table qui ne s’archive pas', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await lister(client, 'reglages')
    expect(appels.some(([nom]) => nom === 'is')).toBe(false)
  })

  it('écarte les lignes archivées d’une table archivable, sauf demande contraire', async () => {
    const tables: Record<string, { archivable: boolean }> = TABLES
    tables['table_fictive'] = { archivable: true }
    try {
      const sans = fauxClient({ data: [], error: null })
      await lister(sans.client, TABLE_ARCHIVABLE)
      expect(sans.appels).toContainEqual(['is', 'archived_at', null])

      const avec = fauxClient({ data: [], error: null })
      await lister(avec.client, TABLE_ARCHIVABLE, { archives: 'avec' })
      expect(avec.appels.some(([nom]) => nom === 'is' || nom === 'not')).toBe(false)

      const seulement = fauxClient({ data: [], error: null })
      await lister(seulement.client, TABLE_ARCHIVABLE, { archives: 'seulement' })
      expect(seulement.appels).toContainEqual(['not', 'archived_at', 'is', null])
    } finally {
      delete tables['table_fictive']
    }
  })

  it('traduit une erreur de Supabase en français', async () => {
    const { client } = fauxClient({ data: null, error: { code: '42501' }, status: 403 })
    const resultat = await lister(client, 'reglages')
    expect(resultat).toEqual({
      ok: false,
      erreur: { genre: 'droits', message: "Cette action n'est pas autorisée." },
    })
  })

  it('ne lève pas d’erreur si le réseau tombe', async () => {
    const { client } = fauxClient('panne')
    const resultat = await lister(client, 'reglages')
    expect(resultat.ok === false && resultat.erreur.genre).toBe('reseau')
  })
})

describe('lire', () => {
  it('renvoie la ligne demandée', async () => {
    const { client, appels } = fauxClient({ data: LIGNE, error: null })
    expect(await lire(client, 'reglages', LIGNE.id)).toEqual({ ok: true, donnees: LIGNE })
    expect(appels).toContainEqual(['eq', 'id', LIGNE.id])
  })

  it('signale une ligne introuvable', async () => {
    const { client } = fauxClient({ data: null, error: null })
    const resultat = await lire(client, 'reglages', LIGNE.id)
    expect(resultat.ok === false && resultat.erreur.genre).toBe('introuvable')
  })
})

describe('creer, modifier, enregistrerUnique', () => {
  it('crée une ligne sans envoyer les colonnes gérées par la base', async () => {
    const { client, appels } = fauxClient({ data: LIGNE, error: null })
    const resultat = await creer(client, 'reglages', { nom_affiche: 'Camille Fictif' })
    expect(resultat).toEqual({ ok: true, donnees: LIGNE })
    expect(appels).toContainEqual(['insert', { nom_affiche: 'Camille Fictif' }])
  })

  it('modifie la ligne visée', async () => {
    const { client, appels } = fauxClient({ data: LIGNE, error: null })
    await modifier(client, 'reglages', LIGNE.id, { nom_affiche: 'Dominique Exemple' })
    expect(appels).toContainEqual(['update', { nom_affiche: 'Dominique Exemple' }])
    expect(appels).toContainEqual(['eq', 'id', LIGNE.id])
  })

  it('signale une modification qui ne touche aucune ligne', async () => {
    const { client } = fauxClient({ data: null, error: null })
    const resultat = await modifier(client, 'reglages', LIGNE.id, { nom_affiche: 'X' })
    expect(resultat.ok === false && resultat.erreur.genre).toBe('introuvable')
  })

  it('crée ou modifie selon la colonne unique', async () => {
    const { client, appels } = fauxClient({ data: LIGNE, error: null })
    await enregistrerUnique(client, 'reglages', { nom_affiche: 'Camille Fictif' }, 'user_id')
    expect(appels).toContainEqual([
      'upsert',
      { nom_affiche: 'Camille Fictif' },
      { onConflict: 'user_id' },
    ])
  })
})

describe('archiver, restaurer', () => {
  it('archive en datant la ligne, sans la supprimer', async () => {
    const { client, appels } = fauxClient({ data: LIGNE, error: null })
    await archiver(client, TABLE_ARCHIVABLE, LIGNE.id)
    const modification = appels.find(([nom]) => nom === 'update')
    expect(modification?.[1]).toEqual({ archived_at: expect.any(String) })
    expect(appels.some(([nom]) => nom === 'delete')).toBe(false)
  })

  it('restaure en effaçant la date d’archivage', async () => {
    const { client, appels } = fauxClient({ data: LIGNE, error: null })
    await restaurer(client, TABLE_ARCHIVABLE, LIGNE.id)
    expect(appels).toContainEqual(['update', { archived_at: null }])
  })
})

describe('listerPage', () => {
  it('lit une tranche de lignes, filtrée et triée par la base, avec le total', async () => {
    const { client, appels } = fauxClient({ data: [LIGNE], error: null, count: 42 })
    const resultat = await listerPage(client, 'reglages', {
      filtres: [
        { colonne: 'nom_affiche', genre: 'contient', valeur: 'camille' },
        { colonne: 'user_id', genre: 'egal', valeur: LIGNE.user_id },
      ],
      tri: [{ colonne: 'nom_affiche' }, { colonne: 'id', croissant: false }],
      debut: 100,
      taille: 50,
      compter: true,
    })
    expect(resultat).toEqual({ ok: true, donnees: { lignes: [LIGNE], total: 42 } })
    expect(appels).toEqual([
      ['from', 'reglages'],
      ['select', '*', { count: 'exact' }],
      ['like', 'nom_affiche', '%camille%'],
      ['eq', 'user_id', LIGNE.user_id],
      ['order', 'nom_affiche', { ascending: true }],
      ['order', 'id', { ascending: false }],
      ['range', 100, 149],
    ])
  })

  it('met entre guillemets les valeurs cherchées dans un tableau', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerPage(client, 'contacts', {
      filtres: [{ colonne: 'etiquettes', genre: 'comprend', valeur: ['résidence, "secondaire"'] }],
      tri: [{ colonne: 'id' }],
      debut: 0,
      taille: 10,
    })
    expect(appels).toContainEqual(['contains', 'etiquettes', ['"résidence, \\"secondaire\\""']])
  })

  it('filtre sur une liste de valeurs et sur une fourchette de nombres', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerPage(client, 'biens', {
      filtres: [
        { colonne: 'id', genre: 'parmi', valeur: ['a', 'b'] },
        { colonne: 'prix', genre: 'min', valeur: 100000 },
        { colonne: 'prix', genre: 'max', valeur: 300000 },
      ],
      tri: [{ colonne: 'id' }],
      debut: 0,
      taille: 10,
    })
    expect(appels).toContainEqual(['in', 'id', ['a', 'b']])
    expect(appels).toContainEqual(['gte', 'prix', 100000])
    expect(appels).toContainEqual(['lte', 'prix', 300000])
  })

  it('cherche une colonne vide', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerPage(client, 'contacts', {
      filtres: [{ colonne: 'prochaine_action_le', genre: 'vide' }],
      tri: [{ colonne: 'id' }],
      debut: 0,
      taille: 10,
    })
    expect(appels).toContainEqual(['is', 'prochaine_action_le', null])
  })

  it('ne demande pas le total s’il n’est pas voulu', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    const resultat = await listerPage(client, 'reglages', {
      tri: [{ colonne: 'id' }],
      debut: 0,
      taille: 10,
    })
    expect(resultat).toEqual({ ok: true, donnees: { lignes: [], total: null } })
    expect(appels).toContainEqual(['select', '*'])
  })

  it('traduit une panne de réseau', async () => {
    const { client } = fauxClient('panne')
    const resultat = await listerPage(client, 'reglages', {
      tri: [{ colonne: 'id' }],
      debut: 0,
      taille: 10,
    })
    expect(resultat).toMatchObject({ ok: false, erreur: { genre: 'reseau' } })
  })
})

describe('appeler', () => {
  it('appelle une fonction de la base avec ses paramètres', async () => {
    const { client, appels } = fauxClient({ data: 'camille fictif', error: null })
    const resultat = await appeler(client, 'normaliser_recherche', { texte: 'Camille FICTIF' })
    expect(resultat).toEqual({ ok: true, donnees: 'camille fictif' })
    expect(appels).toEqual([['rpc', 'normaliser_recherche', { texte: 'Camille FICTIF' }]])
  })

  it('traduit un refus de la base', async () => {
    const { client } = fauxClient({ data: null, error: { code: '22023' }, status: 400 })
    const resultat = await appeler(client, 'etiquettes_contacts')
    expect(resultat).toMatchObject({ ok: false, erreur: { genre: 'invalide' } })
  })
})

describe('supprimer', () => {
  it('supprime la ligne demandée, et elle seule', async () => {
    const { client, appels } = fauxClient({ data: { id: 'p1' }, error: null })
    expect(await supprimer(client, 'biens_photos', 'p1')).toEqual({
      ok: true,
      donnees: { id: 'p1' },
    })
    expect(appels).toEqual([
      ['from', 'biens_photos'],
      ['delete'],
      ['eq', 'id', 'p1'],
      ['select', 'id'],
      ['maybeSingle'],
    ])
  })

  it('signale une ligne introuvable', async () => {
    const { client } = fauxClient({ data: null, error: null })
    const resultat = await supprimer(client, 'biens_photos', 'p1')
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.erreur.genre).toBe('introuvable')
  })
})
