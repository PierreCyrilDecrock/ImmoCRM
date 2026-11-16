import { describe, expect, it } from 'vitest'
import { estCleAdministration, lireConfigSupabase } from './config-supabase'

/** Fabrique une fausse clé d'ancien format portant le rôle voulu (aucune clé réelle ici). */
function fausseCle(role: string): string {
  return `entete.${btoa(JSON.stringify({ role }))}.signature`
}

describe('estCleAdministration', () => {
  it('reconnaît une clé secrète de nouveau format', () => {
    expect(estCleAdministration('sb_secret_exemple')).toBe(true)
  })

  it("reconnaît une clé service_role d'ancien format", () => {
    expect(estCleAdministration(fausseCle('service_role'))).toBe(true)
  })

  it('accepte les clés publiques', () => {
    expect(estCleAdministration('sb_publishable_exemple')).toBe(false)
    expect(estCleAdministration(fausseCle('anon'))).toBe(false)
  })

  it('ne se prononce pas sur une clé illisible', () => {
    expect(estCleAdministration('a.b.c')).toBe(false)
  })
})

describe('lireConfigSupabase', () => {
  const url = 'https://exemple.supabase.co'
  const cle = 'sb_publishable_exemple'

  it('renvoie les réglages quand tout est renseigné', () => {
    expect(lireConfigSupabase({ VITE_SUPABASE_URL: url, VITE_SUPABASE_CLE_PUBLIQUE: cle })).toEqual(
      { ok: true, config: { url, clePublique: cle } },
    )
  })

  it('retire les espaces et la barre finale', () => {
    const lecture = lireConfigSupabase({
      VITE_SUPABASE_URL: ` ${url}/ `,
      VITE_SUPABASE_CLE_PUBLIQUE: ` ${cle} `,
    })
    expect(lecture).toEqual({ ok: true, config: { url, clePublique: cle } })
  })

  it('signale une valeur absente ou vide', () => {
    expect(lireConfigSupabase({}).ok).toBe(false)
    expect(lireConfigSupabase({ VITE_SUPABASE_URL: url }).ok).toBe(false)
    expect(lireConfigSupabase({ VITE_SUPABASE_URL: '', VITE_SUPABASE_CLE_PUBLIQUE: cle }).ok).toBe(
      false,
    )
  })

  it('refuse une adresse mal formée', () => {
    const lecture = lireConfigSupabase({
      VITE_SUPABASE_URL: 'exemple.supabase.co',
      VITE_SUPABASE_CLE_PUBLIQUE: cle,
    })
    expect(lecture.ok).toBe(false)
  })

  it("refuse une clé d'administration", () => {
    const lecture = lireConfigSupabase({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_CLE_PUBLIQUE: fausseCle('service_role'),
    })
    expect(lecture).toMatchObject({ ok: false })
    expect(lecture.ok ? '' : lecture.message).toContain("clé d'administration")
  })
})
