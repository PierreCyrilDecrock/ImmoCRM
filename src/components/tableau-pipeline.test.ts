import { describe, expect, it } from 'vitest'
import { basculerCritere, separerEtapes } from './tableau-pipeline'

describe('separerEtapes', () => {
  it('replie les étapes vides à part, dans l’ordre du pipeline', () => {
    const colonnes = [
      { etape: 'premier_contact', projets: ['a'] },
      { etape: 'decouverte', projets: [] },
      { etape: 'estimation', projets: [] },
      { etape: 'suivi', projets: ['b', 'c'] },
      { etape: 'mandat_signe', projets: [] },
    ]
    const { pleines, vides } = separerEtapes(colonnes)
    expect(pleines.map((c) => c.etape)).toEqual(['premier_contact', 'suivi'])
    expect(vides.map((c) => c.etape)).toEqual(['decouverte', 'estimation', 'mandat_signe'])
  })
})

describe('basculerCritere', () => {
  it('montre un critère à la fois, et le cache au second toucher', () => {
    expect(basculerCritere(null, 'suivi')).toBe('suivi')
    expect(basculerCritere('suivi', 'estimation')).toBe('estimation')
    expect(basculerCritere('suivi', 'suivi')).toBeNull()
  })
})
