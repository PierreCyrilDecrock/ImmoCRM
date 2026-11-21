import { describe, expect, it } from 'vitest'
import { ecouterOuvertureMenu, ouvrirMenuCreation } from './ouverture'

describe('ouvrirMenuCreation', () => {
  it('prévient qui écoute, et plus personne une fois l’écoute arrêtée', () => {
    let ouvertures = 0
    const arreter = ecouterOuvertureMenu(() => ouvertures++)
    ouvrirMenuCreation()
    expect(ouvertures).toBe(1)
    arreter()
    ouvrirMenuCreation()
    expect(ouvertures).toBe(1)
  })
})
