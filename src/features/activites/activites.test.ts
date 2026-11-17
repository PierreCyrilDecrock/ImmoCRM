import { describe, expect, it } from 'vitest'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { activiteEssai } from './activite-essai'
import {
  brouillonActiviteDepuis,
  brouillonActiviteVide,
  compteCommeContact,
  conditionsJournal,
  horaireActivite,
  parJour,
  preparerActivite,
  titreActivite,
  TYPES_ACTIVITE,
  type BrouillonActivite,
} from './activites'

const AUJOURDHUI = '2026-11-17'
const MAINTENANT = { date: AUJOURDHUI, heure: '14:30' }

function brouillon(valeurs: Partial<BrouillonActivite> = {}): BrouillonActivite {
  return { ...brouillonActiviteVide('appel', MAINTENANT), ...valeurs }
}

describe('brouillonActiviteVide', () => {
  it('est daté de maintenant et lié à la fiche d’où l’on vient', () => {
    const contact = contactEssai()
    expect(brouillonActiviteVide('visite', MAINTENANT, { contact })).toEqual({
      type: 'visite',
      resultat: '',
      compteRendu: '',
      date: AUJOURDHUI,
      heure: '14:30',
      duree: '',
      contact,
      bien: null,
      projetVendeurId: null,
    })
  })
})

describe('preparerActivite', () => {
  it('prépare un appel avec son résultat et son compte rendu', () => {
    const contact = contactEssai()
    const bien = bienEssai()
    const preparation = preparerActivite(
      brouillon({
        resultat: 'joint',
        compteRendu: '  Rappel au printemps  ',
        duree: '15',
        contact,
        bien,
      }),
      AUJOURDHUI,
    )
    expect(preparation).toEqual({
      ok: true,
      valeurs: {
        type: 'appel',
        resultat: 'joint',
        compte_rendu: 'Rappel au printemps',
        date_activite: AUJOURDHUI,
        heure: '14:30',
        duree: 15,
        contact_id: contact.id,
        bien_id: bien.id,
        projet_vendeur_id: null,
      },
    })
  })

  it('ne garde le résultat que pour un appel', () => {
    const preparation = preparerActivite(brouillon({ type: 'sms', resultat: 'joint' }), AUJOURDHUI)
    expect(preparation.ok && preparation.valeurs.resultat).toBeNull()
  })

  it('accepte un appel ou un SMS sans texte, pas une note vide', () => {
    expect(preparerActivite(brouillon({ resultat: 'messagerie' }), AUJOURDHUI).ok).toBe(true)
    expect(preparerActivite(brouillon({ type: 'sms' }), AUJOURDHUI).ok).toBe(true)
    expect(preparerActivite(brouillon({ type: 'note', compteRendu: '   ' }), AUJOURDHUI)).toEqual({
      ok: false,
      erreurs: { compteRendu: 'Écrivez ou dictez la note.' },
    })
  })

  it('refuse une date à venir : le journal est le passé', () => {
    const preparation = preparerActivite(brouillon({ date: '2026-11-18' }), AUJOURDHUI)
    expect(preparation.ok).toBe(false)
    expect(!preparation.ok && preparation.erreurs.date).toMatch(/créez une tâche/)
    expect(preparerActivite(brouillon({ date: '2025-01-01' }), AUJOURDHUI).ok).toBe(true)
  })

  it('refuse une date, une heure ou une durée illisibles', () => {
    expect(
      preparerActivite(brouillon({ date: '2026-02-30', heure: '25:00', duree: '0' }), AUJOURDHUI),
    ).toEqual({
      ok: false,
      erreurs: {
        date: 'Choisissez une date.',
        heure: 'Heure illisible. Exemple : 14:30.',
        duree: 'Durée illisible.',
      },
    })
  })

  it('refuse un compte rendu trop long', () => {
    const preparation = preparerActivite(brouillon({ compteRendu: 'a'.repeat(5001) }), AUJOURDHUI)
    expect(preparation.ok).toBe(false)
  })
})

