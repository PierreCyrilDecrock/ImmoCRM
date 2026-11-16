import { describe, expect, it } from 'vitest'
import { suivreReseau } from './etat-reseau'

describe('suivreReseau', () => {
  it('prévient à la perte et au retour du réseau, puis plus du tout une fois arrêté', () => {
    const source = new EventTarget()
    let appels = 0
    const arreter = suivreReseau(() => appels++, source)

    source.dispatchEvent(new Event('offline'))
    source.dispatchEvent(new Event('online'))
    expect(appels).toBe(2)

    arreter()
    source.dispatchEvent(new Event('offline'))
    expect(appels).toBe(2)
  })
})
