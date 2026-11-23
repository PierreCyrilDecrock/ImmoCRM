import { describe, expect, it } from 'vitest'
import { ongletsProjet } from './fiche-projet'

describe('ongletsProjet', () => {
  it('ajoute « Biens proposés » au projet d’achat', () => {
    expect(ongletsProjet('vendeur')).toEqual(['activite', 'taches', 'details'])
    expect(ongletsProjet('acquereur')).toEqual(['activite', 'biens', 'taches', 'details'])
  })
})
