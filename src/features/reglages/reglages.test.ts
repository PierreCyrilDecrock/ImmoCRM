import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  enregistrerReglages,
  lireDatesSauvegarde,
  lireReglages,
  noterExport,
  REGLAGES_PAR_DEFAUT,
  validerNomAffiche,
} from './reglages'

describe('validerNomAffiche', () => {
  it('accepte un nom vide ou court', () => {
    expect(validerNomAffiche('')).toBeNull()
    expect(validerNomAffiche('Camille Fictif')).toBeNull()
    expect(validerNomAffiche(`  ${'a'.repeat(80)}  `)).toBeNull()
  })

  it('refuse un nom de plus de 80 caractères', () => {
    expect(validerNomAffiche('a'.repeat(81))).toBe('Le nom ne peut pas dépasser 80 caractères.')
  })
})

describe('lireReglages', () => {
  it('donne les valeurs par défaut tant que rien n’est enregistré', async () => {
    const { client } = fauxClient({ data: [], error: null })
    expect(await lireReglages(client)).toEqual({ ok: true, donnees: REGLAGES_PAR_DEFAUT })
  })

  it('donne les réglages enregistrés', async () => {
    const { client } = fauxClient({
      data: [
        {
          nom_affiche: 'Camille Fictif',
          relance_chaud: '3j',
          relance_tiede: '2s',
          relance_froid: '3m',
          relance_veille: '12m',
        },
      ],
      error: null,
    })
    expect(await lireReglages(client)).toEqual({
      ok: true,
      donnees: {
        nom_affiche: 'Camille Fictif',
        delais_relance: { chaud: '3j', tiede: '2s', froid: '3m', veille: '12m' },
      },
    })
  })

  it('remplace un délai illisible par celui par défaut', async () => {
    const { client } = fauxClient({
      data: [{ nom_affiche: '', relance_chaud: '??', relance_tiede: '1m' }],
      error: null,
    })
    const resultat = await lireReglages(client)
    expect(resultat.ok && resultat.donnees.delais_relance).toEqual({
      chaud: '1s',
      tiede: '1m',
      froid: '3m',
      veille: '6m',
    })
  })

  it('transmet l’erreur en français', async () => {
    const { client } = fauxClient('panne')
    const resultat = await lireReglages(client)
    expect(resultat.ok === false && resultat.erreur.genre).toBe('reseau')
  })
})

describe('enregistrerReglages', () => {
  it('enregistre le nom sans espaces autour, sur la ligne du compte', async () => {
    const { client, appels } = fauxClient({ data: { nom_affiche: 'Camille Fictif' }, error: null })
    const resultat = await enregistrerReglages(client, { nom_affiche: '  Camille Fictif ' })
    expect(resultat).toEqual({
      ok: true,
      donnees: {
        nom_affiche: 'Camille Fictif',
        delais_relance: REGLAGES_PAR_DEFAUT.delais_relance,
      },
    })
    expect(appels).toContainEqual([
      'upsert',
      { nom_affiche: 'Camille Fictif' },
      { onConflict: 'user_id' },
    ])
  })

  it('enregistre les délais de relance seuls, sans toucher au nom', async () => {
    const { client, appels } = fauxClient({ data: { nom_affiche: 'Camille Fictif' }, error: null })
    await enregistrerReglages(client, {
      delais_relance: { chaud: '3j', tiede: '1m', froid: '2m', veille: '6m' },
    })
    expect(appels).toContainEqual([
      'upsert',
      { relance_chaud: '3j', relance_tiede: '1m', relance_froid: '2m', relance_veille: '6m' },
      { onConflict: 'user_id' },
    ])
  })
})

describe('lireDatesSauvegarde', () => {
  it('ne donne aucune date tant que rien n’est enregistré', async () => {
    const { client } = fauxClient({ data: [], error: null })
    expect(await lireDatesSauvegarde(client)).toEqual({
      ok: true,
      donnees: { dernier_export_le: null, derniere_sauvegarde_le: null },
    })
  })

  it('donne les dates enregistrées', async () => {
    const { client } = fauxClient({
      data: [
        {
          dernier_export_le: '2026-11-18T09:30:00+00:00',
          derniere_sauvegarde_le: '2026-11-16T03:20:00+00:00',
        },
      ],
      error: null,
    })
    expect(await lireDatesSauvegarde(client)).toEqual({
      ok: true,
      donnees: {
        dernier_export_le: '2026-11-18T09:30:00+00:00',
        derniere_sauvegarde_le: '2026-11-16T03:20:00+00:00',
      },
    })
  })
})

describe('noterExport', () => {
  it('inscrit le moment de l’export sur la ligne du compte, sans toucher au reste', async () => {
    const { client, appels } = fauxClient({
      data: { dernier_export_le: '2026-11-18T09:30:00+00:00', derniere_sauvegarde_le: null },
      error: null,
    })
    const resultat = await noterExport(client, new Date('2026-11-18T09:30:00Z'))
    expect(resultat).toEqual({
      ok: true,
      donnees: { dernier_export_le: '2026-11-18T09:30:00+00:00', derniere_sauvegarde_le: null },
    })
    expect(appels).toContainEqual([
      'upsert',
      { dernier_export_le: '2026-11-18T09:30:00.000Z' },
      { onConflict: 'user_id' },
    ])
  })
})
