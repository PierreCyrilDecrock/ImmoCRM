import { describe, expect, it } from 'vitest'
import {
  aideEtapeSuivanteAcquereur,
  ajouterSecteur,
  brouillonPassageAcquereur,
  brouillonRechercheDepuis,
  brouillonSortieAcquereur,
  etapeSuivanteAcquereur,
  exigencesEtapeAcquereur,
  grouperParEtapeAcquereur,
  informationsManquantesAcquereur,
  libelleBudget,
  preparerOffre,
  preparerPassageAcquereur,
  preparerRecherche,
  preparerSortieAcquereur,
  resumeEtatAcquereur,
  resumeOrigine,
  resumeRecherche,
} from './pipeline-acquereur'
import { projetAcquereurEssai } from './projet-acquereur-essai'

const AUJOURDHUI = '2026-11-17'

const qualifie = projetAcquereurEssai({
  etape: 'qualification',
  origine: 'portail',
  budget_max: 280000,
})

describe('étapes', () => {
  it('se suivent de la demande aux visites', () => {
    expect(etapeSuivanteAcquereur('demande')).toBe('qualification')
    expect(etapeSuivanteAcquereur('selection')).toBe('visites')
    expect(etapeSuivanteAcquereur('visites')).toBeNull()
  })

  it('cumulent les critères des étapes franchies', () => {
    expect(exigencesEtapeAcquereur('demande')).toEqual([])
    expect(exigencesEtapeAcquereur('qualification')).toEqual(['origine', 'budget_max'])
    expect(exigencesEtapeAcquereur('visites')).toEqual([
      'origine',
      'budget_max',
      'types_biens',
      'secteurs',
      'financement',
      'biens_proposes',
    ])
  })
})

describe('informationsManquantesAcquereur', () => {
  it('demande le budget pour passer en qualification', () => {
    const projet = projetAcquereurEssai({ origine: 'portail' })
    expect(informationsManquantesAcquereur(projet, 0, 'qualification')).toEqual(['budget_max'])
  })

  it('demande les critères et le financement pour passer en sélection', () => {
    expect(informationsManquantesAcquereur(qualifie, 0, 'selection')).toEqual([
      'types_biens',
      'secteurs',
      'financement',
    ])
  })

  it('demande un bien proposé pour passer aux visites', () => {
    const selection = projetAcquereurEssai({
      ...qualifie,
      etape: 'selection',
      types_biens: ['appartement'],
      secteurs: ['Villefictive'],
      financement: 'comptant',
    })
    expect(informationsManquantesAcquereur(selection, 0, 'visites')).toEqual(['biens_proposes'])
    expect(informationsManquantesAcquereur(selection, 3, 'visites')).toEqual([])
  })

  it('ne demande rien pour revenir en arrière', () => {
    const visites = projetAcquereurEssai({ etape: 'visites' })
    expect(informationsManquantesAcquereur(visites, 0, 'demande')).toEqual([])
  })
})

