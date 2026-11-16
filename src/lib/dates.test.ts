import { describe, expect, it } from 'vitest'
import { dateDuJour, estDateValide, formaterDate } from './dates'

describe('formaterDate', () => {
  it('écrit la date en toutes lettres, à la française', () => {
    expect(formaterDate('2026-11-16T09:00:00Z')).toBe('16 novembre 2026')
    expect(formaterDate('2026-03-01T12:00:00+00:00')).toBe('1 mars 2026')
  })

  it('se cale sur l’heure de Paris, pas sur celle de l’appareil', () => {
    // 23 h 30 en temps universel : déjà le lendemain à Paris.
    expect(formaterDate('2026-12-31T23:30:00Z')).toBe('1 janvier 2027')
  })

  it('renvoie une chaîne vide pour une date absente ou illisible', () => {
    expect(formaterDate(null)).toBe('')
    expect(formaterDate(undefined)).toBe('')
    expect(formaterDate('')).toBe('')
    expect(formaterDate('pas une date')).toBe('')
  })
})

describe('dateDuJour', () => {
  it('donne la date de Paris au format de la base', () => {
    expect(dateDuJour(new Date('2026-11-16T09:00:00Z'))).toBe('2026-11-16')
    // 23 h 30 en temps universel : déjà le lendemain à Paris.
    expect(dateDuJour(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })
})

describe('estDateValide', () => {
  it('accepte une date qui existe', () => {
    expect(estDateValide('2026-11-16')).toBe(true)
    expect(estDateValide('2028-02-29')).toBe(true)
  })

  it('refuse une date mal écrite ou qui n’existe pas', () => {
    expect(estDateValide('')).toBe(false)
    expect(estDateValide('16/11/2026')).toBe(false)
    expect(estDateValide('2026-02-30')).toBe(false)
  })
})
