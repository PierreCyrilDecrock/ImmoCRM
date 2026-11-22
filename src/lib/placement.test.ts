import { describe, expect, it } from 'vitest'
import { placerMenu } from './placement'

const ecran = { largeur: 1280, hauteur: 800 }
const menu = { largeur: 256, hauteur: 200 }

describe('placerMenu', () => {
  it('pose le menu sous le bouton, aligné sur son bord droit', () => {
    expect(placerMenu({ haut: 100, bas: 144, gauche: 500, droite: 544 }, menu, ecran)).toEqual({
      haut: 152,
      gauche: 288,
    })
  })

  it('le garde dans l’écran à gauche', () => {
    expect(placerMenu({ haut: 100, bas: 144, gauche: 10, droite: 54 }, menu, ecran).gauche).toBe(8)
  })

  it('l’ouvre au-dessus quand la place manque dessous', () => {
    expect(placerMenu({ haut: 700, bas: 744, gauche: 500, droite: 544 }, menu, ecran).haut).toBe(
      492,
    )
  })
})
