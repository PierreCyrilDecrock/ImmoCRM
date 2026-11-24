import { describe, expect, it } from 'vitest'
import {
  annonceResume,
  depuisEtape,
  etatsEtapes,
  listeCriteres,
  listeEnFrancais,
  phraseManque,
  phrasePassage,
  resumeEtapes,
  texteRenseigner,
  titrePassage,
} from './etapes'

const ETAPES = [
  { valeur: 'a', libelle: 'Un' },
  { valeur: 'b', libelle: 'Deux' },
  { valeur: 'c', libelle: 'Trois' },
] as const

describe('etatsEtapes', () => {
  it('distingue les étapes passées, en cours et à venir', () => {
    expect(etatsEtapes(ETAPES, 'b').map((etape) => etape.etat)).toEqual([
      'passee',
      'en_cours',
      'a_venir',
    ])
    expect(etatsEtapes(ETAPES, 'a').map((etape) => etape.etat)).toEqual([
      'en_cours',
      'a_venir',
      'a_venir',
    ])
  })

  it('passe toutes les étapes d’un projet terminé', () => {
    expect(etatsEtapes(ETAPES, 'c', true).every((etape) => etape.etat === 'passee')).toBe(true)
  })
})

describe('listeEnFrancais', () => {
  it('relie les éléments à la française, sans doublon', () => {
    expect(listeEnFrancais([])).toBe('')
    expect(listeEnFrancais(['le budget'])).toBe('le budget')
    expect(listeEnFrancais(['a', 'b', 'c'])).toBe('a, b et c')
    expect(listeEnFrancais(['l’estimation', 'l’estimation', 'la date'])).toBe(
      'l’estimation et la date',
    )
  })
})

describe('phrases de passage', () => {
  it('dit ce qu’il faut pour avancer, et ce qui manque', () => {
    expect(phrasePassage('Estimation', 'Projet, délai, motif')).toBe(
      'Pour passer à l’étape suivante (Estimation) : projet, délai, motif.',
    )
    expect(phraseManque(['le motif de la vente', 'le délai souhaité'])).toBe(
      'Il manque le motif de la vente et le délai souhaité.',
    )
    expect(phraseManque([])).toBe('')
  })
})

describe('listeCriteres', () => {
  it('garde les critères propres à l’étape et ceux d’avant qui manquent', () => {
    expect(
      listeCriteres([
        { libelle: 'Source', acquis: true, propre: false },
        { libelle: 'Budget', acquis: false, propre: false },
        { libelle: 'Motif', acquis: true, propre: true },
        { libelle: 'Délai', acquis: false, propre: true },
      ]),
    ).toEqual([
      { libelle: 'Budget', acquis: false },
      { libelle: 'Motif', acquis: true },
      { libelle: 'Délai', acquis: false },
    ])
  })

  it('réunit deux informations de même libellé, acquises seulement ensemble', () => {
    const fourchette = (basse: boolean, haute: boolean) =>
      listeCriteres([
        { libelle: 'Estimation', acquis: basse, propre: true },
        { libelle: 'Estimation', acquis: haute, propre: true },
      ])
    expect(fourchette(true, true)).toEqual([{ libelle: 'Estimation', acquis: true }])
    expect(fourchette(true, false)).toEqual([{ libelle: 'Estimation', acquis: false }])
    expect(fourchette(false, true)).toEqual([{ libelle: 'Estimation', acquis: false }])
  })

  it('titre la liste par l’étape d’arrivée', () => {
    expect(titrePassage('Estimation')).toBe('Pour passer à Estimation')
  })
})

describe('critère de sortie de chaque étape', () => {
  it('suit chaque étape quand il est connu', () => {
    const etapes = etatsEtapes(
      [
        { valeur: 'a', libelle: 'Un', critere: 'Source identifiée' },
        { valeur: 'b', libelle: 'Deux' },
      ],
      'a',
    )
    expect(etapes[0]?.critere).toBe('Source identifiée')
    expect(etapes[1]).toEqual({ valeur: 'b', libelle: 'Deux', etat: 'a_venir' })
  })
})

describe('résumé de la frise au téléphone', () => {
  const CINQ = [
    { valeur: 'premier_contact', libelle: 'Premier contact' },
    { valeur: 'decouverte', libelle: 'Découverte' },
    { valeur: 'estimation', libelle: 'Estimation' },
    { valeur: 'suivi', libelle: 'Suivi' },
    { valeur: 'mandat_signe', libelle: 'Mandat signé' },
  ]

  it('dit l’étape en cours, sa place et la suivante', () => {
    expect(resumeEtapes(etatsEtapes(CINQ, 'decouverte'))).toEqual({
      position: 'Étape 2 sur 5',
      nom: 'Découverte',
      ensuite: 'Ensuite : Estimation',
    })
    expect(resumeEtapes(etatsEtapes(CINQ, 'mandat_signe'))).toEqual({
      position: 'Étape 5 sur 5',
      nom: 'Mandat signé',
      ensuite: null,
    })
  })

  it('résume un projet terminé à sa dernière étape, et rien sans étape', () => {
    expect(resumeEtapes(etatsEtapes(CINQ, 'mandat_signe', true))).toEqual({
      position: 'Étape 5 sur 5',
      nom: 'Mandat signé',
      ensuite: null,
    })
    expect(resumeEtapes([])).toBeNull()
  })

  it('écrit l’ancienneté et ce que lit un lecteur d’écran', () => {
    expect(depuisEtape('12 j')).toBe('depuis 12 j')
    const resume = resumeEtapes(etatsEtapes(CINQ, 'decouverte'))
    if (resume === null) throw new Error('résumé attendu')
    expect(annonceResume(resume, 'Depuis 12 jours')).toBe(
      'Étape 2 sur 5 : Découverte, depuis 12 jours. Ensuite : Estimation. Voir les étapes',
    )
    expect(annonceResume({ ...resume, ensuite: null })).toBe(
      'Étape 2 sur 5 : Découverte. Voir les étapes',
    )
  })
})

describe('lien d’un critère manquant', () => {
  const motif = { info: 'motif_vente', texte: texteRenseigner('le motif de la vente') }

  it('dit ce qu’il faut renseigner', () => {
    expect(texteRenseigner('le motif de la vente')).toBe('Renseigner le motif de la vente')
  })

  it('ne garde le lien que d’un critère manquant, le premier connu', () => {
    expect(
      listeCriteres([
        { libelle: 'Motif', acquis: false, propre: true, lien: motif },
        { libelle: 'Délai', acquis: true, propre: true, lien: { info: 'd', texte: 'D' } },
        { libelle: 'Source', acquis: false, propre: true },
      ]),
    ).toEqual([
      { libelle: 'Motif', acquis: false, lien: motif },
      { libelle: 'Délai', acquis: true },
      { libelle: 'Source', acquis: false },
    ])
    // Deux bornes d'une même estimation : le lien de la première.
    expect(
      listeCriteres([
        { libelle: 'Estimation', acquis: true, propre: true, lien: { info: 'basse', texte: 'E' } },
        { libelle: 'Estimation', acquis: false, propre: true, lien: { info: 'haute', texte: 'E' } },
      ]),
    ).toEqual([{ libelle: 'Estimation', acquis: false, lien: { info: 'basse', texte: 'E' } }])
  })
})
