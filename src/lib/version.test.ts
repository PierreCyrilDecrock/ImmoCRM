import { describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import { libelleVersion, VERSION } from './version'

describe('libelleVersion', () => {
  it('met le numéro de version en forme pour l’affichage', () => {
    expect(libelleVersion('0.1.0')).toBe('Version 0.1.0')
  })

  it('ignore les espaces autour du numéro', () => {
    expect(libelleVersion(' 1.2.3 ')).toBe('Version 1.2.3')
  })
})

describe('VERSION', () => {
  it('reprend le numéro de version de package.json', () => {
    expect(VERSION).toBe(pkg.version)
  })
})
