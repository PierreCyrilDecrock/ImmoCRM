import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { tacheEssai } from './tache-essai'
import {
  brouillonTacheDepuis,
  brouillonTacheVide,
  cloturerTache,
  conditionsVue,
  horaireTache,
  listerTachesLiees,
  preparerTache,
  type BrouillonTache,
} from './taches'

const AUJOURDHUI = '2026-11-17'

function brouillon(valeurs: Partial<BrouillonTache> = {}): BrouillonTache {
  return { ...brouillonTacheVide(AUJOURDHUI), titre: 'Appeler le notaire', ...valeurs }
}

describe('brouillonTacheVide', () => {
  it('propose une relance depuis la fiche d’un contact', () => {
    expect(brouillonTacheVide(AUJOURDHUI, { contact: contactEssai() }).categorie).toBe('relance')
    expect(brouillonTacheVide(AUJOURDHUI).categorie).toBe('autre')
    expect(brouillonTacheVide(AUJOURDHUI, { bien: bienEssai() }).bien?.id).toBe(bienEssai().id)
  })
})

describe('preparerTache', () => {
  it('prépare une tâche simple, avec ses liens', () => {
    const resultat = preparerTache(
      brouillon({ titre: '  Appeler  ', contact: contactEssai(), bien: bienEssai() }),
    )
    expect(resultat).toEqual({
      ok: true,
      valeurs: expect.objectContaining({
        titre: 'Appeler',
        echeance: AUJOURDHUI,
        heure: null,
        duree: null,
        priorite: 2,
        recurrence: null,
        recurrence_ancre: null,
        recurrence_rang: 0,
        contact_id: contactEssai().id,
        bien_id: bienEssai().id,
      }),
    })
  })

  it('accepte un rendez-vous avec heure, durée et lieu', () => {
    const resultat = preparerTache(
      brouillon({ heure: '09:30', duree: '90', lieu: ' 1 rue de l’Exemple ', priorite: '1' }),
    )
    expect(resultat.ok && resultat.valeurs).toMatchObject({
      heure: '09:30',
      duree: 90,
      lieu: '1 rue de l’Exemple',
      priorite: 1,
    })
  })

  it('refuse un titre vide, une date absente, une heure illisible', () => {
    const resultat = preparerTache(brouillon({ titre: ' ', echeance: '', heure: '25:00' }))
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(Object.keys(resultat.erreurs).sort()).toEqual(['echeance', 'heure', 'titre'])
  })

  it('refuse une durée sans heure', () => {
    const resultat = preparerTache(brouillon({ duree: '30' }))
    expect(resultat.ok ? null : resultat.erreurs.duree).toBe(
      'Une durée demande une heure de début.',
    )
  })

  it('fait partir une nouvelle série de la date saisie', () => {
    const resultat = preparerTache(brouillon({ recurrence: 'mois', echeance: '2027-01-31' }))
    expect(resultat.ok && resultat.valeurs).toMatchObject({
      recurrence: 'mois',
      recurrence_ancre: '2027-01-31',
      recurrence_rang: 0,
    })
  })

  it('garde la série d’une occurrence modifiée sans changer sa date', () => {
    const existante = tacheEssai({
      recurrence: 'mois',
      recurrence_ancre: '2027-01-31',
      recurrence_rang: 1,
      echeance: '2027-02-28',
    })
    const garde = preparerTache(
      {
        ...brouillonTacheDepuis({ id: existante.id, tache: existante, contact: null, bien: null }),
        titre: 'Autre titre',
      },
      existante,
    )
    expect(garde.ok && garde.valeurs).toMatchObject({
      recurrence_ancre: '2027-01-31',
      recurrence_rang: 1,
    })
    // Changer la date dans le formulaire fait repartir la série de la nouvelle date.
    const deplacee = preparerTache(
      {
        ...brouillonTacheDepuis({ id: existante.id, tache: existante, contact: null, bien: null }),
        echeance: '2027-03-05',
      },
      existante,
    )
    expect(deplacee.ok && deplacee.valeurs).toMatchObject({
      recurrence_ancre: '2027-03-05',
      recurrence_rang: 0,
    })
  })

  it('relit l’heure enregistrée par la base sans les secondes', () => {
    const tache = tacheEssai({ heure: '14:00:00', duree: 60 })
    const relu = brouillonTacheDepuis({ id: tache.id, tache, contact: null, bien: null })
    expect(relu.heure).toBe('14:00')
    expect(relu.duree).toBe('60')
  })
})

describe('horaireTache', () => {
  it('écrit l’horaire d’un rendez-vous', () => {
    expect(horaireTache({ heure: '10:00:00', duree: 60 })).toBe('10 h – 11 h')
    expect(horaireTache({ heure: '09:30:00', duree: null })).toBe('9 h 30')
    expect(horaireTache({ heure: '23:30:00', duree: 60 })).toBe('23 h 30 (1 h)')
    expect(horaireTache({ heure: null, duree: null })).toBe('')
  })
})

