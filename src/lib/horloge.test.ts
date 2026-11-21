import { describe, expect, it } from 'vitest'
import { delaiAvantMinuteSuivante } from './horloge'

describe('delaiAvantMinuteSuivante', () => {
  it('attend jusqu’au début de la minute suivante', () => {
    expect(delaiAvantMinuteSuivante(new Date('2026-11-21T09:41:15.500Z'))).toBe(44_500)
    expect(delaiAvantMinuteSuivante(new Date('2026-11-21T09:41:59.999Z'))).toBe(1)
  })

  it('attend une minute entière quand elle vient de commencer', () => {
    expect(delaiAvantMinuteSuivante(new Date('2026-11-21T09:42:00.000Z'))).toBe(60_000)
  })
})
