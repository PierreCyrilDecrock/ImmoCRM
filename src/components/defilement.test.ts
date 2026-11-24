import { describe, expect, it } from 'vitest'
import { masqueFondu, positionPourMontrer, suiteADroite, suiteAGauche } from './defilement'

describe('suiteADroite', () => {
  it('signale une suite cachée à droite, jusqu’au bout de la rangée', () => {
    expect(suiteADroite(0, 358, 440)).toBe(true)
    expect(suiteADroite(82, 358, 440)).toBe(false)
    // Un reste d'un pixel (arrondi) ne compte pas.
    expect(suiteADroite(81, 358, 440)).toBe(false)
    expect(suiteADroite(0, 358, 300)).toBe(false)
  })
})

describe('suiteAGauche', () => {
  it('signale un début caché dès que la rangée a défilé de plus d’un pixel', () => {
    expect(suiteAGauche(0)).toBe(false)
    expect(suiteAGauche(1)).toBe(false)
    expect(suiteAGauche(12)).toBe(true)
  })
})

describe('masqueFondu', () => {
  it('efface le bord où une suite est cachée, et seulement celui-là', () => {
    expect(masqueFondu({ gauche: false, droite: false })).toBeUndefined()
    expect(masqueFondu({ gauche: false, droite: true })).toBe(
      'linear-gradient(to right, #000, #000, #000 calc(100% - 40px), transparent)',
    )
    expect(masqueFondu({ gauche: true, droite: false })).toBe(
      'linear-gradient(to right, transparent, #000 40px, #000, #000)',
    )
    expect(masqueFondu({ gauche: true, droite: true }, 24)).toBe(
      'linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent)',
    )
  })
})

describe('positionPourMontrer', () => {
  const rangee = { position: 0, visible: 358, totale: 520 }

  it('ne bouge pas si l’élément est déjà visible hors des fondus', () => {
    expect(positionPourMontrer({ debut: 16, fin: 120 }, rangee)).toBe(0)
    expect(positionPourMontrer({ debut: 200, fin: 300 }, { ...rangee, position: 100 })).toBe(100)
  })

  it('dégage un élément caché ou sous le fondu de droite', () => {
    // Fin à 340 : sous le fondu (358 − 40 = 318) ; la rangée défile de 22 px.
    expect(positionPourMontrer({ debut: 260, fin: 340 }, rangee)).toBe(22)
    // Le dernier onglet : jusqu'au bout de la rangée, pas au-delà.
    expect(positionPourMontrer({ debut: 440, fin: 504 }, rangee)).toBe(162)
  })

  it('dégage un élément caché ou sous le fondu de gauche', () => {
    expect(positionPourMontrer({ debut: 120, fin: 200 }, { ...rangee, position: 150 })).toBe(80)
    // Le premier onglet ramène au début.
    expect(positionPourMontrer({ debut: 16, fin: 110 }, { ...rangee, position: 150 })).toBe(0)
  })
})
