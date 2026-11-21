import { describe, expect, it } from 'vitest'
import { estAnnulation } from './clavier'

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
