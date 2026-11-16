import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  ajouterProprietaire,
  formaterQuotePart,
  lireQuotePart,
  listerBiensDuContact,
  listerProprietaires,
  remarqueQuotesParts,
  retirerProprietaire,
} from './proprietaires'

describe('lireQuotePart', () => {
  it('lit un pourcentage, avec ou sans décimales', () => {
    expect(lireQuotePart('50')).toBe(50)
    expect(lireQuotePart('33,33 %')).toBe(33.33)
    expect(lireQuotePart('100')).toBe(100)
  })

  it('accepte une quote-part laissée vide', () => {
    expect(lireQuotePart('')).toBeNull()
  })

  it('refuse zéro, plus de 100 et ce qui n’est pas un nombre', () => {
    expect(lireQuotePart('0')).toBe('invalide')
    expect(lireQuotePart('120')).toBe('invalide')
    expect(lireQuotePart('moitié')).toBe('invalide')
  })
})

describe('remarqueQuotesParts', () => {
  it('ne dit rien quand le total tombe juste ou que rien n’est renseigné', () => {
    expect(remarqueQuotesParts([50, 50])).toBeNull()
    expect(remarqueQuotesParts([33.33, 33.33, 33.34])).toBeNull()
    expect(remarqueQuotesParts([null, null])).toBeNull()
    expect(remarqueQuotesParts([])).toBeNull()
  })

  it('signale un total qui dépasse 100 %', () => {
    expect(remarqueQuotesParts([60, 50])).toBe('Le total des quotes-parts dépasse 100 % (110 %).')
  })

  it('signale un total incomplet seulement si toutes les parts sont connues', () => {
    expect(remarqueQuotesParts([50, 25])).toBe('Le total des quotes-parts ne fait que 75 %.')
    expect(remarqueQuotesParts([50, null])).toBeNull()
  })
})

describe('formaterQuotePart', () => {
  it('écrit le pourcentage à la française', () => {
    expect(formaterQuotePart(33.33)).toBe('33,33 %')
    expect(formaterQuotePart(50)).toBe('50 %')
  })
})

describe('accès aux données', () => {
  it('ne lit pas les contacts quand le bien n’a aucun propriétaire', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    const resultat = await listerProprietaires(client, 'b1')
    expect(resultat).toEqual({ ok: true, donnees: [] })
    expect(appels.filter((appel) => appel[0] === 'from')).toEqual([['from', 'biens_proprietaires']])
    expect(appels).toContainEqual(['eq', 'bien_id', 'b1'])
    expect(appels).toContainEqual(['is', 'archived_at', null])
  })

  it('lit aussi les liens retirés pour l’export d’un contact', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerBiensDuContact(client, 'c1', 'avec')
    expect(appels).toContainEqual(['eq', 'contact_id', 'c1'])
    expect(appels).not.toContainEqual(['is', 'archived_at', null])
  })

  it('ajoute un propriétaire avec sa quote-part', async () => {
    const { client, appels } = fauxClient({ data: { id: 'l1' }, error: null })
    await ajouterProprietaire(client, { bienId: 'b1', contactId: 'c1', quotePart: 50 })
    expect(appels).toContainEqual(['insert', { bien_id: 'b1', contact_id: 'c1', quote_part: 50 }])
  })

  it('retire un propriétaire en archivant le lien, sans rien supprimer', async () => {
    const { client, appels } = fauxClient({ data: { id: 'l1' }, error: null })
    await retirerProprietaire(client, 'l1')
    expect(appels.map((appel) => appel[0])).not.toContain('delete')
    expect(appels[1]).toEqual(['update', { archived_at: expect.any(String) }])
  })
})
