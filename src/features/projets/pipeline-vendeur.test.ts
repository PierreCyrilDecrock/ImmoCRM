import { describe, expect, it } from 'vitest'
import {
  ancienneteEtape,
  brouillonPassage,
  brouillonSortie,
  dateRelanceFinMandat,
  etapeQuiTraine,
  etapeSuivante,
  exigencesEtape,
  grouperParEtape,
  informationsManquantes,
  preparerPassage,
  preparerSortie,
  resumeEtat,
  type ProjetVendeur,
} from './pipeline-vendeur'

const AUJOURDHUI = '2026-11-17'

function projet(valeurs: Partial<ProjetVendeur> = {}): ProjetVendeur {
  return {
    id: 'p1',
    user_id: 'u1',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    archived_at: null,
    contact_id: 'c1',
    bien_id: 'b1',
    etape: 'premier_contact',
    etape_le: '2026-11-01',
    etat: 'actif',
    motif_vente: '',
    echeance_souhaitee: null,
    prix_espere: null,
    estimation_basse: null,
    estimation_haute: null,
    estimation_le: null,
    avis_remis_le: null,
    agences_consultees: '',
    mandat_ailleurs: false,
    mandat_ailleurs_fin: null,
    mandat_type: null,
    mandat_le: null,
    recontacter_le: null,
    motif_perte: null,
    motif_perte_detail: '',
    notes: '',
    ...valeurs,
  }
}

describe('étapes', () => {
  it('se suivent dans l’ordre du cadrage', () => {
    expect(etapeSuivante('premier_contact')).toBe('decouverte')
    expect(etapeSuivante('decouverte')).toBe('estimation')
    expect(etapeSuivante('suivi')).toBe('mandat_signe')
    expect(etapeSuivante('mandat_signe')).toBeNull()
  })

  it('cumulent les critères des étapes franchies', () => {
    expect(exigencesEtape('premier_contact')).toEqual([])
    expect(exigencesEtape('decouverte')).toEqual(['source'])
    expect(exigencesEtape('estimation')).toEqual(['source', 'motif_vente', 'echeance_souhaitee'])
    expect(exigencesEtape('mandat_signe')).toEqual([
      'source',
      'motif_vente',
      'echeance_souhaitee',
      'estimation_basse',
      'estimation_haute',
      'avis_remis_le',
      'mandat_type',
      'mandat_le',
    ])
  })
})

describe('informationsManquantes', () => {
  it('demande le motif et le délai pour passer de Découverte à Estimation', () => {
    const p = projet({ etape: 'decouverte' })
    expect(informationsManquantes(p, 'pige', 'estimation')).toEqual([
      'motif_vente',
      'echeance_souhaitee',
    ])
  })

  it('demande la source du contact pour quitter le premier contact', () => {
    expect(informationsManquantes(projet(), null, 'decouverte')).toEqual(['source'])
    expect(informationsManquantes(projet(), 'boitage', 'decouverte')).toEqual([])
  })

  it('ne redemande pas ce qui est déjà connu, même en sautant des étapes', () => {
    const p = projet({ motif_vente: 'Mutation', echeance_souhaitee: '2027-06-30' })
    expect(informationsManquantes(p, 'pige', 'suivi')).toEqual([
      'estimation_basse',
      'estimation_haute',
      'avis_remis_le',
    ])
  })

  it('ne demande rien pour revenir en arrière ou rester', () => {
    const p = projet({ etape: 'suivi' })
    expect(informationsManquantes(p, null, 'decouverte')).toEqual([])
    expect(informationsManquantes(p, null, 'suivi')).toEqual([])
  })

  it('un motif fait d’espaces ne compte pas', () => {
    const p = projet({ etape: 'decouverte', motif_vente: '   ', echeance_souhaitee: '2027-01-01' })
    expect(informationsManquantes(p, 'pige', 'estimation')).toEqual(['motif_vente'])
  })
})

