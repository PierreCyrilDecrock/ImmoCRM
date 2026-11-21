import { describe, expect, it } from 'vitest'
import { decalageGlisse, resteOuverte, sensDuGeste, ZONE_MORTE_PX } from './glisser'

describe('sensDuGeste', () => {
  it('ne décide rien tant que le doigt a à peine bougé : c’est un toucher', () => {
    expect(sensDuGeste(0, 0)).toBeNull()
    expect(sensDuGeste(ZONE_MORTE_PX - 1, -(ZONE_MORTE_PX - 1))).toBeNull()
  })

  it('suit le doigt quand il part de côté', () => {
    expect(sensDuGeste(-30, 8)).toBe('horizontal')
    expect(sensDuGeste(25, -5)).toBe('horizontal')
  })

  it('laisse défiler la liste quand le doigt part vers le haut ou le bas', () => {
    expect(sensDuGeste(-8, 30)).toBe('vertical')
    expect(sensDuGeste(12, -40)).toBe('vertical')
    // À égalité, on préfère le défilement.
    expect(sensDuGeste(-20, 20)).toBe('vertical')
  })
})

describe('decalageGlisse', () => {
  const largeur = 160

  it('suit le doigt vers la gauche', () => {
    expect(decalageGlisse(0, -50, largeur)).toBe(-50)
    expect(decalageGlisse(-160, 40, largeur)).toBe(-120)
  })

  it('ne part jamais vers la droite', () => {
    expect(decalageGlisse(0, 60, largeur)).toBe(0)
    expect(decalageGlisse(-160, 300, largeur)).toBe(0)
  })

  it('freine au-delà des actions', () => {
    expect(decalageGlisse(0, -200, largeur)).toBe(-170)
  })
})

describe('resteOuverte', () => {
  const largeur = 160

  it('se remet en place quand on relâche avant le seuil', () => {
    expect(resteOuverte(0, largeur)).toBe(false)
    expect(resteOuverte(-80, largeur)).toBe(false) // à moitié
    expect(resteOuverte(-95, largeur)).toBe(false)
  })

  it('reste ouverte au-delà du seuil', () => {
    expect(resteOuverte(-96, largeur)).toBe(true)
    expect(resteOuverte(-160, largeur)).toBe(true)
    expect(resteOuverte(-175, largeur)).toBe(true)
  })
})
