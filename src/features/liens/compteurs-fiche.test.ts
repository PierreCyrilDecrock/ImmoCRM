import { describe, expect, it } from 'vitest'
import { sommeOuNull } from './compteurs-fiche'

describe('sommeOuNull', () => {
  it('additionne les comptages, ou renonce si l’un a échoué', () => {
    expect(sommeOuNull([2, 0, 3])).toBe(5)
    expect(sommeOuNull([])).toBe(0)
    expect(sommeOuNull([2, null])).toBeNull()
  })
})
