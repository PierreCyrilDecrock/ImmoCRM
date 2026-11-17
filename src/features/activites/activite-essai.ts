import type { Activite } from './activites'

/** Fabrique une activité complète pour les tests ; `valeurs` remplace ce qui doit différer. */
export function activiteEssai(valeurs: Partial<Activite> = {}): Activite {
  return {
    id: '00000000-0000-4000-8000-0000000000d1',
    user_id: '00000000-0000-4000-8000-0000000000aa',
    created_at: '2026-11-17T09:00:00Z',
    updated_at: '2026-11-17T09:00:00Z',
    archived_at: null,
    type: 'appel',
    resultat: null,
    compte_rendu: '',
    date_activite: '2026-11-17',
    heure: '10:00:00',
    duree: null,
    contact_id: null,
    bien_id: null,
    projet_vendeur_id: null,
    ...valeurs,
  }
}
