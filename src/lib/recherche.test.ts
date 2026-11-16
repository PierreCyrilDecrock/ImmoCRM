import { describe, expect, it } from 'vitest'
import { MAX_TERMES, normaliserRecherche, termesRecherche } from './recherche'

describe('normaliserRecherche', () => {
  it('retire les accents et les majuscules', () => {
    expect(normaliserRecherche('Hélène SPÉCIMEN')).toBe('helene specimen')
    expect(normaliserRecherche('Œuvre Lætitia')).toBe('oeuvre laetitia')
  })

  it('remplace tirets et apostrophes par des espaces', () => {
    expect(normaliserRecherche("Jean-Pierre de l'Essai")).toBe('jean pierre de l essai')
    expect(normaliserRecherche('L’Haÿ')).toBe('l hay')
  })

  it('retire les caractères jokers et les espaces en trop', () => {
    expect(normaliserRecherche('  50%  de_tout \\ *  ')).toBe('50 de tout')
  })
})

describe('termesRecherche', () => {
  it('découpe la saisie en mots sans accent ni majuscule', () => {
    expect(termesRecherche('  Camille   FICTIF ')).toEqual(['camille', 'fictif'])
    expect(termesRecherche('')).toEqual([])
  })

  it('trouve le même téléphone quel que soit le format saisi', () => {
    expect(termesRecherche('0612')).toEqual(['0612'])
    expect(termesRecherche('06 12')).toEqual(['0612'])
    expect(termesRecherche('06.12.34')).toEqual(['061234'])
    expect(termesRecherche('06-12')).toEqual(['0612'])
    expect(termesRecherche('+33612')).toEqual(['33612'])
    expect(termesRecherche('+33 6 12')).toEqual(['33612'])
    expect(termesRecherche('+33 (0)6 12')).toEqual(['33612'])
    expect(termesRecherche('0033 6 12')).toEqual(['33612'])
  })

  it('mêle un nom et un téléphone', () => {
    expect(termesRecherche('fictif 06 39 98')).toEqual(['fictif', '063998'])
  })

  it('ne prend pas un numéro de rue ou un code postal pour un téléphone', () => {
    expect(termesRecherche("12 rue de l'Exemple")).toEqual(['12', 'rue', 'de', 'l', 'exemple'])
    expect(termesRecherche('69600 Oullins')).toEqual(['69600', 'oullins'])
  })

  it('garde un courriel en un seul mot', () => {
    expect(termesRecherche('Camille.Fictif@exemple.invalid')).toEqual([
      'camille.fictif@exemple.invalid',
    ])
  })

  it('retire les répétitions et limite le nombre de mots', () => {
    expect(termesRecherche('lac lac LAC')).toEqual(['lac'])
    expect(termesRecherche('a b c d e f g h i j k')).toHaveLength(MAX_TERMES)
  })
})
