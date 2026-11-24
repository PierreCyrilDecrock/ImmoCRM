import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { contactEssai } from './contact-essai'
import {
  detailSansActionAccueil,
  ilYaCourt,
  lireJamaisContactes,
  ordreSansAction,
} from './jamais-contactes'

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

describe('contacts sans prochaine action à l’accueil (étape F.2)', () => {
  const contact = (id: string, roles: string[], temperature: string | null) =>
    contactEssai({ id, roles: roles as never, temperature: temperature as never })

  it('range vendeurs et acquéreurs d’abord, les plus chauds en tête, puis les partenaires', () => {
    const rangs = ordreSansAction([
      contact('notaire', ['notaire'], null),
      contact('acquereur-froid', ['acquereur'], 'froid'),
      contact('prescripteur-chaud', ['prescripteur'], 'chaud'),
      contact('vendeur-sans', ['vendeur'], null),
      contact('vendeur-chaud', ['vendeur'], 'chaud'),
      contact('prospect', [], 'tiede'),
      contact('acquereur-tiede', ['acquereur'], 'tiede'),
    ]).map((c) => c.id)
    expect(rangs).toEqual([
      'vendeur-chaud',
      'acquereur-tiede',
      'acquereur-froid',
      'vendeur-sans',
      'prescripteur-chaud',
      'prospect',
      'notaire',
    ])
  })

  it('garde l’ordre reçu à égalité (les plus récents d’abord)', () => {
    const rangs = ordreSansAction([
      contact('b', ['vendeur'], 'chaud'),
      contact('a', ['acquereur'], 'chaud'),
    ]).map((c) => c.id)
    expect(rangs).toEqual(['b', 'a'])
  })

  it('dit l’ancienneté en jours, puis en semaines et en mois', () => {
    expect(ilYaCourt(0)).toBe('aujourd’hui')
    expect(ilYaCourt(1)).toBe('hier')
    expect(ilYaCourt(5)).toBe('il y a 5 j')
    expect(ilYaCourt(21)).toBe('il y a 3 sem.')
    expect(ilYaCourt(90)).toBe('il y a 3 mois')
    expect(ilYaCourt(400)).toBe('il y a plus d’un an')
  })

  it('donne le rôle puis « jamais contacté » ou le dernier échange', () => {
    const neuf = contactEssai({
      roles: ['vendeur'],
      dernier_contact_le: '2026-11-22',
      collecte_date: '2026-11-22',
    })
    expect(detailSansActionAccueil(neuf, '2026-11-24', true)).toBe('Vendeur · jamais contacté')
    expect(detailSansActionAccueil(neuf, '2026-11-24', undefined)).toBe('Vendeur')
    const ancien = contactEssai({
      roles: ['notaire'],
      dernier_contact_le: '2026-11-03',
      collecte_date: '2026-09-01',
    })
    expect(detailSansActionAccueil(ancien, '2026-11-24', undefined)).toBe('Notaire · il y a 3 sem.')
  })
})
