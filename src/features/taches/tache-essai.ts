import type { Tache } from './taches'

/** Fabrique une tâche complète pour les tests ; `valeurs` remplace ce qui doit différer. */
export function tacheEssai(valeurs: Partial<Tache> = {}): Tache {
  return {
    id: '00000000-0000-4000-8000-0000000000c1',
    user_id: '00000000-0000-4000-8000-0000000000aa',
    created_at: '2026-11-16T09:00:00Z',
    updated_at: '2026-11-16T09:00:00Z',
    archived_at: null,
    titre: 'Rappeler pour l’estimation',
    motif: '',
    categorie: 'relance',
    priorite: 2,
    echeance: '2026-11-17',
    heure: null,
    duree: null,
    lieu: '',
    etat: 'a_faire',
    cloturee_le: null,
    contact_id: null,
    bien_id: null,
    recurrence: null,
    recurrence_ancre: null,
    recurrence_rang: 0,
    ...valeurs,
  }
}
