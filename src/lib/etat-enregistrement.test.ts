import { describe, expect, it } from 'vitest'
import { etatEnregistrement, LIBELLES_ENREGISTREMENT } from './etat-enregistrement'

describe('etatEnregistrement', () => {
  it('dit que tout est enregistré quand rien n’est en cours', () => {
    expect(LIBELLES_ENREGISTREMENT[etatEnregistrement(0, true)]).toBe('Tout est enregistré')
  })

  it('signale un enregistrement tant qu’une écriture est en cours', () => {
    expect(LIBELLES_ENREGISTREMENT[etatEnregistrement(2, true)]).toBe('Enregistrement…')
  })

  it('signale la connexion perdue en priorité', () => {
    expect(etatEnregistrement(0, false)).toBe('hors_ligne')
    expect(etatEnregistrement(1, false)).toBe('hors_ligne')
  })
})