describe('preparerPassageAcquereur', () => {
  const projet = projetAcquereurEssai({ origine: 'appel' })

  it('refuse la qualification sans budget', () => {
    const preparation = preparerPassageAcquereur(
      projet,
      0,
      'qualification',
      brouillonPassageAcquereur(projet),
    )
    expect(preparation).toEqual({
      ok: false,
      erreurs: { budgetMax: 'Indiquez le budget maximum.' },
    })
  })

  it('enregistre le budget saisi avec le changement d’étape', () => {
    const preparation = preparerPassageAcquereur(projet, 0, 'qualification', {
      ...brouillonPassageAcquereur(projet),
      budgetMin: '200 000',
      budgetMax: '280 000',
    })
    expect(preparation).toEqual({
      ok: true,
      passage: { etape: 'qualification', budget_min: 200000, budget_max: 280000 },
    })
  })

  it('refuse un budget inversé', () => {
    const preparation = preparerPassageAcquereur(projet, 0, 'qualification', {
      ...brouillonPassageAcquereur(projet),
      budgetMin: '300000',
      budgetMax: '200000',
    })
    expect(preparation.ok === false && preparation.erreurs.budgetMax).toBe(
      'Le maximum est plus bas que le minimum.',
    )
  })

  it('demande d’où vient la demande si on l’ignore', () => {
    const sansOrigine = projetAcquereurEssai()
    const preparation = preparerPassageAcquereur(sansOrigine, 0, 'qualification', {
      ...brouillonPassageAcquereur(sansOrigine),
      budgetMax: '250000',
    })
    expect(preparation.ok === false && preparation.erreurs.origine).toBe('D’où vient la demande ?')
  })

  it('n’enregistre l’accord de principe que pour un prêt', () => {
    const preparation = preparerPassageAcquereur(qualifie, 0, 'selection', {
      ...brouillonPassageAcquereur(qualifie),
      typesBiens: ['appartement', 'maison'],
      categoriesBiens: ['neuf'],
      secteurs: ['Villefictive'],
      financement: 'comptant',
      accordPrincipe: true,
      apport: '50000',
    })
    expect(preparation).toEqual({
      ok: true,
      passage: {
        etape: 'selection',
        types_biens: ['appartement', 'maison'],
        categories_biens: ['neuf'],
        secteurs: ['Villefictive'],
        financement: 'comptant',
        accord_principe: false,
        apport: 50000,
      },
    })
  })

  it('renvoie à la sélection quand aucun bien n’est proposé', () => {
    const selection = projetAcquereurEssai({
      ...qualifie,
      etape: 'selection',
      types_biens: ['appartement'],
      secteurs: ['Villefictive'],
      financement: 'pret',
    })
    const preparation = preparerPassageAcquereur(
      selection,
      0,
      'visites',
      brouillonPassageAcquereur(selection),
    )
    expect(preparation.ok === false && preparation.erreurs.biensProposes).toContain(
      'Proposez au moins un bien',
    )
  })
})

describe('ajouterSecteur', () => {
  it('nettoie la saisie et évite les doublons', () => {
    expect(ajouterSecteur([], '  Villefictive   centre ')).toEqual(['Villefictive centre'])
    expect(ajouterSecteur(['Villefictive'], 'villefictive')).toEqual(['Villefictive'])
    expect(ajouterSecteur(['Villefictive'], '   ')).toEqual(['Villefictive'])
  })
})

describe('sorties', () => {
  it('« À recontacter » crée la relance, à trois mois par défaut', () => {
    const saisie = brouillonSortieAcquereur('a_recontacter', AUJOURDHUI)
    expect(saisie.recontacterLe).toBe('2027-02-17')
    expect(
      preparerSortieAcquereur({ ...saisie, pourquoi: ' Après la vente de son bien ' }, AUJOURDHUI),
    ).toEqual({
      ok: true,
      parametres: {
        p_etat: 'a_recontacter',
        p_recontacter_le: '2027-02-17',
        p_relance_titre: 'Recontacter l’acquéreur',
        p_relance_motif: 'Après la vente de son bien',
      },
    })
  })

  it('refuse une date passée', () => {
    const saisie = {
      ...brouillonSortieAcquereur('a_recontacter', AUJOURDHUI),
      recontacterLe: '2026-11-01',
    }
    expect(preparerSortieAcquereur(saisie, AUJOURDHUI).ok).toBe(false)
  })

  it('« Perdu » demande le motif', () => {
    const saisie = brouillonSortieAcquereur('perdu', AUJOURDHUI)
    expect(preparerSortieAcquereur(saisie, AUJOURDHUI).ok).toBe(false)
    expect(
      preparerSortieAcquereur(
        { ...saisie, motifPerte: 'achat_confrere', detail: ' Agence X ' },
        AUJOURDHUI,
      ),
    ).toEqual({
      ok: true,
      parametres: {
        p_etat: 'perdu',
        p_motif_perte: 'achat_confrere',
        p_motif_perte_detail: 'Agence X',
      },
    })
  })
})

describe('preparerOffre', () => {
  it('demande une visite consignée, le bien et une date passée', () => {
    const refus = preparerOffre(
      { bienId: '', offreLe: '2026-12-01' },
      { aujourdhui: AUJOURDHUI, nbVisites: 0 },
    )
    expect(refus.ok === false && Object.keys(refus.erreurs).sort()).toEqual([
      'bienId',
      'offreLe',
      'visites',
    ])
    expect(
      preparerOffre(
        { bienId: 'b1', offreLe: AUJOURDHUI },
        { aujourdhui: AUJOURDHUI, nbVisites: 2 },
      ),
    ).toEqual({
      ok: true,
      valeurs: { etat: 'gagne', offre_bien_id: 'b1', offre_le: AUJOURDHUI },
    })
  })
})

