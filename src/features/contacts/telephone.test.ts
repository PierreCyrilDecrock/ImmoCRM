import { describe, expect, it } from 'vitest'
import {
  analyserTelephone,
  estPortable,
  formaterTelephone,
  lienAppel,
  lienSms,
  validerTelephone,
} from './telephone'

describe('analyserTelephone', () => {
  it('accepte les écritures courantes du même numéro français', () => {
    const ecritures = [
      '0639980123',
      '06 39 98 01 23',
      '06.39.98.01.23',
      '06-39-98-01-23',
      '  06 39 98 01 23  ',
      '+33639980123',
      '+33 6 39 98 01 23',
      '+33 (0)6 39 98 01 23',
      '+33 06 39 98 01 23',
      '0033639980123',
      '0033 6 39 98 01 23',
    ]
    for (const ecriture of ecritures) {
      expect(analyserTelephone(ecriture), ecriture).toEqual({ ok: true, numero: '+33639980123' })
    }
  })

  it('accepte les fixes et les numéros spéciaux à dix chiffres', () => {
    expect(analyserTelephone('01 99 00 12 34')).toEqual({ ok: true, numero: '+33199001234' })
    expect(analyserTelephone('09 99 00 12 34')).toEqual({ ok: true, numero: '+33999001234' })
    expect(analyserTelephone('0800 123 456')).toEqual({ ok: true, numero: '+33800123456' })
  })

  it('accepte un numéro étranger écrit avec son indicatif', () => {
    expect(analyserTelephone('+32 470 12 34 56')).toEqual({ ok: true, numero: '+32470123456' })
    expect(analyserTelephone('0041 79 123 45 67')).toEqual({ ok: true, numero: '+41791234567' })
  })

  it('refuse un numéro trop court ou trop long, en disant pourquoi', () => {
    expect(validerTelephone('06 39 98 01')).toMatch(/incomplet/)
    expect(validerTelephone('06 39 98 01 23 4')).toMatch(/trop long/)
    expect(validerTelephone('+33 6 39 98 01')).toMatch(/incomplet/)
    expect(validerTelephone('+33 6 39 98 01 23 45')).toMatch(/trop long/)
  })

  it('refuse ce qui ne peut pas être un numéro', () => {
    expect(validerTelephone('')).not.toBeNull()
    expect(validerTelephone('   ')).not.toBeNull()
    expect(validerTelephone('6 39 98 01 23')).not.toBeNull()
    expect(validerTelephone('639980123')).not.toBeNull()
    expect(validerTelephone('+33 0 39 98 01 2')).not.toBeNull()
    expect(validerTelephone('+0 12 34 56 78')).not.toBeNull()
    expect(validerTelephone('+1 234')).not.toBeNull()
  })

  it('refuse les lettres et les signes inattendus', () => {
    expect(validerTelephone('06 39 98 O1 23')).toMatch(/chiffres/)
    expect(validerTelephone('appeler le soir')).toMatch(/chiffres/)
    expect(validerTelephone('06+39980123')).toMatch(/chiffres/)
  })

  it('valide sans message un numéro correct', () => {
    expect(validerTelephone('06 39 98 01 23')).toBeNull()
  })
})

describe('formaterTelephone', () => {
  it('affiche un numéro français par paires de chiffres', () => {
    expect(formaterTelephone('+33639980123')).toBe('06 39 98 01 23')
    expect(formaterTelephone('0639980123')).toBe('06 39 98 01 23')
    expect(formaterTelephone('+33199001234')).toBe('01 99 00 12 34')
  })

  it('garde l’écriture internationale pour un numéro étranger', () => {
    expect(formaterTelephone('+32470123456')).toBe('+32470123456')
  })

  it('rend tel quel un texte qui n’est pas un numéro', () => {
    expect(formaterTelephone(' 0639 ')).toBe('0639')
  })

  it('redonne le même numéro quand on analyse ce qui est affiché', () => {
    const affiche = formaterTelephone('+33639980123')
    expect(analyserTelephone(affiche)).toEqual({ ok: true, numero: '+33639980123' })
  })
})

describe('estPortable', () => {
  it('reconnaît les 06 et 07', () => {
    expect(estPortable('+33639980123')).toBe(true)
    expect(estPortable('07 00 00 00 00')).toBe(true)
  })

  it('écarte les fixes, les numéros étrangers et les saisies invalides', () => {
    expect(estPortable('01 99 00 12 34')).toBe(false)
    expect(estPortable('+32470123456')).toBe(false)
    expect(estPortable('06 39')).toBe(false)
  })
})

describe('liens', () => {
  it('fabrique les liens tel: et sms: au format international', () => {
    expect(lienAppel('06 39 98 01 23')).toBe('tel:+33639980123')
    expect(lienSms('+33639980123')).toBe('sms:+33639980123')
  })

  it('retire les espaces d’un numéro non reconnu plutôt que de casser le lien', () => {
    expect(lienAppel('06 39')).toBe('tel:0639')
  })
})
