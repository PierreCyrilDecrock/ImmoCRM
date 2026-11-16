import { describe, expect, it } from 'vitest'
import { formaterDate } from './dates'

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
