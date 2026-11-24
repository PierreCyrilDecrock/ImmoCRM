import { describe, expect, it } from 'vitest'
import { bienEssai } from './bien-essai'
import { ligneBien, prixDeListe, typeCourt, typeEtSurface } from './liste-biens'

// Le séparateur de milliers français est une espace insécable : on la ramène à une espace.
const lisible = (texte: string) => texte.replace(/\s/g, ' ')

describe('prix d’une ligne', () => {
  it('écrit le prix en euros', () => {
    const prix = prixDeListe(285000)
    expect(lisible(prix.texte)).toBe('285 000 €')
    expect(prix.aFixer).toBe(false)
  })

  it('dit « Prix à fixer » quand il manque', () => {
    expect(prixDeListe(null)).toEqual({ texte: 'Prix à fixer', aFixer: true })
  })

  it('garde un prix nul : il est renseigné', () => {
    expect(prixDeListe(0).aFixer).toBe(false)
  })
})

describe('type court', () => {
  it('écrit « T3 » pour un appartement dont on connaît les pièces', () => {
    expect(typeCourt({ type: 'appartement', pieces: 3 })).toBe('T3')
    expect(typeCourt({ type: 'appartement', pieces: 1 })).toBe('T1')
  })

  it('garde « Appartement » sans nombre de pièces', () => {
    expect(typeCourt({ type: 'appartement', pieces: null })).toBe('Appartement')
    expect(typeCourt({ type: 'appartement', pieces: 0 })).toBe('Appartement')
  })

  it('nomme les autres types d’un mot', () => {
    expect(typeCourt({ type: 'maison', pieces: 5 })).toBe('Maison')
    expect(typeCourt({ type: 'terrain', pieces: null })).toBe('Terrain')
    expect(typeCourt({ type: 'commerce', pieces: 2 })).toBe('Commerce')
  })
})

describe('type et surface', () => {
  it('joint le type court et la surface', () => {
    expect(lisible(typeEtSurface(bienEssai({ pieces: 3, surface: 64 })))).toBe('T3 · 64 m²')
    expect(lisible(typeEtSurface(bienEssai({ type: 'maison', pieces: 5, surface: 118 })))).toBe(
      'Maison · 118 m²',
    )
  })

  it('prend la surface du terrain pour un terrain', () => {
    const terrain = bienEssai({
      type: 'terrain',
      categorie: null,
      surface: 10,
      surface_terrain: 1200,
    })
    expect(lisible(typeEtSurface(terrain))).toBe('Terrain · 1 200 m²')
  })

  it('écrit les décimales à la française', () => {
    expect(lisible(typeEtSurface(bienEssai({ pieces: 2, surface: 45.5 })))).toBe('T2 · 45,5 m²')
  })

  it('montre le type seul sans surface', () => {
    expect(typeEtSurface(bienEssai({ type: 'maison', surface: null }))).toBe('Maison')
  })
})

describe('ligne d’un bien', () => {
  it('donne l’adresse, le prix, le type et la surface, puis la commune', () => {
    const ligne = ligneBien(
      bienEssai({
        adresse: '8 impasse des Essais',
        code_postal: '00000',
        ville: 'Villefictive',
        prix: 320000,
        pieces: 4,
        surface: 82,
      }),
    )
    expect(ligne.adresse).toBe('8 impasse des Essais')
    expect(lisible(ligne.prix.texte)).toBe('320 000 €')
    expect(lisible(ligne.typeEtSurface)).toBe('T4 · 82 m²')
    expect(ligne.commune).toBe('00000 Villefictive')
  })

  it('n’a pas de troisième ligne sans commune', () => {
    expect(ligneBien(bienEssai()).commune).toBeNull()
    expect(ligneBien(bienEssai({ ville: 'Villefictive' })).commune).toBe('Villefictive')
  })
})
