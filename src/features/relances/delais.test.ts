import { describe, expect, it } from 'vitest'
import {
  ajouterDelai,
  CHOIX_DELAIS,
  DELAIS_PAR_DEFAUT,
  delaisLisibles,
  libelleDelai,
  lireDelai,
  proposerRelance,
} from './delais'

describe('lireDelai', () => {
  it('lit le nombre et l’unité', () => {
    expect(lireDelai('1s')).toEqual({ nombre: 1, unite: 's' })
    expect(lireDelai('3m')).toEqual({ nombre: 3, unite: 'm' })
    expect(lireDelai('15j')).toEqual({ nombre: 15, unite: 'j' })
  })

  it('refuse ce qui n’a pas la forme attendue', () => {
    for (const code of ['', 's', '0s', '100j', '1a', '1 s', 'm1', '1S']) {
      expect(lireDelai(code)).toBeNull()
    }
  })
})

describe('libelleDelai', () => {
  it('écrit le délai en clair, au singulier comme au pluriel', () => {
    expect(libelleDelai('1j')).toBe('1 jour')
    expect(libelleDelai('2j')).toBe('2 jours')
    expect(libelleDelai('1s')).toBe('1 semaine')
    expect(libelleDelai('3s')).toBe('3 semaines')
    expect(libelleDelai('1m')).toBe('1 mois')
    expect(libelleDelai('6m')).toBe('6 mois')
    expect(libelleDelai('12m')).toBe('1 an')
    expect(libelleDelai('24m')).toBe('2 ans')
  })

  it('rend tel quel un délai illisible', () => {
    expect(libelleDelai('bientôt')).toBe('bientôt')
  })

  it('propose des choix lisibles, tous différents', () => {
    expect(CHOIX_DELAIS.every((choix) => lireDelai(choix.valeur) !== null)).toBe(true)
    const libelles = CHOIX_DELAIS.map((choix) => choix.libelle)
    expect(new Set(libelles).size).toBe(libelles.length)
  })
})

describe('ajouterDelai', () => {
  it('compte les jours et les semaines de 7 jours', () => {
    expect(ajouterDelai('2026-11-17', '2j')).toBe('2026-11-19')
    expect(ajouterDelai('2026-11-17', '1s')).toBe('2026-11-24')
    expect(ajouterDelai('2026-12-29', '1s')).toBe('2027-01-05')
  })

  it('suit le calendrier pour les mois', () => {
    expect(ajouterDelai('2026-11-17', '1m')).toBe('2026-12-17')
    expect(ajouterDelai('2026-11-17', '3m')).toBe('2027-02-17')
    expect(ajouterDelai('2026-11-17', '6m')).toBe('2027-05-17')
    expect(ajouterDelai('2026-11-17', '12m')).toBe('2027-11-17')
  })

  it('prend le dernier jour du mois quand le jour n’existe pas', () => {
    expect(ajouterDelai('2027-01-31', '1m')).toBe('2027-02-28')
    expect(ajouterDelai('2027-08-31', '6m')).toBe('2028-02-29')
    expect(ajouterDelai('2026-12-31', '3m')).toBe('2027-03-31')
  })

  it('ne se laisse pas décaler par le changement d’heure', () => {
    expect(ajouterDelai('2027-03-27', '1s')).toBe('2027-04-03')
    expect(ajouterDelai('2026-10-24', '2j')).toBe('2026-10-26')
  })

  it('renvoie null pour un délai illisible', () => {
    expect(ajouterDelai('2026-11-17', '1a')).toBeNull()
  })
})

describe('proposerRelance', () => {
  const aujourdhui = '2026-11-17'

  it('suit la température du contact, avec les délais par défaut', () => {
    expect(proposerRelance(aujourdhui, 'chaud').echeance).toBe('2026-11-24')
    expect(proposerRelance(aujourdhui, 'tiede').echeance).toBe('2026-12-17')
    expect(proposerRelance(aujourdhui, 'froid').echeance).toBe('2027-02-17')
    expect(proposerRelance(aujourdhui, 'veille').echeance).toBe('2027-05-17')
  })

  it('dit quel délai a servi', () => {
    expect(proposerRelance(aujourdhui, 'tiede')).toEqual({
      echeance: '2026-12-17',
      delai: '1m',
      temperature: 'tiede',
      parDefaut: false,
    })
  })

  it('applique le délai d’un contact tiède sans température connue', () => {
    expect(proposerRelance(aujourdhui, null)).toEqual({
      echeance: '2026-12-17',
      delai: '1m',
      temperature: 'tiede',
      parDefaut: true,
    })
    expect(proposerRelance(aujourdhui, 'brulant').parDefaut).toBe(true)
  })

  it('suit les délais choisis dans Réglages', () => {
    const delais = { ...DELAIS_PAR_DEFAUT, chaud: '3j', tiede: '2s', veille: '12m' }
    expect(proposerRelance(aujourdhui, 'chaud', delais).echeance).toBe('2026-11-20')
    expect(proposerRelance(aujourdhui, 'tiede', delais).echeance).toBe('2026-12-01')
    expect(proposerRelance(aujourdhui, 'veille', delais).echeance).toBe('2027-11-17')
    expect(proposerRelance(aujourdhui, null, delais).echeance).toBe('2026-12-01')
  })

  it('remplace un délai illisible par celui par défaut', () => {
    const delais = { ...DELAIS_PAR_DEFAUT, froid: 'n’importe quoi' }
    expect(proposerRelance(aujourdhui, 'froid', delais)).toMatchObject({
      echeance: '2027-02-17',
      delai: '3m',
    })
  })

  it('compte depuis aujourd’hui, en fin de mois comme ailleurs', () => {
    expect(proposerRelance('2027-01-31', 'tiede').echeance).toBe('2027-02-28')
    expect(proposerRelance('2026-12-28', 'chaud').echeance).toBe('2027-01-04')
  })
})

describe('delaisLisibles', () => {
  it('complète ce qui manque ou est illisible', () => {
    expect(delaisLisibles({ chaud: '2s', tiede: 'x' })).toEqual({
      chaud: '2s',
      tiede: '1m',
      froid: '3m',
      veille: '6m',
    })
  })
})
