import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  enregistrerReglages,
  lireReglages,
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
    const { client } = fauxClient({ data: [{ nom_affiche: 'Camille Fictif' }], error: null })
    expect(await lireReglages(client)).toEqual({
      ok: true,
      donnees: { nom_affiche: 'Camille Fictif' },
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
    expect(resultat).toEqual({ ok: true, donnees: { nom_affiche: 'Camille Fictif' } })
    expect(appels).toContainEqual([
      'upsert',
      { nom_affiche: 'Camille Fictif' },
      { onConflict: 'user_id' },
    ])
  })
})
