import { describe, expect, it } from 'vitest'
import { COULEURS_ORIGINE } from './couleurs'
import {
  APPARENCE_PAR_DEFAUT,
  avecTheme,
  feuilleDuTheme,
  ID_STANDARD,
  lireApparenceCompte,
  memesThemes,
  nomLibre,
  nouveauTheme,
  resumeTheme,
  sansTheme,
  THEME_STANDARD,
  themeChoisi,
  tousLesThemes,
  validerNomTheme,
  variablesApercu,
  variablesFormes,
  versColonne,
  type Theme,
} from './themes'

const ARDOISE: Theme = {
  id: 'a1',
  nom: 'Ardoise',
  couleurs: {
    clair: { ...COULEURS_ORIGINE.clair, accent: '#0b6e69' },
    sombre: COULEURS_ORIGINE.sombre,
  },
  police: 'atkinson',
  taille: 'grande',
  arrondi: 'doux',
}

describe('lireApparenceCompte', () => {
  it('donne « Standard » seul quand rien n’est enregistré', () => {
    expect(lireApparenceCompte({})).toEqual(APPARENCE_PAR_DEFAUT)
    expect(lireApparenceCompte(null)).toEqual(APPARENCE_PAR_DEFAUT)
    expect(lireApparenceCompte('n’importe quoi')).toEqual(APPARENCE_PAR_DEFAUT)
  })

  it('relit ce que versColonne enregistre', () => {
    const apparence = { themeChoisi: 'a1', themes: [ARDOISE] }
    expect(lireApparenceCompte(versColonne(apparence))).toEqual(apparence)
  })

  it('remplace les valeurs abîmées par celles d’origine', () => {
    const lu = lireApparenceCompte({
      theme_choisi: 'a1',
      themes: [
        {
          id: 'a1',
          nom: '  ',
          couleurs: { clair: { accent: 'rouge', fond: '#F0F0F0' } },
          police: 'comic',
          taille: 'immense',
          arrondi: 12,
        },
      ],
    })
    const theme = lu.themes[0]
    expect(theme).toBeDefined()
    expect(theme?.nom).toBe('Thème sans nom')
    expect(theme?.couleurs.clair.accent).toBe(COULEURS_ORIGINE.clair.accent)
    expect(theme?.couleurs.clair.fond).toBe('#f0f0f0')
    expect(theme?.couleurs.sombre).toEqual(COULEURS_ORIGINE.sombre)
    expect(theme?.police).toBe('inter')
    expect(theme?.taille).toBe('normale')
    expect(theme?.arrondi).toBe('doux')
  })

  it('écarte les thèmes sans identifiant, en double ou nommés comme « Standard »', () => {
    const lu = lireApparenceCompte({
      themes: [{ nom: 'Sans id' }, ARDOISE, { ...ARDOISE, nom: 'Copie' }, { id: ID_STANDARD }],
    })
    expect(lu.themes.map((t) => t.nom)).toEqual(['Ardoise'])
  })

  it('revient à « Standard » quand le thème choisi n’existe plus', () => {
    expect(lireApparenceCompte({ theme_choisi: 'disparu', themes: [ARDOISE] }).themeChoisi).toBe(
      ID_STANDARD,
    )
  })
})

