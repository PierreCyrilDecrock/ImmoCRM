import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { contactEssai } from '../contacts/contact-essai'
import { tacheEssai } from '../taches/tache-essai'
import {
  bouclerTache,
  brouillonBoucle,
  preparerBoucle,
  RESULTATS_RELANCE,
  suitePrevue,
  titreRelance,
  typeActiviteDeTache,
  type BrouillonBoucle,
} from './boucle'
import { DELAIS_PAR_DEFAUT } from './delais'

const aujourdhui = '2026-11-17'
const contact = contactEssai({ id: 'c1', temperature: 'tiede' })
const tache = tacheEssai({ id: 't1', contact_id: 'c1', categorie: 'relance' })

describe('typeActiviteDeTache', () => {
  it('fait d’une relance un appel, et garde le type des rendez-vous et visites', () => {
    expect(typeActiviteDeTache('relance')).toBe('appel')
    expect(typeActiviteDeTache('rendez_vous')).toBe('rendez_vous')
    expect(typeActiviteDeTache('visite')).toBe('visite')
    expect(typeActiviteDeTache('estimation')).toBe('estimation')
    expect(typeActiviteDeTache('administratif')).toBe('autre')
    expect(typeActiviteDeTache('inconnue')).toBe('autre')
  })
})

describe('RESULTATS_RELANCE', () => {
  it('propose joint, messagerie et pas de réponse', () => {
    expect(RESULTATS_RELANCE.map((option) => option.valeur)).toEqual([
      'joint',
      'messagerie',
      'pas_de_reponse',
    ])
  })
})

describe('titreRelance', () => {
  it('nomme le contact à relancer', () => {
    expect(titreRelance(contact)).toBe('Relancer Camille Fictif')
  })
})

describe('suitePrevue', () => {
  it('ne trouve rien pour une tâche unique, sans autre tâche', () => {
    expect(suitePrevue(tache, [tache], aujourdhui)).toBeNull()
  })

  it('retient la plus proche des autres tâches à faire du contact', () => {
    const autres = [
      tache,
      tacheEssai({ id: 't2', titre: 'Visite', echeance: '2026-12-01' }),
      tacheEssai({ id: 't3', titre: 'Estimation', echeance: '2026-11-20' }),
      tacheEssai({ id: 't4', titre: 'Close', echeance: '2026-11-18', etat: 'faite' }),
    ]
    expect(suitePrevue(tache, autres, aujourdhui)).toEqual({
      titre: 'Estimation',
      echeance: '2026-11-20',
      serie: false,
    })
  })

  it('compte l’occurrence suivante d’une tâche récurrente', () => {
    const recurrente = tacheEssai({
      id: 't1',
      recurrence: 'mois',
      recurrence_ancre: '2026-11-17',
      recurrence_rang: 0,
    })
    expect(suitePrevue(recurrente, [], aujourdhui)).toEqual({
      titre: recurrente.titre,
      echeance: '2026-12-17',
      serie: true,
    })
  })
})

describe('brouillonBoucle', () => {
  it('propose une relance à un mois pour un contact tiède', () => {
    const brouillon = brouillonBoucle(tache, contact, {
      aujourdhui,
      delais: DELAIS_PAR_DEFAUT,
      suite: null,
    })
    expect(brouillon).toMatchObject({
      type: 'appel',
      resultat: '',
      mode: 'planifier',
      temperature: 'tiede',
      titre: 'Relancer Camille Fictif',
      categorie: 'relance',
      echeance: '2026-12-17',
    })
  })

  it('suit la température : une semaine pour un contact chaud', () => {
    const brouillon = brouillonBoucle(tache, contactEssai({ temperature: 'chaud' }), {
      aujourdhui,
      delais: DELAIS_PAR_DEFAUT,
      suite: null,
    })
    expect(brouillon.echeance).toBe('2026-11-24')
  })

  it('applique le délai d’un contact tiède quand la température est inconnue', () => {
    const brouillon = brouillonBoucle(tache, contactEssai({ temperature: null }), {
      aujourdhui,
      delais: DELAIS_PAR_DEFAUT,
      suite: null,
    })
    expect(brouillon.temperature).toBe('')
    expect(brouillon.echeance).toBe('2026-12-17')
  })

  it('ne propose rien de plus si une autre action reste prévue', () => {
    const brouillon = brouillonBoucle(tache, contact, {
      aujourdhui,
      delais: DELAIS_PAR_DEFAUT,
      suite: { titre: 'Visite', echeance: '2026-11-20', serie: false },
    })
    expect(brouillon.mode).toBe('deja_prevue')
  })
})

