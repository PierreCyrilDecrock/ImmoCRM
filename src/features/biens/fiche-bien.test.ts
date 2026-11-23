import { describe, expect, it } from 'vitest'
import { formaterPrix, formaterSurface } from '../../lib/nombres'
import { bienEssai } from './bien-essai'
import { prixEtSurface } from './fiche-bien'

describe('prixEtSurface', () => {
  it('donne le prix et la surface connus', () => {
    expect(prixEtSurface(bienEssai({ prix: 245000, surface: 82 }))).toBe(
      `${formaterPrix(245000)} · ${formaterSurface(82)}`,
    )
    expect(prixEtSurface(bienEssai({ prix: null, surface: 82 }))).toBe(formaterSurface(82))
    expect(prixEtSurface(bienEssai({ prix: null, surface: null }))).toBe('')
  })

  it('prend la surface du terrain pour un terrain', () => {
    expect(
      prixEtSurface(
        bienEssai({ type: 'terrain', categorie: null, prix: 60000, surface_terrain: 900 }),
      ),
    ).toBe(`${formaterPrix(60000)} · ${formaterSurface(900)}`)
  })
})
