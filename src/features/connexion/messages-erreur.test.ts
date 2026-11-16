import { describe, expect, it } from 'vitest'
import { messageErreurConnexion, validerNouveauMotDePasse } from './messages-erreur'

describe('messageErreurConnexion', () => {
  it('annonce un mauvais courriel ou mot de passe sans dire lequel', () => {
    expect(messageErreurConnexion({ code: 'invalid_credentials', status: 400 })).toBe(
      'Courriel ou mot de passe incorrect.',
    )
  })

  it('demande de patienter après trop de tentatives', () => {
    expect(messageErreurConnexion({ code: 'over_request_rate_limit' })).toContain('Patientez')
    expect(messageErreurConnexion({ status: 429 })).toContain('Patientez')
  })

  it('signale une coupure de réseau', () => {
    expect(messageErreurConnexion({ name: 'AuthRetryableFetchError', status: 0 })).toContain(
      'Internet',
    )
  })

  it('explique un mot de passe refusé', () => {
    expect(messageErreurConnexion({ code: 'weak_password' })).toContain('trop simple')
    expect(messageErreurConnexion({ code: 'same_password' })).toContain('différent')
  })

  it('donne un message général pour une erreur inconnue', () => {
    expect(messageErreurConnexion({ code: 'autre', status: 500 })).toContain('inattendue')
    expect(messageErreurConnexion({})).toContain('inattendue')
  })
})

describe('validerNouveauMotDePasse', () => {
  it('accepte un mot de passe assez long et confirmé', () => {
    expect(validerNouveauMotDePasse('motdepasse-fictif', 'motdepasse-fictif')).toBeNull()
  })

  it('refuse un mot de passe trop court', () => {
    expect(validerNouveauMotDePasse('court', 'court')).toContain('au moins 10')
  })

  it('refuse une confirmation différente', () => {
    expect(validerNouveauMotDePasse('motdepasse-fictif', 'motdepasse-fictiF')).toContain(
      'identiques',
    )
  })
})
