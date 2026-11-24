import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  brouillonProjetDepuis,
  creerProjetVendeur,
  preparerProjet,
  type BrouillonProjet,
} from './projets-vendeurs'
import type { ProjetVendeur } from './pipeline-vendeur'

const AUJOURDHUI = '2026-11-17'

const VIDE: BrouillonProjet = {
  motifVente: '',
  echeanceSouhaitee: '',
  prixEspere: '',
  estimationBasse: '',
  estimationHaute: '',
  estimationLe: '',
  avisRemisLe: '',
  agencesConsultees: '',
  mandatAilleurs: false,
  mandatAilleursFin: '',
  mandatType: '',
  mandatLe: '',
  notes: '',
}

describe('preparerProjet', () => {
  it('accepte un projet presque vide au premier contact', () => {
    const resultat = preparerProjet(VIDE, { etape: 'premier_contact' }, AUJOURDHUI)
    expect(resultat.ok && resultat.valeurs).toMatchObject({
      motif_vente: '',
      echeance_souhaitee: null,
      prix_espere: null,
      mandat_ailleurs: false,
      mandat_ailleurs_fin: null,
    })
  })

  it('lit les montants à la française', () => {
    const resultat = preparerProjet(
      { ...VIDE, prixEspere: '320 000 €', estimationBasse: '280000', estimationHaute: '300 000' },
      { etape: 'premier_contact' },
      AUJOURDHUI,
    )
    expect(resultat.ok && resultat.valeurs).toMatchObject({
      prix_espere: 320000,
      estimation_basse: 280000,
      estimation_haute: 300000,
    })
  })

  it('refuse d’effacer ce qu’exige l’étape du projet', () => {
    const resultat = preparerProjet(VIDE, { etape: 'suivi' }, AUJOURDHUI)
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(Object.keys(resultat.erreurs).sort()).toEqual([
      'avisRemisLe',
      'echeanceSouhaitee',
      'estimationBasse',
      'estimationHaute',
      'motifVente',
    ])
  })

  it('exige le type et la date du mandat signé', () => {
    const complet = {
      ...VIDE,
      motifVente: 'Mutation',
      echeanceSouhaitee: '2027-01-01',
      estimationBasse: '1',
      estimationHaute: '2',
      avisRemisLe: '2026-11-01',
    }
    const resultat = preparerProjet(complet, { etape: 'mandat_signe' }, AUJOURDHUI)
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(Object.keys(resultat.erreurs).sort()).toEqual(['mandatLe', 'mandatType'])
  })

  it('refuse une fourchette inversée et une date de remise à venir', () => {
    const resultat = preparerProjet(
      { ...VIDE, estimationBasse: '300000', estimationHaute: '200000', avisRemisLe: '2027-01-01' },
      { etape: 'premier_contact' },
      AUJOURDHUI,
    )
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.erreurs.estimationHaute).toBeDefined()
    expect(resultat.erreurs.avisRemisLe).toBeDefined()
  })

  it('oublie la fin d’un mandat concurrent quand il n’y en a pas', () => {
    const resultat = preparerProjet(
      { ...VIDE, mandatAilleurs: false, mandatAilleursFin: '2027-03-01' },
      { etape: 'premier_contact' },
      AUJOURDHUI,
    )
    expect(resultat.ok && resultat.valeurs.mandat_ailleurs_fin).toBeNull()
  })

  it('reprend un projet tel qu’il est enregistré', () => {
    const projet = {
      motif_vente: 'Succession',
      echeance_souhaitee: '2027-06-30',
      prix_espere: 300000,
      estimation_basse: null,
      estimation_haute: null,
      estimation_le: null,
      avis_remis_le: null,
      agences_consultees: 'Agence fictive',
      mandat_ailleurs: true,
      mandat_ailleurs_fin: '2027-03-01',
      mandat_type: null,
      mandat_le: null,
      notes: '',
    } as unknown as ProjetVendeur
    expect(brouillonProjetDepuis(projet)).toMatchObject({
      motifVente: 'Succession',
      prixEspere: '300000',
      estimationBasse: '',
      mandatAilleurs: true,
      mandatAilleursFin: '2027-03-01',
      mandatType: '',
    })
  })
})

describe('creerProjetVendeur', () => {
  it('explique qu’un bien a déjà un projet en cours', async () => {
    const { client } = fauxClient({ data: null, error: { code: '23505' }, status: 409 })
    const resultat = await creerProjetVendeur(client, { contactId: 'c', bienId: 'b' })
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.erreur.message).toMatch(/déjà un projet vendeur/)
  })

  it('crée le projet lié au contact et au bien', async () => {
    const { client, appels } = fauxClient({ data: { id: 'p' }, error: null })
    await creerProjetVendeur(client, { contactId: 'c', bienId: 'b' })
    expect(appels).toContainEqual(['insert', { contact_id: 'c', bien_id: 'b' }])
  })
})
