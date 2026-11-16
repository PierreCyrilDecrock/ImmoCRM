import { describe, expect, it } from 'vitest'
import { adresseDeRetour, analyserRetourCourriel } from './retour-courriel'

describe('analyserRetourCourriel', () => {
  it("ignore les adresses normales de l'application", () => {
    expect(analyserRetourCourriel('')).toBeNull()
    expect(analyserRetourCourriel('#')).toBeNull()
    expect(analyserRetourCourriel('#/')).toBeNull()
    expect(analyserRetourCourriel('#/contacts?type=recovery')).toBeNull()
  })

  it('reconnaît un lien de récupération de mot de passe', () => {
    expect(
      analyserRetourCourriel('#access_token=faux-jeton&refresh_token=x&type=recovery'),
    ).toEqual({ type: 'recuperation' })
  })

  it('ne confond pas un autre type de lien avec une récupération', () => {
    expect(analyserRetourCourriel('#access_token=faux-jeton&type=magiclink')).toBeNull()
  })

  it('explique un lien expiré', () => {
    const retour = analyserRetourCourriel(
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid',
    )
    expect(retour?.type).toBe('erreur')
    expect(retour?.type === 'erreur' ? retour.message : '').toContain('expiré')
  })

  it('signale toute autre erreur en français', () => {
    const retour = analyserRetourCourriel('#error=server_error&error_description=Oops')
    expect(retour).toEqual({
      type: 'erreur',
      message:
        "Ce lien n'a pas fonctionné. Demandez un nouveau courriel avec « Mot de passe oublié ».",
    })
  })
})

describe('adresseDeRetour', () => {
  it('garde le sous-dossier du site et retire le reste', () => {
    expect(adresseDeRetour({ origin: 'https://exemple.github.io', pathname: '/ImmoCRM/' })).toBe(
      'https://exemple.github.io/ImmoCRM/',
    )
    expect(adresseDeRetour({ origin: 'http://localhost:5173', pathname: '/' })).toBe(
      'http://localhost:5173/',
    )
  })
})
