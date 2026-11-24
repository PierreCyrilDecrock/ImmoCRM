import { describe, expect, it } from 'vitest'
import { formaterPrix, formaterSurface } from '../../lib/nombres'
import { bienEssai } from './bien-essai'
import { avecPhoto, prixEtSurface, RIEN_D_AUTRE_BIEN } from './fiche-bien'

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

describe('haut de la fiche et « À venir »', () => {
  it('ne réserve la place de la photo que s’il y en a une', () => {
    expect(avecPhoto(null)).toBe(false)
    expect(avecPhoto(0)).toBe(false)
    expect(avecPhoto(3)).toBe(true)
  })

  it('dit simplement qu’il n’y a rien d’autre après la prochaine tâche', () => {
    expect(RIEN_D_AUTRE_BIEN).toBe('Rien d’autre de prévu.')
  })
})
