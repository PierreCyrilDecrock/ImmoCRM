import { describe, expect, it } from 'vitest'
import { copierTexte } from './presse-papiers'

describe('copierTexte', () => {
  it('copie le texte et le confirme', async () => {
    const copies: string[] = []
    const reussi = await copierTexte('06 12 34 56 78', {
      writeText: (texte) => {
        copies.push(texte)
        return Promise.resolve()
      },
    })
    expect(reussi).toBe(true)
    expect(copies).toEqual(['06 12 34 56 78'])
  })

  it('signale un refus du navigateur', async () => {
    const reussi = await copierTexte('x', {
      writeText: () => Promise.reject(new Error('NotAllowedError')),
    })
    expect(reussi).toBe(false)
  })

  it('signale un navigateur sans presse-papiers', async () => {
    expect(await copierTexte('x', null)).toBe(false)
  })
})
