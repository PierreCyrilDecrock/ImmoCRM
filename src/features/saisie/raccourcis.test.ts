import { describe, expect, it } from 'vitest'
import { raccourciDe, type Appui } from './raccourcis'

function appui(key: string, options: Partial<Appui> = {}): Appui {
  return { key, ctrlKey: false, metaKey: false, altKey: false, dansUnChamp: false, ...options }
}

describe('raccourciDe', () => {
  it('mène à la recherche par « / », Ctrl+K ou ⌘K', () => {
    expect(raccourciDe(appui('/'))).toEqual({ genre: 'recherche' })
    expect(raccourciDe(appui('k', { ctrlKey: true }))).toEqual({ genre: 'recherche' })
    expect(raccourciDe(appui('K', { metaKey: true }))).toEqual({ genre: 'recherche' })
  })

  it('Ctrl+K marche même depuis un champ ; « / » non (il s’écrit)', () => {
    expect(raccourciDe(appui('k', { ctrlKey: true, dansUnChamp: true }))).toEqual({
      genre: 'recherche',
    })
    expect(raccourciDe(appui('/', { dansUnChamp: true }))).toBeNull()
  })

  it('ouvre le menu de création par « N »', () => {
    expect(raccourciDe(appui('n'))).toEqual({ genre: 'menu' })
    expect(raccourciDe(appui('N'))).toEqual({ genre: 'menu' })
  })

  it('crée directement par la lettre de chaque création', () => {
    expect(raccourciDe(appui('c'))).toEqual({ genre: 'creer', creation: 'contact' })
    expect(raccourciDe(appui('a'))).toEqual({ genre: 'creer', creation: 'activite' })
    expect(raccourciDe(appui('t'))).toEqual({ genre: 'creer', creation: 'tache' })
    expect(raccourciDe(appui('b'))).toEqual({ genre: 'creer', creation: 'bien' })
    expect(raccourciDe(appui('D'))).toEqual({ genre: 'creer', creation: 'demande' })
  })

  it('laisse les touches écrire dans un champ', () => {
    expect(raccourciDe(appui('c', { dansUnChamp: true }))).toBeNull()
    expect(raccourciDe(appui('n', { dansUnChamp: true }))).toBeNull()
  })

  it('laisse passer les raccourcis du navigateur et les autres touches', () => {
    expect(raccourciDe(appui('c', { ctrlKey: true }))).toBeNull()
    expect(raccourciDe(appui('t', { metaKey: true }))).toBeNull()
    expect(raccourciDe(appui('n', { altKey: true }))).toBeNull()
    expect(raccourciDe(appui('x'))).toBeNull()
    expect(raccourciDe(appui('Enter'))).toBeNull()
  })
})
