import { describe, expect, it } from 'vitest'
import {
  adresseRendezVous,
  assembler,
  basculerRepli,
  blocDeTache,
  cartesDeLAppareil,
  CATEGORIES_HORS_RELANCE,
  conditionsAgenda,
  conditionsRelances,
  conditionsTaches,
  enUneLigne,
  joursDepuis,
  lienItineraire,
  lireReplis,
  qualificationEnRetard,
  resumeDerniereActivite,
  retardRelance,
  tempsEcoule,
} from './journee'

const AUJOURDHUI = '2026-11-17'

describe('répartition des tâches entre les blocs', () => {
  const tache = (echeance: string, heure: string | null, categorie: string, etat = 'a_faire') => ({
    echeance,
    heure,
    categorie,
    etat,
  })

  it("met dans l'agenda les tâches d'aujourd'hui qui ont une heure, relances comprises", () => {
    expect(blocDeTache(tache(AUJOURDHUI, '10:00:00', 'visite'), AUJOURDHUI)).toBe('agenda')
    expect(blocDeTache(tache(AUJOURDHUI, '14:00:00', 'relance'), AUJOURDHUI)).toBe('agenda')
  })

  it('met dans « À relancer » les relances sans heure ou en retard', () => {
    expect(blocDeTache(tache(AUJOURDHUI, null, 'relance'), AUJOURDHUI)).toBe('relances')
    expect(blocDeTache(tache('2026-11-10', '09:00:00', 'relance'), AUJOURDHUI)).toBe('relances')
  })

  it('met tout le reste dans « Tâches », y compris un rendez-vous passé resté ouvert', () => {
    expect(blocDeTache(tache(AUJOURDHUI, null, 'administratif'), AUJOURDHUI)).toBe('taches')
    expect(blocDeTache(tache('2026-11-16', '10:00:00', 'rendez_vous'), AUJOURDHUI)).toBe('taches')
  })

  it('laisse de côté les tâches à venir et les tâches closes', () => {
    expect(blocDeTache(tache('2026-11-18', null, 'relance'), AUJOURDHUI)).toBeNull()
    expect(blocDeTache(tache(AUJOURDHUI, null, 'relance', 'faite'), AUJOURDHUI)).toBeNull()
  })

  it('demande à la base exactement ce que range la règle', () => {
    expect(conditionsAgenda(AUJOURDHUI)).toEqual([
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
      { colonne: 'echeance', genre: 'egal', valeur: AUJOURDHUI },
      { colonne: 'heure', genre: 'nonVide' },
    ])
    expect(conditionsRelances('en_retard', AUJOURDHUI)).toEqual([
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
      { colonne: 'categorie', genre: 'egal', valeur: 'relance' },
      { colonne: 'echeance', genre: 'max', valeur: '2026-11-16' },
    ])
    expect(conditionsTaches('du_jour', AUJOURDHUI)).toEqual([
      { colonne: 'etat', genre: 'egal', valeur: 'a_faire' },
      { colonne: 'categorie', genre: 'parmi', valeur: CATEGORIES_HORS_RELANCE },
      { colonne: 'echeance', genre: 'egal', valeur: AUJOURDHUI },
      { colonne: 'heure', genre: 'vide' },
    ])
  })

  it('exclut la relance des autres catégories, et rien d’autre', () => {
    expect(CATEGORIES_HORS_RELANCE).not.toContain('relance')
    expect(CATEGORIES_HORS_RELANCE).toContain('administratif')
    expect(CATEGORIES_HORS_RELANCE).toHaveLength(6)
  })
})

describe('assembler', () => {
  it('garde les retards en premier, coupe à la limite et additionne les totaux', () => {
    const bloc = assembler(
      [
        { lignes: ['retard 1', 'retard 2'], total: 2 },
        { lignes: ['jour 1', 'jour 2'], total: 5 },
      ],
      3,
    )
    expect(bloc).toEqual({ lignes: ['retard 1', 'retard 2', 'jour 1'], total: 7 })
  })

  it('compte les lignes quand le total est inconnu', () => {
    expect(assembler([{ lignes: ['a'], total: null }], 10).total).toBe(1)
  })
})