describe('preparerRecherche', () => {
  it('ne laisse pas effacer ce qu’exige l’étape', () => {
    const selection = projetAcquereurEssai({
      etape: 'selection',
      origine: 'appel',
      budget_max: 250000,
      types_biens: ['appartement'],
      secteurs: ['Villefictive'],
      financement: 'pret',
    })
    const preparation = preparerRecherche(
      { ...brouillonRechercheDepuis(selection), budgetMax: '', secteurs: [] },
      selection,
    )
    expect(preparation.ok === false && Object.keys(preparation.erreurs).sort()).toEqual([
      'budgetMax',
      'secteurs',
    ])
  })

  it('lit surfaces, pièces et textes', () => {
    const projet = projetAcquereurEssai()
    const preparation = preparerRecherche(
      {
        ...brouillonRechercheDepuis(projet),
        surfaceMin: '80',
        piecesMin: '4',
        criteresIndispensables: ' Jardin ',
        urgence: 'moins_3_mois',
        bienAVendre: true,
      },
      projet,
    )
    expect(preparation.ok && preparation.valeurs).toMatchObject({
      surface_min: 80,
      pieces_min: 4,
      criteres_indispensables: 'Jardin',
      urgence: 'moins_3_mois',
      bien_a_vendre: true,
    })
  })

  it('refuse un nombre de pièces impossible', () => {
    const projet = projetAcquereurEssai()
    const preparation = preparerRecherche(
      { ...brouillonRechercheDepuis(projet), piecesMin: '0' },
      projet,
    )
    expect(preparation.ok === false && preparation.erreurs.piecesMin).toBeDefined()
  })
})

describe('résumés', () => {
  it('décrivent la recherche, le budget, l’origine et l’état', () => {
    expect(libelleBudget(null, 280000)).toMatch(/^jusqu’à 280\s000 €$/)
    expect(libelleBudget(200000, null)).toMatch(/^dès 200\s000 €$/)
    expect(libelleBudget(null, null)).toBe('')
    expect(
      resumeRecherche(
        projetAcquereurEssai({
          types_biens: ['appartement'],
          categories_biens: ['ancien'],
          secteurs: ['Villefictive'],
          pieces_min: 3,
        }),
      ),
    ).toBe('Appartement (ancien) · Villefictive · 3 p. min.')
    expect(resumeOrigine(projetAcquereurEssai({ origine: 'portail', portail: 'SeLoger' }))).toBe(
      'Portail SeLoger',
    )
    expect(
      resumeEtatAcquereur(projetAcquereurEssai({ etat: 'perdu', motif_perte: 'financement' })),
    ).toBe('Perdu : Financement refusé')
  })

  it('rangent les projets par étape, les plus anciens dans l’étape d’abord', () => {
    const a = { projet: projetAcquereurEssai({ etape: 'selection', etape_le: '2026-11-10' }) }
    const b = { projet: projetAcquereurEssai({ etape: 'selection', etape_le: '2026-11-01' }) }
    const groupes = grouperParEtapeAcquereur([a, b])
    expect(groupes.map((g) => g.etape)).toEqual([
      'demande',
      'qualification',
      'selection',
      'visites',
    ])
    expect(groupes[2]?.projets).toEqual([b, a])
  })
})

describe('aideEtapeSuivanteAcquereur', () => {
  it('donne le critère de l’étape en cours et ce qui manque pour avancer', () => {
    expect(aideEtapeSuivanteAcquereur(projetAcquereurEssai(), 0)).toEqual({
      suivante: 'qualification',
      critere: 'Appel ou portail',
      manquantes: ['l’origine de la demande', 'le budget'],
    })
    expect(aideEtapeSuivanteAcquereur(qualifie, 0)?.manquantes).toEqual([
      'les critères',
      'le financement',
    ])
  })

  it('compte les biens proposés pour quitter la sélection, et s’arrête aux visites', () => {
    const enSelection = projetAcquereurEssai({
      etape: 'selection',
      origine: 'appel',
      budget_max: 300000,
      types_biens: ['maison'],
      secteurs: ['Centre'],
      financement: 'pret',
    })
    expect(aideEtapeSuivanteAcquereur(enSelection, 0)?.manquantes).toEqual(['un bien proposé'])
    expect(aideEtapeSuivanteAcquereur(enSelection, 2)?.manquantes).toEqual([])
    expect(aideEtapeSuivanteAcquereur({ ...enSelection, etape: 'visites' }, 2)).toBeNull()
  })
})
