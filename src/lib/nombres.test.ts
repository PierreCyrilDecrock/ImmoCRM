import { describe, expect, it } from 'vitest'
import {
  accorder,
  formaterNombre,
  formaterPoids,
  formaterPrix,
  montantCourt,
  formaterSurface,
  fourchetteCourte,
  lireNombre,
} from './nombres'

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

describe('formaterPoids', () => {
  it('choisit l’unité selon la taille', () => {
    expect(formaterPoids(0)).toBe('0 octet')
    expect(formaterPoids(512)).toBe('512 octets')
    expect(lisible(formaterPoids(245_300))).toBe('245 Ko')
    expect(lisible(formaterPoids(3_420_000))).toBe('3,4 Mo')
    expect(lisible(formaterPoids(1_000_000_000))).toBe('1 Go')
    expect(lisible(formaterPoids(1_250_000_000))).toBe('1,25 Go')
  })

  it('ne montre jamais « 1 000 Ko »', () => {
    expect(lisible(formaterPoids(999_800))).toBe('1 Mo')
  })
})

describe('montants courts', () => {
  it('écrit un montant en €, en k€ ou en M€, arrondi', () => {
    expect(lisible(montantCourt(850))).toBe('850 €')
    expect(lisible(montantCourt(415_000))).toBe('415 k€')
    expect(lisible(montantCourt(412_600))).toBe('413 k€')
    expect(lisible(montantCourt(999_600))).toBe('1 M€')
    expect(lisible(montantCourt(1_250_000))).toBe('1,25 M€')
  })

  it('garde l’unité avec son nombre', () => {
    expect(montantCourt(720_000)).toBe('720\u00a0k€')
  })

  it('écrit une fourchette avec une seule unité', () => {
    expect(lisible(fourchetteCourte(410_000, 440_000))).toBe('410 – 440 k€')
    expect(lisible(fourchetteCourte(440_000, 410_000))).toBe('410 – 440 k€')
    expect(lisible(fourchetteCourte(1_200_000, 1_500_000))).toBe('1,2 – 1,5 M€')
  })

  it('écrit les deux unités quand elles diffèrent, un seul montant s’ils sont égaux', () => {
    expect(lisible(fourchetteCourte(850_000, 1_200_000))).toBe('850 k€ – 1,2 M€')
    expect(lisible(fourchetteCourte(300_000, 300_400))).toBe('300 k€')
  })
})