describe('brouillonActiviteDepuis', () => {
  it('reprend une activité enregistrée, et la prépare à l’identique', () => {
    const contact = contactEssai()
    const activite = activiteEssai({
      type: 'appel',
      resultat: 'rappeler',
      compte_rendu: 'Rappeler après 18 h',
      date_activite: '2026-11-10',
      heure: '09:05:00',
      duree: 5,
      contact_id: contact.id,
    })
    const repris = brouillonActiviteDepuis({ id: activite.id, activite, contact, bien: null })
    expect(repris).toMatchObject({ resultat: 'rappeler', heure: '09:05', duree: '5' })
    expect(preparerActivite(repris, AUJOURDHUI)).toEqual({
      ok: true,
      valeurs: {
        type: 'appel',
        resultat: 'rappeler',
        compte_rendu: 'Rappeler après 18 h',
        date_activite: '2026-11-10',
        heure: '09:05',
        duree: 5,
        contact_id: contact.id,
        bien_id: null,
        projet_vendeur_id: null,
      },
    })
  })

  it('garde le lien vers un projet vendeur', () => {
    const activite = activiteEssai({ projet_vendeur_id: 'p1' })
    const repris = brouillonActiviteDepuis({ id: activite.id, activite, contact: null, bien: null })
    expect(repris.projetVendeurId).toBe('p1')
    const preparation = preparerActivite(repris, AUJOURDHUI)
    expect(preparation.ok && preparation.valeurs.projet_vendeur_id).toBe('p1')
  })
})

describe('affichage', () => {
  it('nomme l’activité avec le résultat d’un appel', () => {
    expect(titreActivite({ type: 'appel', resultat: 'pas_de_reponse' })).toBe(
      'Appel · Pas de réponse',
    )
    expect(titreActivite({ type: 'appel', resultat: null })).toBe('Appel')
    expect(titreActivite({ type: 'document', resultat: null })).toBe('Document envoyé')
  })

  it('donne l’heure, et la durée si elle est connue', () => {
    expect(horaireActivite({ heure: '14:30:00', duree: null })).toBe('14 h 30')
    expect(horaireActivite({ heure: '09:00:00', duree: 90 })).toBe('9 h · 1 h 30')
  })

  it('propose chaque type une seule fois', () => {
    const valeurs = TYPES_ACTIVITE.map((option) => option.valeur)
    expect(new Set(valeurs).size).toBe(10)
  })

  it('compte tout sauf la note comme un contact', () => {
    expect(compteCommeContact('appel')).toBe(true)
    expect(compteCommeContact('document')).toBe(true)
    expect(compteCommeContact('note')).toBe(false)
  })
})

describe('parJour', () => {
  it('regroupe les activités par jour, dans l’ordre reçu', () => {
    const a = { activite: activiteEssai({ id: 'a', date_activite: '2026-11-17' }) }
    const b = { activite: activiteEssai({ id: 'b', date_activite: '2026-11-17' }) }
    const c = { activite: activiteEssai({ id: 'c', date_activite: '2026-11-12' }) }
    expect(parJour([a, b, c])).toEqual([
      { date: '2026-11-17', activites: [a, b] },
      { date: '2026-11-12', activites: [c] },
    ])
    expect(parJour([])).toEqual([])
  })
})

describe('conditionsJournal', () => {
  it('filtre par fiche, par type et par période', () => {
    expect(
      conditionsJournal({
        lien: { contactId: 'c1' },
        type: 'visite',
        bornes: { min: '2026-11-01', max: AUJOURDHUI },
      }),
    ).toEqual([
      { colonne: 'contact_id', genre: 'egal', valeur: 'c1' },
      { colonne: 'type', genre: 'egal', valeur: 'visite' },
      { colonne: 'date_activite', genre: 'min', valeur: '2026-11-01' },
      { colonne: 'date_activite', genre: 'max', valeur: AUJOURDHUI },
    ])
    expect(conditionsJournal({ lien: { bienId: 'b1' }, type: '' })).toEqual([
      { colonne: 'bien_id', genre: 'egal', valeur: 'b1' },
    ])
    expect(conditionsJournal({})).toEqual([])
  })
})
