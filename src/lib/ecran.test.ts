import { describe, expect, it } from 'vitest'
import { tailleDe } from './ecran'

describe('tailleDe', () => {
  it('donne la taille d’écran d’après les deux seuils', () => {
    expect(tailleDe(false, false)).toBe('telephone')
    expect(tailleDe(true, false)).toBe('tablette')
    expect(tailleDe(true, true)).toBe('ordinateur')
  })
})
