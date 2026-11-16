import { describe, expect, it } from 'vitest'
import { accorder, formaterNombre, formaterPrix, formaterSurface, lireNombre } from './nombres'

// Le séparateur de milliers français est une espace insécable : on la ramène à une espace.
const lisible = (texte: string) => texte.replace(/\s/g, ' ')

describe('formaterNombre', () => {
  it('sépare les milliers', () => {
    expect(lisible(formaterNombre(30000))).toBe('30 000')
    expect(formaterNombre(12)).toBe('12')
  })
})

describe('accorder', () => {
  it('met le mot au pluriel à partir de deux', () => {
    expect(accorder(0, 'contact')).toBe('0 contact')
    expect(accorder(1, 'contact')).toBe('1 contact')
    expect(lisible(accorder(1562, 'contact'))).toBe('1 562 contacts')
  })

  it('accepte un pluriel particulier', () => {
    expect(accorder(3, 'contact trouvé', 'contacts trouvés')).toBe('3 contacts trouvés')
  })
})

describe('formaterPrix, formaterSurface', () => {
  it('écrivent à la française, avec l’unité', () => {
    expect(lisible(formaterPrix(250000))).toBe('250 000 €')
    expect(lisible(formaterSurface(85.5))).toBe('85,5 m²')
    expect(lisible(formaterSurface(1200))).toBe('1 200 m²')
  })
})

describe('lireNombre', () => {
  it('lit un entier écrit avec des espaces ou une unité', () => {
    expect(lireNombre('250 000')).toBe(250000)
    expect(lireNombre('250\u202f000 €')).toBe(250000)
    expect(lireNombre(' 0 ')).toBe(0)
  })

  it('lit des décimales quand elles sont acceptées', () => {
    expect(lireNombre('85,5 m²', 2)).toBe(85.5)
    expect(lireNombre('33.33 %', 2)).toBe(33.33)
    expect(lireNombre('85,5')).toBe('invalide')
    expect(lireNombre('85,555', 2)).toBe('invalide')
  })

  it('distingue une saisie vide d’une saisie illisible', () => {
    expect(lireNombre('')).toBeNull()
    expect(lireNombre('   ')).toBeNull()
    expect(lireNombre('€')).toBe('invalide')
    expect(lireNombre('cher')).toBe('invalide')
    expect(lireNombre('-5')).toBe('invalide')
  })
})