describe('preparerBoucle', () => {
  const depart = (valeurs: Partial<BrouillonBoucle> = {}): BrouillonBoucle => ({
    ...brouillonBoucle(tache, contact, { aujourdhui, delais: DELAIS_PAR_DEFAUT, suite: null }),
    ...valeurs,
  })
  const contexte = { tache, contact, aujourdhui, suite: null }

  it('prépare la tâche faite, l’activité et la prochaine relance', () => {
    const preparation = preparerBoucle(
      depart({ resultat: 'joint', compteRendu: '  Rappeler après les fêtes. ' }),
      contexte,
    )
    expect(preparation).toEqual({
      ok: true,
      parametres: {
        p_id: 't1',
        p_type: 'appel',
        p_resultat: 'joint',
        p_compte_rendu: 'Rappeler après les fêtes.',
        p_prochaine_titre: 'Relancer Camille Fictif',
        p_prochaine_categorie: 'relance',
        p_prochaine_echeance: '2026-12-17',
        p_prochaine_motif: '',
        p_sans_prochaine_action: false,
      },
    })
  })

  it('envoie l’heure, et la température si elle a changé', () => {
    const preparation = preparerBoucle(
      depart({ temperature: 'chaud', echeance: '2026-11-24', heure: '10:30' }),
      contexte,
    )
    expect(preparation.ok && preparation.parametres).toMatchObject({
      p_prochaine_echeance: '2026-11-24',
      p_prochaine_heure: '10:30',
      p_temperature: 'chaud',
    })
  })

  it('n’envoie pas la température inchangée', () => {
    const preparation = preparerBoucle(depart(), contexte)
    expect(preparation.ok && 'p_temperature' in preparation.parametres).toBe(false)
  })

  it('ne garde le résultat que pour un appel', () => {
    const preparation = preparerBoucle(depart({ type: 'visite', resultat: 'joint' }), contexte)
    expect(preparation.ok && 'p_resultat' in preparation.parametres).toBe(false)
  })

  it('demande un titre et une date à partir d’aujourd’hui', () => {
    expect(preparerBoucle(depart({ titre: ' ', echeance: '2026-11-16' }), contexte)).toEqual({
      ok: false,
      erreurs: {
        titre: 'Indiquez la prochaine action.',
        echeance: 'La prochaine action se prévoit à partir d’aujourd’hui.',
      },
    })
    expect(preparerBoucle(depart({ echeance: '' }), contexte).ok).toBe(false)
    expect(preparerBoucle(depart({ heure: '25:00' }), contexte).ok).toBe(false)
    expect(preparerBoucle(depart({ echeance: aujourdhui }), contexte).ok).toBe(true)
  })

  it('enregistre le refus confirmé, sans prochaine action', () => {
    const preparation = preparerBoucle(depart({ mode: 'aucune', titre: '' }), contexte)
    expect(preparation).toEqual({
      ok: true,
      parametres: {
        p_id: 't1',
        p_type: 'appel',
        p_compte_rendu: '',
        p_sans_prochaine_action: true,
      },
    })
  })

  it('refuse « rien de plus » quand rien d’autre n’est prévu', () => {
    const preparation = preparerBoucle(depart({ mode: 'deja_prevue' }), contexte)
    expect(preparation.ok).toBe(false)
  })

  it('accepte « rien de plus » quand une autre action reste prévue', () => {
    const preparation = preparerBoucle(depart({ mode: 'deja_prevue' }), {
      ...contexte,
      suite: { titre: 'Visite', echeance: '2026-11-20', serie: false },
    })
    expect(preparation.ok && preparation.parametres.p_sans_prochaine_action).toBe(false)
    expect(preparation.ok && 'p_prochaine_titre' in preparation.parametres).toBe(false)
  })

  it('passe l’occurrence suivante d’une tâche récurrente', () => {
    const recurrente = tacheEssai({
      id: 't1',
      contact_id: 'c1',
      recurrence: 'semaine',
      recurrence_ancre: '2026-11-17',
      recurrence_rang: 0,
    })
    const preparation = preparerBoucle(depart({ mode: 'deja_prevue' }), {
      ...contexte,
      tache: recurrente,
      suite: { titre: recurrente.titre, echeance: '2026-11-24', serie: true },
    })
    expect(preparation.ok && preparation.parametres).toMatchObject({
      p_suivante_echeance: '2026-11-24',
      p_suivante_rang: 1,
    })
  })

  it('limite la longueur du compte rendu', () => {
    const preparation = preparerBoucle(depart({ compteRendu: 'a'.repeat(5001) }), contexte)
    expect(preparation.ok).toBe(false)
  })
})

describe('bouclerTache', () => {
  it('appelle la fonction de la base et renvoie les tâches créées', async () => {
    const creee = tacheEssai({ id: 't9', echeance: '2026-12-17' })
    const { client, appels } = fauxClient({ data: [creee], error: null })
    const resultat = await bouclerTache(client, { p_id: 't1', p_type: 'appel' })
    expect(resultat).toEqual({ ok: true, donnees: [creee] })
    expect(appels).toContainEqual(['rpc', 'boucler_tache', { p_id: 't1', p_type: 'appel' }])
  })

  it('explique un refus de la base', async () => {
    const { client } = fauxClient({ data: null, error: { code: '22023', message: 'déjà close' } })
    const resultat = await bouclerTache(client, { p_id: 't1', p_type: 'appel' })
    expect(resultat.ok === false && resultat.erreur.message).toMatch(/déjà été close/)
  })
})