describe('preparerPassage', () => {
  it('refuse le passage à Estimation sans motif ni délai', () => {
    const p = projet({ etape: 'decouverte' })
    const resultat = preparerPassage(
      p,
      'pige',
      'estimation',
      brouillonPassage(p, AUJOURDHUI),
      AUJOURDHUI,
    )
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(Object.keys(resultat.erreurs).sort()).toEqual(['echeanceSouhaitee', 'motifVente'])
  })

  it('enregistre ce qui manquait avec la nouvelle étape', () => {
    const p = projet({ etape: 'decouverte' })
    const saisie = {
      ...brouillonPassage(p, AUJOURDHUI),
      motifVente: '  Mutation  ',
      echeanceSouhaitee: '2027-06-30',
    }
    const resultat = preparerPassage(p, 'pige', 'estimation', saisie, AUJOURDHUI)
    expect(resultat).toEqual({
      ok: true,
      passage: {
        projet: {
          etape: 'estimation',
          etat: 'actif',
          motif_vente: 'Mutation',
          echeance_souhaitee: '2027-06-30',
        },
        source: null,
      },
    })
  })

  it('note la source du contact quand elle manquait', () => {
    const p = projet()
    const saisie = {
      ...brouillonPassage(p, AUJOURDHUI),
      source: 'boitage',
      sourceDetail: ' Zone fictive ',
    }
    const resultat = preparerPassage(p, null, 'decouverte', saisie, AUJOURDHUI)
    expect(resultat.ok && resultat.passage.source).toEqual({
      source: 'boitage',
      source_detail: 'Zone fictive',
    })
  })

  it('vérifie la fourchette et la date de remise de l’avis', () => {
    const p = projet({
      etape: 'estimation',
      motif_vente: 'Mutation',
      echeance_souhaitee: '2027-01-01',
    })
    const saisie = {
      ...brouillonPassage(p, AUJOURDHUI),
      estimationBasse: '300 000',
      estimationHaute: '280000',
      avisRemisLe: '2026-12-01',
    }
    const resultat = preparerPassage(p, 'pige', 'suivi', saisie, AUJOURDHUI)
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.erreurs.estimationHaute).toMatch(/plus bas/)
    expect(resultat.erreurs.avisRemisLe).toMatch(/passée/)
  })

  it('gagne le projet en arrivant à Mandat signé, avec type et date', () => {
    const p = projet({
      etape: 'suivi',
      motif_vente: 'Mutation',
      echeance_souhaitee: '2027-01-01',
      estimation_basse: 250000,
      estimation_haute: 270000,
      avis_remis_le: '2026-11-10',
    })
    const sansType = preparerPassage(
      p,
      'pige',
      'mandat_signe',
      brouillonPassage(p, AUJOURDHUI),
      AUJOURDHUI,
    )
    expect(sansType.ok).toBe(false)
    const saisie = { ...brouillonPassage(p, AUJOURDHUI), mandatType: 'exclusif' as const }
    const resultat = preparerPassage(p, 'pige', 'mandat_signe', saisie, AUJOURDHUI)
    expect(resultat.ok && resultat.passage.projet).toEqual({
      etape: 'mandat_signe',
      etat: 'gagne',
      mandat_type: 'exclusif',
      mandat_le: AUJOURDHUI,
    })
  })

  it('revenir en arrière remet le projet en cours', () => {
    const p = projet({ etape: 'mandat_signe', etat: 'gagne' })
    const resultat = preparerPassage(p, null, 'suivi', brouillonPassage(p, AUJOURDHUI), AUJOURDHUI)
    expect(resultat.ok && resultat.passage.projet).toEqual({ etape: 'suivi', etat: 'actif' })
  })
})