describe('conditionsVue', () => {
  it('filtre les tâches à faire par date d’échéance', () => {
    expect(conditionsVue('aujourdhui', AUJOURDHUI)).toEqual([
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
      { colonne: 'echeance', genre: 'min', valeur: AUJOURDHUI },
      { colonne: 'echeance', genre: 'max', valeur: AUJOURDHUI },
    ])
    expect(conditionsVue('en_retard', AUJOURDHUI)).toEqual([
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
      { colonne: 'echeance', genre: 'max', valeur: '2026-11-16' },
    ])
    expect(conditionsVue('a_faire', AUJOURDHUI)).toEqual([
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
      { colonne: 'echeance', genre: 'max', valeur: AUJOURDHUI },
    ])
    expect(conditionsVue('terminees', AUJOURDHUI)).toEqual([
      { colonne: 'etat', genre: 'parmi', valeur: ['faite', 'annulee'] },
    ])
  })
})

describe('cloturerTache', () => {
  it('clôt une tâche unique sans créer de suite', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    const resultat = await cloturerTache(client, tacheEssai(), {
      etat: 'faite',
      aujourdhui: AUJOURDHUI,
    })
    expect(resultat).toEqual({ ok: true, donnees: null })
    expect(appels).toEqual([['rpc', 'cloturer_tache', { p_id: tacheEssai().id, p_etat: 'faite' }]])
  })

  it('demande la création de l’occurrence suivante d’une tâche récurrente', async () => {
    const suivante = tacheEssai({ id: 'suivante', echeance: '2027-02-28' })
    const { client, appels } = fauxClient({ data: [suivante], error: null })
    const tache = tacheEssai({
      recurrence: 'mois',
      recurrence_ancre: '2027-01-31',
      echeance: '2027-01-31',
    })
    const resultat = await cloturerTache(client, tache, { etat: 'faite', aujourdhui: '2027-01-31' })
    expect(resultat).toEqual({ ok: true, donnees: suivante })
    expect(appels[0]).toEqual([
      'rpc',
      'cloturer_tache',
      { p_id: tache.id, p_etat: 'faite', p_suivante_echeance: '2027-02-28', p_suivante_rang: 1 },
    ])
  })

  it('n’en crée pas quand on arrête la série', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    const tache = tacheEssai({ recurrence: 'semaine', recurrence_ancre: '2026-11-17' })
    await cloturerTache(client, tache, {
      etat: 'annulee',
      aujourdhui: AUJOURDHUI,
      arreterSerie: true,
    })
    expect(appels[0]).toEqual(['rpc', 'cloturer_tache', { p_id: tache.id, p_etat: 'annulee' }])
  })

  it('explique le refus d’une tâche déjà close', async () => {
    const { client } = fauxClient({ data: null, error: { code: '22023', message: 'déjà close' } })
    const resultat = await cloturerTache(client, tacheEssai(), {
      etat: 'faite',
      aujourdhui: AUJOURDHUI,
    })
    expect(resultat.ok ? '' : resultat.erreur.message).toContain('déjà été close')
  })
})

describe('lien vers un projet vendeur', () => {
  it('est gardé quand on modifie la tâche', () => {
    const existante = tacheEssai({ projet_vendeur_id: 'p1' })
    const brouillon = brouillonTacheDepuis({
      id: existante.id,
      tache: existante,
      contact: null,
      bien: null,
    })
    expect(brouillon.projet).toEqual({ genre: 'vendeur', id: 'p1' })
    const preparation = preparerTache(brouillon, existante)
    expect(preparation.ok && preparation.valeurs.projet_vendeur_id).toBe('p1')
  })

  it('peut être posé dès la création, depuis la fiche du projet', () => {
    const brouillon = brouillonTacheVide('2026-11-17', {
      projet: { genre: 'vendeur', id: 'p2' },
    })
    const preparation = preparerTache({ ...brouillon, titre: 'Relancer' })
    expect(preparation.ok && preparation.valeurs.projet_vendeur_id).toBe('p2')
  })

  it('se lit par la colonne du projet', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerTachesLiees(client, { projetVendeurId: 'p3' })
    expect(appels).toContainEqual(['eq', 'projet_vendeur_id', 'p3'])
  })

  it('peut viser un projet acquéreur, sans lien vendeur', async () => {
    const brouillon = brouillonTacheVide('2026-11-17', {
      projet: { genre: 'acquereur', id: 'a2' },
    })
    const preparation = preparerTache({ ...brouillon, titre: 'Visite' })
    expect(preparation.ok && preparation.valeurs.projet_acquereur_id).toBe('a2')
    expect(preparation.ok && preparation.valeurs.projet_vendeur_id).toBeNull()
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerTachesLiees(client, { projetAcquereurId: 'a3' })
    expect(appels).toContainEqual(['eq', 'projet_acquereur_id', 'a3'])
  })
})
