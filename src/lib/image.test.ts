import { describe, expect, it } from 'vitest'
import { dimensionsReduites, encoderSousPoids, POIDS_MAX_PHOTO, type Dimensions } from './image'

describe('dimensionsReduites', () => {
  it('ramène le plus grand côté à la limite, en gardant les proportions', () => {
    expect(dimensionsReduites({ largeur: 4000, hauteur: 3000 }, 1600)).toEqual({
      largeur: 1600,
      hauteur: 1200,
    })
    expect(dimensionsReduites({ largeur: 3000, hauteur: 4000 }, 1600)).toEqual({
      largeur: 1200,
      hauteur: 1600,
    })
  })

  it('n’agrandit jamais une petite image', () => {
    expect(dimensionsReduites({ largeur: 800, hauteur: 600 }, 1600)).toEqual({
      largeur: 800,
      hauteur: 600,
    })
  })

  it('ne descend jamais sous un pixel', () => {
    expect(dimensionsReduites({ largeur: 10000, hauteur: 2 }, 400)).toEqual({
      largeur: 400,
      hauteur: 1,
    })
  })
})

describe('encoderSousPoids', () => {
  /** Faux encodeur : le poids dépend du nombre de pixels et de la qualité. */
  const encodeur = (octetsParPixel: number) => {
    const essais: [Dimensions, number][] = []
    const encoder = (dimensions: Dimensions, qualite: number) => {
      essais.push([dimensions, qualite])
      return Promise.resolve({
        size: Math.round(dimensions.largeur * dimensions.hauteur * octetsParPixel * qualite),
      })
    }
    return { essais, encoder }
  }
  const DEPART = { largeur: 1600, hauteur: 1200 }

  it('garde la meilleure qualité quand elle tient déjà sous la limite', async () => {
    const { essais, encoder } = encodeur(0.1)
    const resultat = await encoderSousPoids(DEPART, encoder, POIDS_MAX_PHOTO)
    expect(resultat?.dimensions).toEqual(DEPART)
    expect(essais).toEqual([[DEPART, 0.82]])
  })

  it('baisse la qualité avant de toucher à la taille', async () => {
    const { essais, encoder } = encodeur(0.25)
    const resultat = await encoderSousPoids(DEPART, encoder, POIDS_MAX_PHOTO)
    expect(resultat?.dimensions).toEqual(DEPART)
    expect(resultat?.image.size).toBeLessThanOrEqual(POIDS_MAX_PHOTO)
    expect(essais.map(([, qualite]) => qualite)).toEqual([0.82, 0.7, 0.58])
  })

  it('réduit l’image quand la qualité ne suffit pas', async () => {
    const { encoder } = encodeur(1)
    const resultat = await encoderSousPoids(DEPART, encoder, POIDS_MAX_PHOTO)
    expect(resultat).not.toBeNull()
    expect(resultat?.image.size).toBeLessThanOrEqual(POIDS_MAX_PHOTO)
    expect(resultat?.dimensions.largeur).toBeLessThan(1600)
    // Les proportions sont conservées.
    const { largeur = 0, hauteur = 1 } = resultat?.dimensions ?? {}
    expect(largeur / hauteur).toBeCloseTo(4 / 3, 1)
  })

  it('renonce si rien ne tient sous la limite', async () => {
    const encoder = () => Promise.resolve({ size: POIDS_MAX_PHOTO + 1 })
    expect(await encoderSousPoids(DEPART, encoder, POIDS_MAX_PHOTO)).toBeNull()
  })
})