describe('gestion des thèmes', () => {
  it('met « Standard » en tête de la liste', () => {
    expect(tousLesThemes({ themeChoisi: ID_STANDARD, themes: [ARDOISE] })).toEqual([
      THEME_STANDARD,
      ARDOISE,
    ])
  })

  it('trouve le thème en service', () => {
    expect(themeChoisi({ themeChoisi: 'a1', themes: [ARDOISE] })).toBe(ARDOISE)
    expect(themeChoisi(APPARENCE_PAR_DEFAUT)).toBe(THEME_STANDARD)
  })

  it('ajoute, remplace puis retire un thème', () => {
    const ajoute = avecTheme(APPARENCE_PAR_DEFAUT, ARDOISE)
    expect(ajoute.themes).toEqual([ARDOISE])
    const remplace = avecTheme(ajoute, { ...ARDOISE, nom: 'Ardoise 2' })
    expect(remplace.themes.map((t) => t.nom)).toEqual(['Ardoise 2'])
    const choisi = { ...remplace, themeChoisi: 'a1' }
    expect(sansTheme(choisi, 'a1')).toEqual({ themeChoisi: ID_STANDARD, themes: [] })
  })

  it('crée un thème aux réglages d’origine', () => {
    const theme = nouveauTheme('n1', 'Mon thème')
    expect(memesThemes(theme, { ...THEME_STANDARD, id: 'n1', nom: 'Mon thème' })).toBe(true)
  })

  it('propose un nom libre', () => {
    expect(nomLibre([])).toBe('Mon thème')
    expect(nomLibre([nouveauTheme('1', 'Mon thème'), nouveauTheme('2', 'Mon thème 2')])).toBe(
      'Mon thème 3',
    )
  })

  it('vérifie le nom', () => {
    expect(validerNomTheme('Ardoise')).toBeNull()
    expect(validerNomTheme('  ')).toBe('Donnez un nom au thème.')
    expect(validerNomTheme('x'.repeat(41))).toContain('40 caractères')
    expect(validerNomTheme('standard')).toContain('d’origine')
  })

  it('résume un thème en une ligne', () => {
    expect(resumeTheme(ARDOISE)).toBe('Atkinson Hyperlegible · texte grand · arrondis doux')
  })

  it('voit un changement de couleur, de police ou de nom', () => {
    expect(memesThemes(ARDOISE, { ...ARDOISE })).toBe(true)
    expect(memesThemes(ARDOISE, { ...ARDOISE, police: 'lexend' })).toBe(false)
    expect(memesThemes(ARDOISE, { ...ARDOISE, nom: 'Autre' })).toBe(false)
  })
})

describe('variables CSS', () => {
  it('agrandit toutes les tailles de texte d’un même rapport', () => {
    const variables = variablesFormes(ARDOISE)
    expect(variables['--text-base']).toBe('1.125rem')
    expect(variables['--text-titre']).toBe('1.9688rem')
    expect(variables['--font-sans']).toContain('Atkinson Hyperlegible Next Variable')
    expect(variables['--radius-lg']).toBe('0.75rem')
  })

  it('pose toutes les couleurs d’un mode dans l’aperçu', () => {
    const variables = variablesApercu(ARDOISE, false)
    expect(variables['--accent']).toBe('#0b6e69')
    expect(variables['--danger']).toBe('#b42a18')
    expect(variables['--fond']).toBe(COULEURS_ORIGINE.clair.fond)
  })

  it('n’écrit rien pour « Standard »', () => {
    expect(feuilleDuTheme(THEME_STANDARD)).toBe('')
  })

  it('n’écrit que ce qui diffère de l’origine', () => {
    const feuille = feuilleDuTheme(ARDOISE)
    expect(feuille).toContain('--font-sans:')
    expect(feuille).toContain('--accent:#0b6e69;')
    // Le sombre est celui d'origine : pas de règle pour lui.
    expect(feuille).not.toContain('prefers-color-scheme')
  })

  it('écrit le sombre pour l’appareil en sombre et pour le mode imposé', () => {
    const feuille = feuilleDuTheme({
      ...THEME_STANDARD,
      id: 's1',
      couleurs: {
        clair: COULEURS_ORIGINE.clair,
        sombre: { ...COULEURS_ORIGINE.sombre, accent: '#4fd1c5' },
      },
    })
    expect(feuille).toContain("@media (prefers-color-scheme: dark){:root:not([data-mode='clair']){")
    expect(feuille).toContain(":root[data-mode='sombre']{")
    expect(feuille).toContain('--accent:#4fd1c5;')
    expect(feuille).not.toContain('--font-sans')
  })
})
