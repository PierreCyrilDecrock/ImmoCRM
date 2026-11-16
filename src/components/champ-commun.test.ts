import { describe, expect, it } from 'vitest'
import { descriptionChamp } from './champ-commun'

describe('descriptionChamp', () => {
  it('ne renvoie rien sans aide ni erreur', () => {
    expect(descriptionChamp('c1')).toBeUndefined()
  })

  it('désigne le texte d’aide', () => {
    expect(descriptionChamp('c1', 'Dix chiffres')).toBe('c1-aide')
  })

  it('désigne l’aide puis l’erreur quand les deux existent', () => {
    expect(descriptionChamp('c1', 'Dix chiffres', 'Numéro incomplet')).toBe('c1-aide c1-erreur')
  })
})