describe('sorties', () => {
  it('« À recontacter » demande une date à venir et crée la relance', () => {
    const saisie = { ...brouillonSortie('a_recontacter', projet(), AUJOURDHUI) }
    expect(saisie.recontacterLe).toBe('2027-05-17')
    const resultat = preparerSortie(saisie, AUJOURDHUI)
    expect(resultat.ok && resultat.parametres).toMatchObject({
      p_etat: 'a_recontacter',
      p_recontacter_le: '2027-05-17',
    })
    const passee = preparerSortie({ ...saisie, recontacterLe: '2026-11-01' }, AUJOURDHUI)
    expect(passee.ok).toBe(false)
  })

  it('« Perdu » exige un motif', () => {
    const resultat = preparerSortie(brouillonSortie('perdu', projet(), AUJOURDHUI), AUJOURDHUI)
    expect(resultat.ok).toBe(false)
  })

  it('« Perdu, mandat signé ailleurs jusqu’à telle date » planifie une relance 15 jours avant', () => {
    const saisie = {
      ...brouillonSortie('perdu', projet(), AUJOURDHUI),
      motifPerte: 'mandat_ailleurs' as const,
      finMandatAilleurs: '2027-02-17',
    }
    const resultat = preparerSortie(saisie, AUJOURDHUI)
    expect(resultat.ok && resultat.parametres).toMatchObject({
      p_etat: 'perdu',
      p_motif_perte: 'mandat_ailleurs',
      p_mandat_ailleurs_fin: '2027-02-17',
      p_relance_le: '2027-02-02',
    })
    const sansRelance = preparerSortie({ ...saisie, relancer: false }, AUJOURDHUI)
    expect(sansRelance.ok && sansRelance.parametres.p_relance_le).toBeUndefined()
  })

  it('un autre motif ne planifie rien', () => {
    const saisie = {
      ...brouillonSortie('perdu', projet(), AUJOURDHUI),
      motifPerte: 'abandon' as const,
      finMandatAilleurs: '2027-02-17',
    }
    const resultat = preparerSortie(saisie, AUJOURDHUI)
    expect(resultat.ok && resultat.parametres).toEqual({
      p_etat: 'perdu',
      p_motif_perte: 'abandon',
      p_motif_perte_detail: '',
    })
  })

  it('la relance avant la fin d’un mandat ne tombe jamais dans le passé', () => {
    expect(dateRelanceFinMandat('2027-03-01', AUJOURDHUI)).toBe('2027-02-14')
    expect(dateRelanceFinMandat('2026-11-20', AUJOURDHUI)).toBe(AUJOURDHUI)
    expect(dateRelanceFinMandat('2026-10-01', AUJOURDHUI)).toBe(AUJOURDHUI)
  })
})

describe('affichage', () => {
  it('dit depuis quand le projet est dans son étape', () => {
    expect(ancienneteEtape(AUJOURDHUI, AUJOURDHUI)).toBe('Depuis aujourd’hui')
    expect(ancienneteEtape('2026-11-16', AUJOURDHUI)).toBe('Depuis hier')
    expect(ancienneteEtape('2026-11-05', AUJOURDHUI)).toBe('Depuis 12 jours')
    expect(ancienneteEtape('2026-08-01', AUJOURDHUI)).toBe('Depuis 3 mois')
    expect(ancienneteEtape('2024-11-01', AUJOURDHUI)).toBe('Depuis 2 ans')
  })

  it('signale un projet qui stagne au-delà de 30 jours', () => {
    expect(etapeQuiTraine('2026-10-18', AUJOURDHUI)).toBe(false)
    expect(etapeQuiTraine('2026-10-17', AUJOURDHUI)).toBe(true)
  })

  it('résume l’état d’un projet', () => {
    expect(resumeEtat(projet({ etape: 'suivi' }))).toBe('Suivi')
    expect(resumeEtat(projet({ etat: 'perdu', motif_perte: 'vente_particuliers' }))).toBe(
      'Perdu : Vente entre particuliers',
    )
    expect(
      resumeEtat(
        projet({
          etat: 'gagne',
          etape: 'mandat_signe',
          mandat_type: 'simple',
          mandat_le: '2026-11-17',
        }),
      ),
    ).toBe('Mandat simple signé le 17 novembre 2026')
  })

  it('range les projets par étape, les plus anciens dans l’étape d’abord', () => {
    const a = { projet: projet({ id: 'a', etape: 'suivi', etape_le: '2026-11-10' }) }
    const b = { projet: projet({ id: 'b', etape: 'suivi', etape_le: '2026-10-01' }) }
    const c = { projet: projet({ id: 'c', etape: 'premier_contact' }) }
    const groupes = grouperParEtape([a, b, c])
    expect(groupes.map((g) => g.etape)).toEqual([
      'premier_contact',
      'decouverte',
      'estimation',
      'suivi',
      'mandat_signe',
    ])
    expect(groupes[3]?.projets.map((p) => p.projet.id)).toEqual(['b', 'a'])
    expect(groupes[0]?.projets).toHaveLength(1)
  })
})