describe('adresse et itinéraire', () => {
  const bien = {
    adresse: '3 rue de l’Exemple',
    complement: '',
    code_postal: '00000',
    ville: 'Villefictive',
  }
  const contact = { adresse: '8 avenue du Test', code_postal: '00000', ville: 'Villefictive' }

  it('prend le lieu du rendez-vous, sinon le bien, sinon le contact', () => {
    expect(adresseRendezVous({ lieu: ' Café du Test ' }, bien, contact)).toBe('Café du Test')
    expect(adresseRendezVous({ lieu: '' }, bien, contact)).toBe(
      '3 rue de l’Exemple, 00000 Villefictive',
    )
    expect(adresseRendezVous({ lieu: '' }, null, contact)).toBe(
      '8 avenue du Test, 00000 Villefictive',
    )
    expect(adresseRendezVous({ lieu: '' }, { ...bien, adresse: '' }, null)).toBeNull()
  })

  it('ouvre Plans sur les appareils Apple, Google Maps ailleurs', () => {
    expect(cartesDeLAppareil('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(
      'apple',
    )
    expect(cartesDeLAppareil('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('google')
    expect(cartesDeLAppareil('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('google')
  })

  it("encode l'adresse de destination", () => {
    const adresse = '12 rue de l’Exemple, 00000 Villefictive'
    expect(lienItineraire(adresse, 'apple')).toBe(
      `https://maps.apple.com/?daddr=${encodeURIComponent(adresse)}`,
    )
    expect(lienItineraire(adresse, 'google')).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(adresse)}`,
    )
    expect(lienItineraire('1 place & co', 'google')).toContain('1%20place%20%26%20co')
  })
})

describe('relances', () => {
  it('dit le retard simplement', () => {
    expect(retardRelance(AUJOURDHUI, AUJOURDHUI)).toEqual({ texte: "Aujourd'hui", enRetard: false })
    expect(retardRelance('2026-11-16', AUJOURDHUI)).toEqual({
      texte: "En retard d'un jour",
      enRetard: true,
    })
    expect(retardRelance('2026-11-02', AUJOURDHUI).texte).toBe('En retard de 15 jours')
  })

  it('résume la dernière activité en une ligne', () => {
    const appel = {
      type: 'appel',
      resultat: 'messagerie',
      date_activite: '2026-11-16',
      compte_rendu: 'Message laissé,\nrappeler   en fin de semaine',
    }
    expect(resumeDerniereActivite(appel, AUJOURDHUI)).toBe(
      'Appel · Messagerie, hier : « Message laissé, rappeler en fin de semaine »',
    )
    expect(
      resumeDerniereActivite(
        { ...appel, type: 'sms', resultat: null, date_activite: '2026-11-14', compte_rendu: '' },
        AUJOURDHUI,
      ),
    ).toBe('SMS, il y a 3 jours')
    expect(
      resumeDerniereActivite(
        { ...appel, date_activite: '2026-10-01', compte_rendu: '' },
        AUJOURDHUI,
      ),
    ).toBe('Appel · Messagerie, le jeu. 1 oct.')
    expect(resumeDerniereActivite(null, AUJOURDHUI)).toBe('Aucune activité au journal')
  })

  it('coupe un texte trop long avec des points de suspension', () => {
    expect(enUneLigne('a'.repeat(100), 10)).toBe(`${'a'.repeat(9)}…`)
    expect(enUneLigne('  court  ')).toBe('court')
  })
})

describe('temps écoulé', () => {
  const maintenant = new Date('2026-11-17T15:00:00Z')
  const avant = (minutes: number) => new Date(maintenant.getTime() - minutes * 60000).toISOString()

  it('parle en minutes, en heures, puis en jours', () => {
    expect(tempsEcoule(avant(0), maintenant)).toBe("à l'instant")
    expect(tempsEcoule(avant(12), maintenant)).toBe('il y a 12 min')
    expect(tempsEcoule(avant(60), maintenant)).toBe('il y a 1 h')
    expect(tempsEcoule(avant(135), maintenant)).toBe('il y a 2 h 15')
    expect(tempsEcoule(avant(7 * 60 + 20), maintenant)).toBe('il y a 7 h')
    expect(tempsEcoule(avant(26 * 60), maintenant)).toBe('il y a 1 jour')
    expect(tempsEcoule(avant(4 * 24 * 60), maintenant)).toBe('il y a 4 jours')
    expect(tempsEcoule('pas une date', maintenant)).toBe('')
  })

  it("signale une demande qui attend depuis plus d'une heure", () => {
    expect(qualificationEnRetard(avant(59), maintenant)).toBe(false)
    expect(qualificationEnRetard(avant(61), maintenant)).toBe(true)
  })

  it('compte les jours de calme sans jamais être négatif', () => {
    expect(joursDepuis('2026-10-25', AUJOURDHUI)).toBe(23)
    expect(joursDepuis('2026-11-20', AUJOURDHUI)).toBe(0)
  })
})

describe('blocs repliés', () => {
  it('relit la mémoire en ignorant ce qui est inconnu ou illisible', () => {
    expect(lireReplis('["taches","pirate","agenda"]')).toEqual(['agenda', 'taches'])
    expect(lireReplis('{"agenda":true}')).toEqual([])
    expect(lireReplis('pas du JSON')).toEqual([])
    expect(lireReplis(null)).toEqual([])
  })

  it('replie puis rouvre un bloc', () => {
    const replies = basculerRepli([], 'alertes')
    expect(replies).toEqual(['alertes'])
    expect(basculerRepli(replies, 'agenda')).toEqual(['agenda', 'alertes'])
    expect(basculerRepli(replies, 'alertes')).toEqual([])
  })
})
