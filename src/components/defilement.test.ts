import { describe, expect, it } from 'vitest'
import { suiteADroite } from './defilement'

describe('suiteADroite', () => {
  it('signale une suite cachée à droite, jusqu’au bout de la rangée', () => {
    expect(suiteADroite(0, 358, 440)).toBe(true)
    expect(suiteADroite(82, 358, 440)).toBe(false)
    // Un reste d'un pixel (arrondi) ne compte pas.
    expect(suiteADroite(81, 358, 440)).toBe(false)
    expect(suiteADroite(0, 358, 300)).toBe(false)
  })
})
