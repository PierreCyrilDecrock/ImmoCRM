import { describe, expect, it } from 'vitest'
import { ajouterDictee, messageErreurDictee, partNouvelle, ponctuerDictee } from './dictee'

describe('ponctuerDictee', () => {
  it('remplace la ponctuation dite par les signes', () => {
    expect(ponctuerDictee('bel appartement virgule lumineux point final')).toBe(
      'bel appartement, lumineux.',
    )
    expect(ponctuerDictee('est-ce disponible point d’interrogation')).toBe('est-ce disponible ?')
    expect(ponctuerDictee("super point d'exclamation")).toBe('super !')
    expect(ponctuerDictee('cuisine refaite point-virgule parquet ancien')).toBe(
      'cuisine refaite ; parquet ancien',
    )
  })

  it('passe à la ligne sur demande', () => {
    expect(ponctuerDictee('premier point à la ligne second')).toBe('premier.\nsecond')
    expect(ponctuerDictee('premier à la ligne second')).toBe('premier\nsecond')
    expect(ponctuerDictee('premier nouvelle ligne second')).toBe('premier\nsecond')
  })

  it('laisse les mots « point » et « deux points » quand ils ne sont pas de la ponctuation', () => {
    expect(ponctuerDictee('un point positif et deux points négatifs')).toBe(
      'un point positif et deux points négatifs',
    )
  })

  it('nettoie les espaces en trop', () => {
    expect(ponctuerDictee('  rappeler   demain  ')).toBe('rappeler demain')
    expect(ponctuerDictee('')).toBe('')
  })
})

describe('ajouterDictee', () => {
  it('met une majuscule en début de champ', () => {
    expect(ajouterDictee('', 'visite avec les acquéreurs')).toBe('Visite avec les acquéreurs')
  })

  it('ajoute un espace et garde la minuscule quand la phrase continue', () => {
    expect(ajouterDictee('Visite avec', 'les acquéreurs')).toBe('Visite avec les acquéreurs')
    expect(ajouterDictee('Visite avec ', 'les acquéreurs')).toBe('Visite avec les acquéreurs')
  })

  it('met une majuscule après une fin de phrase ou un retour à la ligne', () => {
    expect(ajouterDictee('Bonne visite.', 'ils reviennent samedi')).toBe(
      'Bonne visite. Ils reviennent samedi',
    )
    expect(ajouterDictee('Bonne visite\n', 'ils reviennent')).toBe('Bonne visite\nIls reviennent')
    expect(ajouterDictee('', 'bien point final ils rappellent à la ligne merci')).toBe(
      'Bien. Ils rappellent\nMerci',
    )
  })

  it('colle la virgule et le point au mot précédent', () => {
    expect(ajouterDictee('Lumineux ', 'virgule calme')).toBe('Lumineux, calme')
    expect(ajouterDictee('Lumineux', 'point final')).toBe('Lumineux.')
  })

  it('garde un espace avant le point d’interrogation', () => {
    expect(ajouterDictee('Est-ce libre', 'point d’interrogation')).toBe('Est-ce libre ?')
  })

  it('ne change rien quand rien n’a été reconnu', () => {
    expect(ajouterDictee('Texte', '   ')).toBe('Texte')
  })

  it('respecte la longueur maximale du champ', () => {
    expect(ajouterDictee('Abc', 'défghij', 8)).toBe('Abc défg')
    expect(ajouterDictee('Abcdefgh', 'suite', 8)).toBe('Abcdefgh')
  })
})

describe('partNouvelle', () => {
  it('rend tout le résultat quand il ne reprend pas le précédent', () => {
    expect(partNouvelle('', 'bonjour')).toBe('bonjour')
    expect(partNouvelle('bonjour', 'les acquéreurs')).toBe('les acquéreurs')
  })

  it('ne garde que la suite quand le résultat reprend le précédent (Android)', () => {
    expect(partNouvelle('bonjour', 'bonjour je viens')).toBe('je viens')
    expect(partNouvelle('Bonjour', 'bonjour je viens')).toBe('je viens')
    expect(partNouvelle('bonjour je viens', 'bonjour je viens')).toBe('')
  })
})

describe('messageErreurDictee', () => {
  it('ne signale ni le silence ni un arrêt voulu', () => {
    expect(messageErreurDictee('no-speech')).toBeNull()
    expect(messageErreurDictee('aborted')).toBeNull()
  })

  it('explique en français un micro refusé et propose le micro du clavier', () => {
    expect(messageErreurDictee('not-allowed')).toContain('micro du clavier')
    expect(messageErreurDictee('network')).toContain('Internet')
    expect(messageErreurDictee('inconnue')).toContain('Dicter')
  })
})

describe('ponctuerDictee et les nombres', () => {
  it('ne coupe pas un nombre décimal', () => {
    expect(ponctuerDictee('3,5 pièces et 1.5 étage')).toBe('3,5 pièces et 1.5 étage')
  })
})
