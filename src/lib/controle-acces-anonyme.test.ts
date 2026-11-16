import { describe, expect, it } from 'vitest'
import { controlerAccesAnonyme } from './controle-acces-anonyme'
import { fauxClient } from './faux-client'

describe('controlerAccesAnonyme', () => {
  it('valide une table qui refuse la requête', async () => {
    const { client } = fauxClient({ data: null, error: { code: '42501' }, status: 401 })
    const bilan = await controlerAccesAnonyme(client, ['reglages'])
    expect(bilan.protege).toBe(true)
    expect(bilan.message).toBe("Sans connexion, aucune ligne n'est visible (1 table contrôlée).")
  })

  it('valide une table qui répond sans aucune ligne', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    const bilan = await controlerAccesAnonyme(client, ['reglages', 'contacts'])
    expect(bilan.protege).toBe(true)
    expect(bilan.message).toContain('2 tables contrôlées')
    expect(appels.filter(([nom]) => nom === 'from')).toEqual([
      ['from', 'reglages'],
      ['from', 'contacts'],
    ])
  })

  it('donne l’alerte si une ligne est visible', async () => {
    const { client } = fauxClient({ data: [{ id: 'x' }], error: null })
    const bilan = await controlerAccesAnonyme(client, ['reglages'])
    expect(bilan.protege).toBe(false)
    expect(bilan.tables).toEqual([{ table: 'reglages', verdict: 'exposee' }])
    expect(bilan.message).toContain('reglages')
  })

  it('ne conclut pas quand le réseau manque', async () => {
    const { client } = fauxClient('panne')
    const bilan = await controlerAccesAnonyme(client, ['reglages'])
    expect(bilan.protege).toBe(false)
    expect(bilan.tables).toEqual([{ table: 'reglages', verdict: 'indetermine' }])
  })

  it('ne conclut pas sur une erreur inattendue ni sans table', async () => {
    const { client } = fauxClient({ data: null, error: { code: 'XX000' }, status: 500 })
    expect((await controlerAccesAnonyme(client, ['reglages'])).protege).toBe(false)
    expect((await controlerAccesAnonyme(client, [])).protege).toBe(false)
  })
})
