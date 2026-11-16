import { describe, expect, it } from 'vitest'
import { environnementDepuisUrl } from './environnement'

describe('environnementDepuisUrl', () => {
  it('reconnaît le projet de test', () => {
    expect(environnementDepuisUrl('https://kgodrynbcaacteolgorr.supabase.co')).toBe('test')
    expect(environnementDepuisUrl('https://KGODRYNBCAACTEOLGORR.supabase.co/')).toBe('test')
  })

  it('traite tout autre projet comme le projet réel', () => {
    expect(environnementDepuisUrl('https://projetfictif.supabase.co')).toBe('reel')
    expect(environnementDepuisUrl('http://localhost:54321')).toBe('reel')
  })

  it('ne se laisse pas tromper par une adresse qui ressemble à celle du test', () => {
    expect(environnementDepuisUrl('https://kgodrynbcaacteolgorr.supabase.co.exemple.invalid')).toBe(
      'reel',
    )
    expect(environnementDepuisUrl('https://exemple.invalid/kgodrynbcaacteolgorr.supabase.co')).toBe(
      'reel',
    )
  })

  it('reste prudent devant une adresse illisible', () => {
    expect(environnementDepuisUrl('')).toBe('reel')
  })
})
