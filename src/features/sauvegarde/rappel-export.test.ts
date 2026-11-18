import { describe, expect, it } from 'vitest'
import {
  ancienneteExport,
  exportARappeler,
  formaterMoment,
  joursDepuisExport,
  JOURS_ENTRE_EXPORTS,
} from './rappel-export'

describe('joursDepuisExport', () => {
  it('compte les jours de Paris écoulés depuis l’export', () => {
    expect(joursDepuisExport('2026-11-18T08:00:00Z', '2026-11-18')).toBe(0)
    expect(joursDepuisExport('2026-11-11T08:00:00Z', '2026-11-18')).toBe(7)
  })

  it('compte le jour de Paris, pas le jour en temps universel', () => {
    // 23 h 30 le 17 en temps universel, c'est déjà le 18 à Paris.
    expect(joursDepuisExport('2026-11-17T23:30:00Z', '2026-11-18')).toBe(0)
  })

  it('ne sait rien sans export ou avec une date illisible', () => {
    expect(joursDepuisExport(null, '2026-11-18')).toBeNull()
    expect(joursDepuisExport('pas une date', '2026-11-18')).toBeNull()
  })
})

describe('exportARappeler', () => {
  it('rappelle quand aucun export n’a jamais été fait', () => {
    expect(exportARappeler(null, '2026-11-18')).toBe(true)
  })

  it('ne rappelle pas pendant les 6 jours qui suivent un export', () => {
    expect(exportARappeler('2026-11-18T08:00:00Z', '2026-11-18')).toBe(false)
    expect(exportARappeler('2026-11-12T08:00:00Z', '2026-11-18')).toBe(false)
  })

  it('rappelle à partir du 7e jour', () => {
    expect(JOURS_ENTRE_EXPORTS).toBe(7)
    expect(exportARappeler('2026-11-11T08:00:00Z', '2026-11-18')).toBe(true)
    expect(exportARappeler('2026-10-01T08:00:00Z', '2026-11-18')).toBe(true)
  })
})

describe('ancienneteExport', () => {
  it('dit l’ancienneté en mots simples', () => {
    expect(ancienneteExport(0)).toBe("aujourd'hui")
    expect(ancienneteExport(1)).toBe('hier')
    expect(ancienneteExport(9)).toBe('il y a 9 jours')
  })
})

describe('formaterMoment', () => {
  it('donne le jour et l’heure de Paris', () => {
    expect(formaterMoment('2026-11-18T09:32:00Z')).toBe('le 18 novembre 2026 à 10 h 32')
    expect(formaterMoment('2026-07-01T07:00:00Z')).toBe('le 1 juillet 2026 à 9 h')
  })

  it('ne dit rien d’une date illisible', () => {
    expect(formaterMoment('???')).toBe('')
  })
})
