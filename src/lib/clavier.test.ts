import { describe, expect, it } from 'vitest'
import {
  estAnnulation,
  estAppareilApple,
  estEnregistrement,
  rappelEnregistrer,
  rappelRecherche,
} from './clavier'

const appui = { key: 'z', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }

describe('estAnnulation', () => {
  it('reconnaît Ctrl Z et ⌘ Z', () => {
    expect(estAnnulation({ ...appui, ctrlKey: true, dansUnChamp: false })).toBe(true)
    expect(estAnnulation({ ...appui, key: 'Z', metaKey: true, dansUnChamp: false })).toBe(true)
  })

  it('laisse Ctrl Z défaire la saisie dans un champ', () => {
    expect(estAnnulation({ ...appui, ctrlKey: true, dansUnChamp: true })).toBe(false)
  })

  it('ignore la touche seule et les autres combinaisons', () => {
    expect(estAnnulation({ ...appui, dansUnChamp: false })).toBe(false)
    expect(estAnnulation({ ...appui, ctrlKey: true, shiftKey: true, dansUnChamp: false })).toBe(
      false,
    )
    expect(estAnnulation({ ...appui, key: 'y', ctrlKey: true, dansUnChamp: false })).toBe(false)
  })
})

describe('rappelRecherche', () => {
  it('montre ⌘K sur un Mac ou un iPad', () => {
    expect(rappelRecherche('macOS')).toBe('⌘K')
    expect(rappelRecherche('MacIntel')).toBe('⌘K')
    expect(rappelRecherche('iPad')).toBe('⌘K')
    expect(estAppareilApple('iPhone')).toBe(true)
  })

  it('montre Ctrl K ailleurs, et quand le système est inconnu', () => {
    expect(rappelRecherche('Windows')).toBe('Ctrl K')
    expect(rappelRecherche('Linux x86_64')).toBe('Ctrl K')
    expect(rappelRecherche('')).toBe('Ctrl K')
  })
})

describe('estEnregistrement', () => {
  const appui = { key: 'Enter', ctrlKey: false, metaKey: false, altKey: false }

  it('reconnaît ⌘ Entrée et Ctrl Entrée', () => {
    expect(estEnregistrement({ ...appui, metaKey: true })).toBe(true)
    expect(estEnregistrement({ ...appui, ctrlKey: true })).toBe(true)
  })

  it('laisse Entrée seule passer à la ligne', () => {
    expect(estEnregistrement(appui)).toBe(false)
    expect(estEnregistrement({ ...appui, ctrlKey: true, altKey: true })).toBe(false)
    expect(estEnregistrement({ ...appui, key: 'a', ctrlKey: true })).toBe(false)
  })
})

describe('rappelEnregistrer', () => {
  it('suit le système', () => {
    expect(rappelEnregistrer('MacIntel')).toBe('⌘ Entrée')
    expect(rappelEnregistrer('Win32')).toBe('Ctrl Entrée')
  })
})
