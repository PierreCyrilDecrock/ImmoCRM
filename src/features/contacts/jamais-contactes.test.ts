import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { lireJamaisContactes } from './jamais-contactes'

describe('lireJamaisContactes', () => {
  it('lit en une fois la dernière activité des fiches demandées', async () => {
    const { client, appels } = fauxClient({ data: [{ contact_id: 'a' }], error: null })
    const resultat = await lireJamaisContactes(client, ['a', 'b'])
    expect(appels).toEqual([['rpc', 'dernieres_activites', { p_contacts: ['a', 'b'] }]])
    expect(resultat.ok && [...resultat.donnees]).toEqual([
      ['a', false],
      ['b', true],
    ])
  })

  it('reste bornée à 200 fiches', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    const ids = Array.from({ length: 250 }, (_, rang) => `c${rang}`)
    const resultat = await lireJamaisContactes(client, ids)
    expect((appels[0]?.[2] as { p_contacts: string[] }).p_contacts).toHaveLength(200)
    expect(resultat.ok && resultat.donnees.size).toBe(200)
  })

  it('transmet l’échec, sans rien conclure', async () => {
    const { client } = fauxClient({ data: null, error: { message: 'refus' } })
    expect((await lireJamaisContactes(client, ['a'])).ok).toBe(false)
  })
})
