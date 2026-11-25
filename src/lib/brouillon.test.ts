import { describe, expect, it } from 'vitest'
import { brouillonModifie } from './brouillon'

describe('brouillonModifie', () => {
  const initial = { prenom: 'Camille', nom: 'Fictif', telephones: ['0639980101'], note: '' }

  it("ne voit rien à enregistrer tant que rien n'a changé", () => {
    expect(brouillonModifie(initial, { ...initial })).toBe(false)
  })

  it("ignore l'ordre des clés", () => {
    expect(
      brouillonModifie(initial, {
        note: '',
        telephones: ['0639980101'],
        nom: 'Fictif',
        prenom: 'Camille',
      }),
    ).toBe(false)
  })

  it('voit un champ modifié, ajouté à une liste ou vidé', () => {
    expect(brouillonModifie(initial, { ...initial, nom: 'Essai' })).toBe(true)
    expect(brouillonModifie(initial, { ...initial, telephones: ['0639980101', ''] })).toBe(true)
    expect(brouillonModifie(initial, { ...initial, prenom: '' })).toBe(true)
  })

  it('ne compte pas un champ réécrit à l’identique', () => {
    const modifie = { ...initial, nom: 'Essai' }
    expect(brouillonModifie(initial, { ...modifie, nom: 'Fictif' })).toBe(false)
  })
})
