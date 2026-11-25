import { describe, expect, it } from 'vitest'
import {
  cranVoisin,
  CRANS_ZOOM,
  estSombre,
  explicationMode,
  explicationZoom,
  lirePreferences,
  PREFERENCES_PAR_DEFAUT,
} from './appareil'

describe('lirePreferences', () => {
  it('donne « auto » et 100 % quand rien n’est gardé ou lisible', () => {
    expect(lirePreferences(null)).toEqual(PREFERENCES_PAR_DEFAUT)
    expect(lirePreferences('pas du json')).toEqual(PREFERENCES_PAR_DEFAUT)
    expect(lirePreferences('42')).toEqual(PREFERENCES_PAR_DEFAUT)
  })

  it('relit un mode et un cran connus', () => {
    expect(lirePreferences('{"mode":"sombre","zoom":90}')).toEqual({ mode: 'sombre', zoom: 90 })
  })

  it('écarte un mode inconnu et un zoom hors des crans', () => {
    expect(lirePreferences('{"mode":"nuit","zoom":93}')).toEqual(PREFERENCES_PAR_DEFAUT)
  })
})

describe('cranVoisin', () => {
  it('va de 50 % à 125 %, cran par cran', () => {
    expect(CRANS_ZOOM[0]).toBe(50)
    expect(CRANS_ZOOM[CRANS_ZOOM.length - 1]).toBe(125)
    expect(cranVoisin(100, -1)).toBe(90)
    expect(cranVoisin(100, 1)).toBe(110)
    expect(cranVoisin(67, -1)).toBe(50)
  })

  it('reste au bout de l’échelle', () => {
    expect(cranVoisin(50, -1)).toBe(50)
    expect(cranVoisin(125, 1)).toBe(125)
  })

  it('repart de 100 % pour une valeur inconnue', () => {
    expect(cranVoisin(93, 1)).toBe(110)
  })
})

describe('mode', () => {
  it('« auto » suit l’appareil, les autres modes s’imposent', () => {
    expect(estSombre('auto', true)).toBe(true)
    expect(estSombre('auto', false)).toBe(false)
    expect(estSombre('clair', true)).toBe(false)
    expect(estSombre('sombre', false)).toBe(true)
  })

  it('explique le mode et dit l’état de l’appareil en « auto »', () => {
    expect(explicationMode('auto', true)).toContain('en ce moment : sombre')
    expect(explicationMode('clair', true)).toContain('Toujours clair')
  })
})

describe('explicationZoom', () => {
  it('prévient que les boutons rétrécissent sous 90 %', () => {
    expect(explicationZoom(80)).toContain('boutons compris')
    expect(explicationZoom(90)).toContain('44 px')
    expect(explicationZoom(100)).toBe('Taille d’origine.')
    expect(explicationZoom(125)).toContain('plus grand')
  })
})
