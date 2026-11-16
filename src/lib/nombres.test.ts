import { describe, expect, it } from 'vitest'
import { accorder, formaterNombre } from './nombres'

// Le séparateur de milliers français est une espace insécable : on la ramène à une espace.
const lisible = (texte: string) => texte.replace(/\s/g, ' ')

describe('formaterNombre', () => {
  it('sépare les milliers', () => {
    expect(lisible(formaterNombre(30000))).toBe('30 000')
    expect(formaterNombre(12)).toBe('12')
  })
})

describe('accorder', () => {
  it('met le mot au pluriel à partir de deux', () => {
    expect(accorder(0, 'contact')).toBe('0 contact')
    expect(accorder(1, 'contact')).toBe('1 contact')
    expect(lisible(accorder(1562, 'contact'))).toBe('1 562 contacts')
  })

  it('accepte un pluriel particulier', () => {
    expect(accorder(3, 'contact trouvé', 'contacts trouvés')).toBe('3 contacts trouvés')
  })
})
