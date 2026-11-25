import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  COULEURS_ORIGINE,
  conseilAccent,
  contraste,
  estCouleur,
  formaterContraste,
  JETONS,
  lisibilites,
  melanger,
  PALETTE_ORIGINE,
  paletteDuMode,
  texteSur,
  versHex,
  versRvb,
  type CouleursBase,
} from './couleurs'

/** Les variables d'un bloc de `src/index.css`, à partir de son sélecteur. */
function variablesDuBloc(css: string, selecteur: string): Record<string, string> {
  const debut = css.indexOf(selecteur)
  const fin = css.indexOf('}', debut)
  const bloc = css.slice(debut, fin)
  const variables: Record<string, string> = {}
  for (const [, nom, valeur] of bloc.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/gi)) {
    if (nom !== undefined && valeur !== undefined) variables[nom] = valeur.toLowerCase()
  }
  return variables
}

describe('PALETTE_ORIGINE', () => {
  const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8')

  it('reprend exactement les couleurs claires de src/index.css', () => {
    expect(variablesDuBloc(css, ':root {')).toEqual(PALETTE_ORIGINE.clair)
  })

  it('reprend exactement les couleurs sombres de src/index.css, aux deux endroits', () => {
    expect(variablesDuBloc(css, ":root:not([data-mode='clair']) {")).toEqual(PALETTE_ORIGINE.sombre)
    expect(variablesDuBloc(css, ":root[data-mode='sombre'] {")).toEqual(PALETTE_ORIGINE.sombre)
  })

  it('a une valeur pour chaque jeton', () => {
    for (const jeton of JETONS) {
      expect(estCouleur(PALETTE_ORIGINE.clair[jeton])).toBe(true)
      expect(estCouleur(PALETTE_ORIGINE.sombre[jeton])).toBe(true)
    }
  })
})

describe('outils de couleur', () => {
  it('reconnaît une couleur « #rrggbb »', () => {
    expect(estCouleur('#3D3AF5')).toBe(true)
    expect(estCouleur('#fff')).toBe(false)
    expect(estCouleur('bleu')).toBe(false)
    expect(estCouleur(12)).toBe(false)
  })

  it('passe des composantes au code et inversement', () => {
    expect(versRvb('#3d3af5')).toEqual([61, 58, 245])
    expect(versHex([61, 58, 245])).toBe('#3d3af5')
    expect(versHex([300, -4, 12.6])).toBe('#ff000d')
  })

  it('mélange deux couleurs', () => {
    expect(melanger('#000000', '#ffffff', 0)).toBe('#000000')
    expect(melanger('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(melanger('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('calcule le contraste comme les règles WCAG', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contraste('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(contraste('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })

  it('arrondit le contraste vers le bas, à la française', () => {
    expect(formaterContraste(4.49)).toBe('4,4:1')
    expect(formaterContraste(21)).toBe('21,0:1')
  })

  it('choisit le texte le plus lisible sur une couleur', () => {
    expect(texteSur('#3d3af5')).toBe('#ffffff')
    expect(texteSur('#8c8aff')).toBe('#0e0f12')
  })
})

describe('paletteDuMode', () => {
  it('rend la palette d’origine pour les couleurs d’origine', () => {
    expect(paletteDuMode(COULEURS_ORIGINE.clair, false)).toBe(PALETTE_ORIGINE.clair)
    expect(paletteDuMode(COULEURS_ORIGINE.sombre, true)).toBe(PALETTE_ORIGINE.sombre)
  })

  it('déduit les nuances et garde le rouge, le vert et l’orange', () => {
    const base: CouleursBase = {
      ...COULEURS_ORIGINE.clair,
      accent: '#0b6e69',
      inverse: '#123534',
    }
    const palette = paletteDuMode(base, false)
    expect(palette.accent).toBe('#0b6e69')
    expect(palette['sur-plein']).toBe('#ffffff')
    expect(palette['sur-inverse']).toBe('#ffffff')
    expect(palette.danger).toBe(PALETTE_ORIGINE.clair.danger)
    expect(palette.succes).toBe(PALETTE_ORIGINE.clair.succes)
    expect(palette.alerte).toBe(PALETTE_ORIGINE.clair.alerte)
    for (const jeton of JETONS) expect(estCouleur(palette[jeton])).toBe(true)
  })

  it('pose un texte sombre sur une couleur d’action claire', () => {
    const palette = paletteDuMode({ ...COULEURS_ORIGINE.clair, accent: '#ffd84d' }, false)
    expect(palette['sur-plein']).toBe('#0e0f12')
  })
})

describe('lisibilites', () => {
  it('juge lisibles les couleurs d’origine, dans les deux modes', () => {
    for (const palette of [PALETTE_ORIGINE.clair, PALETTE_ORIGINE.sombre]) {
      const resultat = lisibilites(palette)
      expect(Object.values(resultat).every((l) => l.lisible)).toBe(true)
    }
  })

  it('signale un texte gris clair sur fond blanc, et dit ce qui pêche', () => {
    const palette = paletteDuMode({ ...COULEURS_ORIGINE.clair, encre: '#b0b0b0' }, false)
    const resultat = lisibilites(palette)
    expect(resultat.encre.lisible).toBe(false)
    expect(resultat.encre.rapport).toBeLessThan(4.5)
    expect(resultat.surface.lisible).toBe(false)
    expect(resultat.accent.lisible).toBe(true)
  })

  it('signale une couleur d’action trop pâle pour un lien', () => {
    const palette = paletteDuMode({ ...COULEURS_ORIGINE.clair, accent: '#a5d8ff' }, false)
    expect(lisibilites(palette).accent).toMatchObject({
      lisible: false,
      quoi: 'liens sur les cartes',
    })
  })
})

describe('conseilAccent', () => {
  it('se tait pour le bleu d’origine et pour un gris', () => {
    expect(conseilAccent('#3d3af5')).toBeNull()
    expect(conseilAccent('#777777')).toBeNull()
  })

  it('prévient pour un rouge, un orange ou un vert', () => {
    expect(conseilAccent('#d62828')).toContain('rouge')
    expect(conseilAccent('#e89a10')).toContain('orange')
    expect(conseilAccent('#1f9d55')).toContain('vert')
  })
})
